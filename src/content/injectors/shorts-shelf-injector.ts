/**
 * Shorts 선반 교체 모듈
 *
 * YouTube 홈 피드에서 Shorts 선반(가로 스크롤 세로 썸네일)을 감지하고,
 * 미니 스케줄러 위젯으로 교체한다.
 *
 * 동작 흐름:
 * 1. MutationObserver로 홈 피드 DOM 변경 감시
 * 2. Shorts 선반이 추가되면 감지
 * 3. 해당 선반을 숨기고 Shadow DOM 위젯을 삽입
 * 4. 페이지 이동 시 정리
 *
 * YouTube 홈 피드 구조:
 * ```
 * ytd-rich-grid-renderer (홈 피드 컨테이너)
 *   ├── ytd-rich-grid-row
 *   │   └── ytd-rich-item-renderer (일반 비디오)
 *   ├── ytd-rich-shelf-renderer[is-shorts]  ← 이것을 교체!
 *   │   └── (가로 스크롤 Shorts 썸네일들)
 *   └── ...
 * ```
 */

import { SELECTORS } from '../utils/youtube-selectors'
import {
  findAllElements,
  replaceWithElement,
  restoreHiddenElements,
  createShadowContainer,
} from '../utils/dom-helpers'
import { getSharedSheet } from '../shared-styles'

/** Injector 상태 */
interface ShortsShelfInjector {
  /** Shorts 선반 감시 시작 */
  readonly start: () => void
  /** 감시 중지 및 원래 UI 복원 */
  readonly stop: () => void
}

/** 위젯 렌더러 함수 타입 (Phase 3에서 React 컴포넌트 연결) */
export type WidgetRenderer = (mountPoint: HTMLDivElement) => void

/**
 * Shorts 선반 Injector를 생성한다.
 *
 * @param renderWidget - Shadow DOM 마운트 포인트에 React 위젯을 렌더링하는 함수
 *                       Phase 3에서 구현 예정. 지금은 플레이스홀더.
 * @returns start/stop 메서드
 */
export const createShortsShelfInjector = (
  renderWidget: WidgetRenderer
): ShortsShelfInjector => {
  let observer: MutationObserver | null = null

  /**
   * 아직 교체되지 않은 Shorts 선반을 찾아 교체한다.
   *
   * data-short-scheduler-hidden 속성이 없는 것만 대상으로 하여
   * 이미 교체된 선반을 중복 처리하지 않는다.
   */
  const processShortsShelves = (): void => {
    const shelves = findAllElements(SELECTORS.SHORTS_SHELF)

    for (const shelf of shelves) {
      // 이미 처리된 선반은 건너뛰기
      if (shelf.hasAttribute('data-short-scheduler-hidden')) {
        continue
      }

      // Shadow DOM 컨테이너 생성 (공유 스타일시트 적용)
      const { host, mountPoint } = createShadowContainer('shelf-widget', [
        getSharedSheet(),
      ])

      // 위젯이 YouTube 피드 너비에 맞도록 스타일 설정
      host.style.width = '100%'
      host.style.maxWidth = '100%'
      host.style.padding = '12px 0'

      // 선반을 숨기고 위젯 삽입
      replaceWithElement(shelf, host)

      // React 위젯 렌더링 위임
      renderWidget(mountPoint)
    }
  }

  const start = (): void => {
    // 이미 존재하는 선반 즉시 처리
    processShortsShelves()

    // DOM 변경 감시 (스크롤로 새 선반이 추가될 수 있음)
    observer = new MutationObserver(() => {
      processShortsShelves()
    })

    // 홈 피드 컨테이너 또는 body를 감시
    const watchTarget = document.querySelector('ytd-page-manager') ?? document.body

    observer.observe(watchTarget, {
      childList: true,
      subtree: true,
    })
  }

  const stop = (): void => {
    // MutationObserver 해제
    if (observer) {
      observer.disconnect()
      observer = null
    }

    // 숨긴 Shorts 선반 복원, 삽입한 위젯 제거
    restoreHiddenElements()
  }

  return { start, stop } as const
}
