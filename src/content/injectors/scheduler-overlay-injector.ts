/**
 * 스케줄러 오버레이 Injector
 *
 * YouTube 페이지 위에 풀스크린 오버레이로 스케줄러를 표시한다.
 * 페이지 이동 없이 DOM에 요소를 추가/제거만 하므로 즉시 전환된다.
 *
 * 구조:
 * ```
 * <body>
 *   ...YouTube 콘텐츠... (그대로 유지)
 *   <div id="short-scheduler-overlay" style="position:fixed; z-index:99999">
 *     #shadow-root (open)
 *       adoptedStyleSheets: [sharedSheet, overlaySheet]
 *       <div id="mount-point">
 *         <FullPageScheduler />  ← React
 *       </div>
 *   </div>
 * </body>
 * ```
 *
 * 사용법:
 * ```ts
 * const overlay = createSchedulerOverlay(renderFn, unmountFn)
 * overlay.show()  // 오버레이 표시
 * overlay.hide()  // 오버레이 숨김 → YouTube 즉시 복귀
 * ```
 */

import { createShadowContainer } from '../utils/dom-helpers'
import { getSharedSheet } from '../shared-styles'

/** 풀페이지 렌더러 함수 타입 */
export type OverlayRenderer = (mountPoint: HTMLDivElement) => void

/** 풀페이지 언마운트 함수 타입 */
export type OverlayUnmounter = (mountPoint: HTMLDivElement) => void

/** Scheduler Overlay 인터페이스 */
interface SchedulerOverlay {
  /** 오버레이 표시 */
  readonly show: () => void
  /** 오버레이 숨김 */
  readonly hide: () => void
  /** 현재 표시 상태 */
  readonly isVisible: () => boolean
}

/**
 * 오버레이 전용 스타일시트
 *
 * mount-point를 풀스크린으로 만들고 배경색을 설정한다.
 * YouTube 다크모드는 prefers-color-scheme으로 감지.
 */
const createOverlaySheet = (): CSSStyleSheet => {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(`
    #mount-point {
      min-height: 100vh;
      background-color: #fafafa;
      overflow-y: auto;
    }
    @media (prefers-color-scheme: dark) {
      #mount-point {
        background-color: #171717;
      }
    }
  `)
  return sheet
}

/**
 * 스케줄러 오버레이를 생성한다.
 *
 * show()를 호출하면 YouTube 위에 풀스크린 오버레이가 즉시 표시된다.
 * hide()를 호출하면 오버레이가 제거되고 YouTube가 즉시 복귀한다.
 */
export const createSchedulerOverlay = (
  renderScheduler: OverlayRenderer,
  unmountScheduler: OverlayUnmounter
): SchedulerOverlay => {
  let visible = false
  let containerHost: HTMLDivElement | null = null
  let mountPointRef: HTMLDivElement | null = null

  const show = (): void => {
    if (visible) return

    // Shadow DOM 컨테이너 생성 (Tailwind + 오버레이 스타일)
    const overlaySheet = createOverlaySheet()
    const { host, mountPoint } = createShadowContainer('overlay', [
      getSharedSheet(),
      overlaySheet,
    ])

    // 풀스크린 고정 위치
    host.style.all = 'initial'
    host.style.position = 'fixed'
    host.style.top = '0'
    host.style.left = '0'
    host.style.width = '100vw'
    host.style.height = '100vh'
    host.style.zIndex = '99999'
    host.style.display = 'block'

    // body 스크롤 차단
    document.body.style.overflow = 'hidden'

    // body에 직접 추가
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

    // body 스크롤 복원
    document.body.style.overflow = ''

    visible = false
  }

  const isVisible = (): boolean => visible

  return { show, hide, isVisible } as const
}
