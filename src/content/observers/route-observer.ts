/**
 * YouTube SPA 라우트 변경 감지기
 *
 * YouTube는 SPA이므로 페이지 이동 시 전체 새로고침이 일어나지 않는다.
 * URL 변경을 감지하기 위해 3가지 전략을 조합한다:
 *
 * 1. yt-navigate-finish: YouTube 내부 커스텀 이벤트 (가장 신뢰성 높음)
 * 2. popstate: 브라우저 뒤로/앞으로 버튼
 * 3. History API 패치: pushState/replaceState 호출 감지
 *
 * 사용 예:
 * ```ts
 * const observer = createRouteObserver((route) => {
 *   if (route === 'home') showMiniWidget()
 *   if (route === 'shorts') showFullScheduler()
 * })
 * observer.start()
 * ```
 */

import { SHORTS_PATH_PATTERN } from '../utils/youtube-selectors'

/** YouTube 페이지 타입 */
export type YouTubeRoute = 'home' | 'shorts' | 'watch' | 'other'

/** 라우트 변경 콜백 */
export type RouteChangeCallback = (route: YouTubeRoute, url: string) => void

/**
 * 현재 URL에서 YouTube 라우트 타입을 판별한다.
 *
 * YouTube URL 패턴:
 * - / 또는 /feed/... → 홈 (Shorts 선반이 있는 곳)
 * - /shorts/... → Shorts 페이지 (전체 교체 대상)
 * - /watch?v=... → 동영상 시청 (건드리지 않음)
 * - 그 외 → 기타
 */
export const detectRoute = (url: string = window.location.href): YouTubeRoute => {
  const pathname = new URL(url).pathname

  if (pathname === '/' || pathname.startsWith('/feed')) {
    return 'home'
  }

  if (SHORTS_PATH_PATTERN.test(pathname)) {
    return 'shorts'
  }

  if (pathname.startsWith('/watch')) {
    return 'watch'
  }

  return 'other'
}

/** RouteObserver 인터페이스 */
interface RouteObserver {
  /** 감시 시작. 현재 라우트로 즉시 콜백 호출 */
  readonly start: () => void
  /** 감시 중지. 모든 이벤트 리스너 정리 */
  readonly stop: () => void
  /** 현재 라우트 반환 */
  readonly getCurrentRoute: () => YouTubeRoute
}

/**
 * YouTube 라우트 변경 감지기를 생성한다.
 *
 * 내부적으로 3가지 감지 전략을 동시에 사용:
 *
 * ### 1. yt-navigate-finish (YouTube 전용)
 * YouTube의 Polymer 프레임워크가 내부 네비게이션 완료 시 발생시키는 이벤트.
 * 가장 정확하지만, YouTube 내부 구현에 의존하므로 언제든 변경 가능.
 *
 * ### 2. popstate (브라우저 표준)
 * 사용자가 브라우저 뒤로/앞으로 버튼을 누를 때 발생.
 * yt-navigate-finish와 중복 발생할 수 있지만, 중복 호출을 방지함.
 *
 * ### 3. History API Monkey Patch
 * YouTube가 pushState/replaceState를 호출할 때를 감지.
 * 원래 함수를 보관 → 래핑 함수로 교체 → 원래 함수 호출 후 콜백 실행.
 * stop() 시 원래 함수로 복원한다.
 *
 * @param callback - 라우트 변경 시 호출될 함수
 * @returns start/stop 메서드를 가진 Observer 객체
 */
export const createRouteObserver = (
  callback: RouteChangeCallback
): RouteObserver => {
  let currentRoute: YouTubeRoute = detectRoute()
  let isRunning = false

  // 원본 History 메서드 보관 (stop 시 복원용)
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  /**
   * 라우트 변경을 처리한다.
   * 이전 라우트와 같으면 무시 (중복 호출 방지).
   */
  const handleRouteChange = (): void => {
    const newRoute = detectRoute()
    if (newRoute !== currentRoute) {
      currentRoute = newRoute
      callback(currentRoute, window.location.href)
    }
  }

  /** yt-navigate-finish 이벤트 핸들러 */
  const onYtNavigate = (): void => {
    handleRouteChange()
  }

  /** popstate 이벤트 핸들러 */
  const onPopState = (): void => {
    handleRouteChange()
  }

  /**
   * History API를 패치한다.
   *
   * Monkey Patching은 일반적으로 안티패턴이지만,
   * Content Script에서 SPA의 네비게이션을 감지하는
   * 사실상 유일한 방법이다.
   */
  const patchHistoryApi = (): void => {
    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      originalPushState(...args)
      // pushState 직후에는 URL이 이미 변경된 상태
      handleRouteChange()
    }

    history.replaceState = (
      ...args: Parameters<typeof history.replaceState>
    ) => {
      originalReplaceState(...args)
      handleRouteChange()
    }
  }

  /** History API 패치를 원래대로 복원한다 */
  const restoreHistoryApi = (): void => {
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
  }

  const start = (): void => {
    if (isRunning) return
    isRunning = true

    // 이벤트 리스너 등록
    document.addEventListener('yt-navigate-finish', onYtNavigate)
    window.addEventListener('popstate', onPopState)

    // History API 패치
    patchHistoryApi()

    // 현재 라우트로 즉시 콜백 (초기 상태 설정)
    currentRoute = detectRoute()
    callback(currentRoute, window.location.href)
  }

  const stop = (): void => {
    if (!isRunning) return
    isRunning = false

    // 이벤트 리스너 제거
    document.removeEventListener('yt-navigate-finish', onYtNavigate)
    window.removeEventListener('popstate', onPopState)

    // History API 복원
    restoreHistoryApi()
  }

  const getCurrentRoute = (): YouTubeRoute => currentRoute

  return { start, stop, getCurrentRoute } as const
}
