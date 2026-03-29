/**
 * 스케줄러 인라인 Injector
 *
 * YouTube 사이드바를 유지한 채, 메인 콘텐츠 영역을 캘린더로 교체한다.
 *
 * 핵심: position:fixed 오버레이 방식 (트러블슈팅 #1에서 검증된 패턴)
 * - YouTube 레이아웃에 의존하지 않고 화면 좌표 기준으로 배치
 * - 사이드바 너비만큼 left를 띄워서 사이드바는 유지
 * - body.overflow = hidden으로 YouTube 스크롤 차단
 *
 * 주의: createShadowContainer의 host.style.all = 'initial'이
 * 이후 설정하는 inline style을 무효화할 수 있으므로,
 * 반드시 host.style.all을 해제한 후 position 스타일을 적용해야 한다.
 *
 * 구조:
 * ```
 * <body>
 *   ...YouTube DOM...
 *   <div id="short-scheduler-inline"     ← position:fixed 오버레이
 *        style="position:fixed; top:56px; left:{sidebar}px; right:0; bottom:0">
 *     #shadow-root (open)
 *       adoptedStyleSheets: [sharedSheet, inlineSheet]
 *       <div id="mount-point">
 *         <MonthlyCalendar />  ← React
 *       </div>
 *   </div>
 * </body>
 * ```
 */

import { createShadowContainer, findElement } from '../utils/dom-helpers'
import { getSharedSheet } from '../shared-styles'
import { SELECTORS } from '../utils/youtube-selectors'

/** 인라인 렌더러 함수 타입 */
export type InlineRenderer = (mountPoint: HTMLDivElement) => void

/** 인라인 언마운트 함수 타입 */
export type InlineUnmounter = (mountPoint: HTMLDivElement) => void

/** Scheduler Inline 인터페이스 */
interface SchedulerInline {
  /** 인라인 스케줄러 표시 */
  readonly show: () => void
  /** 인라인 스케줄러 숨김 → YouTube 콘텐츠 복원 */
  readonly hide: () => void
  /** 현재 표시 상태 */
  readonly isVisible: () => boolean
}

/**
 * 인라인 전용 스타일시트
 * mount-point가 fixed 오버레이 내부에서 전체를 채우도록 설정
 */
const createInlineSheet = (): CSSStyleSheet => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    #mount-point {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      #mount-point {
        background-color: #0f0f0f;
      }
    }
  `)
  return sheet
}

/**
 * YouTube 사이드바 너비를 감지한다.
 *
 * YouTube 사이드바는 두 가지 상태가 있다:
 * - 확장 상태: tp-yt-app-drawer[opened] (약 240px)
 * - 미니 상태: ytd-mini-guide-renderer (약 72px)
 */
const getSidebarWidth = (): number => {
  // 확장 사이드바 확인
  const expandedDrawer = document.querySelector(
    'tp-yt-app-drawer[opened] #guide-inner-content'
  )
  if (expandedDrawer) {
    return (expandedDrawer as HTMLElement).offsetWidth
  }

  // 미니 사이드바 확인
  const miniGuide = document.querySelector('ytd-mini-guide-renderer')
  if (miniGuide) {
    return (miniGuide as HTMLElement).offsetWidth
  }

  // 폴백: 미니 사이드바 기본 너비
  return 72
}

/**
 * 인라인 스케줄러를 생성한다.
 *
 * show()를 호출하면 YouTube 콘텐츠 영역 위에 캘린더가 표시된다.
 * 사이드바, 헤더는 그대로 유지된다.
 * hide()를 호출하면 캘린더가 사라지고 YouTube 콘텐츠가 복원된다.
 */
export const createSchedulerInline = (
  renderScheduler: InlineRenderer,
  unmountScheduler: InlineUnmounter
): SchedulerInline => {
  let visible = false
  let containerHost: HTMLDivElement | null = null
  let mountPointRef: HTMLDivElement | null = null
  let hiddenTarget: HTMLElement | null = null

  const show = (): void => {
    if (visible) return

    // YouTube 메인 콘텐츠 영역 찾기
    const primaryContent = findElement(SELECTORS.PRIMARY_CONTENT)
    if (!primaryContent) return

    // Shadow DOM 컨테이너 생성
    const inlineSheet = createInlineSheet()
    const { host, mountPoint } = createShadowContainer('inline', [
      getSharedSheet(),
      inlineSheet,
    ])

    // ⚠️ 핵심: createShadowContainer가 설정한 all:initial을 해제해야
    // 이후의 position:fixed 등 스타일이 적용된다
    host.style.all = ''

    // position:fixed 오버레이 — YouTube 헤더(56px) 아래, 사이드바 옆
    const sidebarWidth = getSidebarWidth()
    host.style.position = 'fixed'
    host.style.top = '56px'
    host.style.left = `${sidebarWidth}px`
    host.style.right = '0'
    host.style.bottom = '0'
    host.style.overflow = 'hidden'
    host.style.zIndex = '9999'
    host.style.display = 'block'

    // YouTube 콘텐츠 숨기기 (제거하지 않음 → 복원 가능)
    const target = primaryContent as HTMLElement
    target.style.display = 'none'
    target.setAttribute('data-short-scheduler-hidden', 'true')
    hiddenTarget = target

    // YouTube 본문 스크롤 잠금 (검증된 패턴: body.style.overflow)
    document.body.style.overflow = 'hidden'

    // host를 body에 직접 삽입 (YouTube 내부 레이아웃 간섭 방지)
    document.body.appendChild(host)

    containerHost = host
    mountPointRef = mountPoint
    visible = true

    // React 스케줄러 렌더링
    renderScheduler(mountPoint)
  }

  const hide = (): void => {
    if (!visible) return

    // React 언마운트
    if (mountPointRef) {
      unmountScheduler(mountPointRef)
      mountPointRef = null
    }

    // Shadow DOM 컨테이너 제거
    if (containerHost) {
      containerHost.remove()
      containerHost = null
    }

    // YouTube 콘텐츠 복원
    if (hiddenTarget) {
      hiddenTarget.style.display = ''
      hiddenTarget.removeAttribute('data-short-scheduler-hidden')
      hiddenTarget = null
    }

    // 스크롤 잠금 해제
    document.body.style.overflow = ''

    visible = false
  }

  const isVisible = (): boolean => visible

  return { show, hide, isVisible } as const
}
