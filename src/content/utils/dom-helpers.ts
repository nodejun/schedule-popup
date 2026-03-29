/**
 * DOM 유틸리티 함수
 *
 * YouTube는 SPA(Single Page Application)이므로
 * 일반적인 querySelector로는 요소를 바로 찾을 수 없는 경우가 많다.
 *
 * 이 모듈은 다음 문제를 해결한다:
 * 1. 셀렉터 폴백: 여러 셀렉터 중 첫 번째 매칭을 반환
 * 2. 비동기 대기: 요소가 DOM에 나타날 때까지 MutationObserver로 관찰
 * 3. Shadow DOM: React 위젯을 YouTube CSS와 격리
 */

import type { SELECTORS } from './youtube-selectors'

/** SELECTORS 객체의 값 타입 (readonly string[]) */
type SelectorList = (typeof SELECTORS)[keyof typeof SELECTORS]

/**
 * 여러 셀렉터 중 첫 번째로 매칭되는 요소를 반환한다.
 *
 * YouTube DOM은 빌드마다 구조가 변할 수 있으므로,
 * 하나의 요소에 대해 여러 셀렉터를 시도하는 폴백 전략을 사용한다.
 *
 * @param selectors - youtube-selectors.ts에서 가져온 셀렉터 배열
 * @param root - 검색 시작 노드 (기본값: document)
 * @returns 매칭된 요소 또는 null
 *
 * @example
 * ```ts
 * import { SELECTORS } from './youtube-selectors'
 * const shelf = findElement(SELECTORS.SHORTS_SHELF)
 * ```
 */
export const findElement = (
  selectors: SelectorList,
  root: ParentNode = document
): Element | null => {
  for (const selector of selectors) {
    const el = root.querySelector(selector)
    if (el) return el
  }
  return null
}

/**
 * 여러 셀렉터에 매칭되는 모든 요소를 반환한다.
 *
 * @param selectors - 셀렉터 배열
 * @param root - 검색 시작 노드
 * @returns 매칭된 모든 요소 배열 (중복 제거)
 */
export const findAllElements = (
  selectors: SelectorList,
  root: ParentNode = document
): Element[] => {
  const found = new Set<Element>()

  for (const selector of selectors) {
    const elements = root.querySelectorAll(selector)
    elements.forEach((el) => found.add(el))
  }

  return [...found]
}

/** waitForElement 옵션 */
interface WaitForElementOptions {
  /** 타임아웃 (ms). 기본값 10000 (10초) */
  readonly timeout?: number
  /** 감시할 루트 노드. 기본값 document.body */
  readonly root?: Node
}

/**
 * 요소가 DOM에 나타날 때까지 기다린다.
 *
 * YouTube는 SPA이므로 페이지 이동 시 DOM이 점진적으로 구성된다.
 * 이 함수는 MutationObserver를 사용해 요소가 추가되는 순간을 감지한다.
 *
 * 동작 원리:
 * 1. 먼저 즉시 검색을 시도 (이미 존재할 수 있으므로)
 * 2. 없으면 MutationObserver로 DOM 변경을 감시
 * 3. 변경이 감지될 때마다 셀렉터를 다시 시도
 * 4. 타임아웃 초과 시 null 반환
 *
 * @param selectors - 기다릴 요소의 셀렉터 배열
 * @param options - 타임아웃, 루트 노드 설정
 * @returns 찾은 요소 또는 타임아웃 시 null
 */
export const waitForElement = (
  selectors: SelectorList,
  options: WaitForElementOptions = {}
): Promise<Element | null> => {
  const { timeout = 10_000, root = document.body } = options

  return new Promise((resolve) => {
    // 1단계: 즉시 검색 시도
    const existing = findElement(selectors)
    if (existing) {
      resolve(existing)
      return
    }

    // 2단계: MutationObserver로 DOM 변경 감시
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const observer = new MutationObserver(() => {
      const el = findElement(selectors)
      if (el) {
        cleanup()
        resolve(el)
      }
    })

    const cleanup = (): void => {
      observer.disconnect()
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    // 3단계: 타임아웃 설정
    timeoutId = setTimeout(() => {
      cleanup()
      resolve(null)
    }, timeout)

    // childList: 자식 노드 추가/제거 감시
    // subtree: 모든 하위 노드까지 감시 (YouTube DOM은 깊은 구조)
    observer.observe(root, {
      childList: true,
      subtree: true,
    })
  })
}

/** Shadow DOM 컨테이너 생성 결과 */
interface ShadowContainer {
  /** 호스트 요소 (YouTube DOM에 삽입되는 외부 요소) */
  readonly host: HTMLDivElement
  /** Shadow Root (React가 렌더링할 격리된 공간) */
  readonly shadowRoot: ShadowRoot
  /** React 마운트 포인트 (shadowRoot 내부의 div) */
  readonly mountPoint: HTMLDivElement
}

/**
 * Shadow DOM 컨테이너를 생성한다.
 *
 * Chrome 확장프로그램에서 React 위젯을 호스트 페이지에 삽입할 때,
 * 호스트 페이지의 CSS가 위젯 스타일을 오염시킬 수 있다.
 * Shadow DOM은 이를 완전히 격리해 준다.
 *
 * CSS 주입 방식: Adoptable Stylesheets
 * - CSSStyleSheet 객체를 shadowRoot.adoptedStyleSheets로 참조
 * - 여러 Shadow DOM이 같은 CSSStyleSheet 객체를 공유하여 메모리 효율적
 * - Chrome 73+ 지원 (MV3는 Chrome 88+ 이상이므로 100% 호환)
 *
 * 구조:
 * ```
 * <div id="short-scheduler-{id}">     ← host (YouTube DOM에 삽입)
 *   #shadow-root (open)               ← shadowRoot
 *     adoptedStyleSheets: [sheet]     ← 공유 스타일시트 참조
 *     <div id="mount-point">          ← mountPoint (React 렌더링 대상)
 *     </div>
 * ```
 *
 * @param id - 컨테이너 고유 식별자 (여러 위젯 구분용)
 * @param stylesheets - Shadow DOM에 적용할 CSSStyleSheet 배열 (선택)
 * @returns host, shadowRoot, mountPoint
 */
export const createShadowContainer = (
  id: string,
  stylesheets?: ReadonlyArray<CSSStyleSheet>
): ShadowContainer => {
  const host = document.createElement('div')
  host.id = `short-scheduler-${id}`
  // YouTube의 CSS가 host 자체에는 적용될 수 있으므로 최소한의 리셋
  host.style.all = 'initial'
  host.style.display = 'block'

  const shadowRoot = host.attachShadow({ mode: 'open' })

  // Adoptable Stylesheets로 스타일 주입
  // 여러 Shadow DOM이 같은 CSSStyleSheet 객체를 참조 → 메모리 절약
  if (stylesheets && stylesheets.length > 0) {
    shadowRoot.adoptedStyleSheets = [...stylesheets]
  }

  // React 마운트 포인트
  const mountPoint = document.createElement('div')
  mountPoint.id = 'mount-point'
  shadowRoot.appendChild(mountPoint)

  // YouTube 글로벌 키보드 단축키 차단
  // YouTube는 document 레벨에서 keydown/keyup 이벤트를 수신하여
  // f(전체화면), /(검색), k(재생/일시정지) 등의 단축키를 처리한다.
  // Shadow DOM에서 발생한 키보드 이벤트가 버블링되면 YouTube가 가로채므로,
  // host 레벨에서 전파를 차단하여 스케줄러 내 입력이 정상 동작하도록 한다.
  const stopKeyboardPropagation = (e: Event): void => {
    e.stopPropagation()
  }
  host.addEventListener('keydown', stopKeyboardPropagation)
  host.addEventListener('keyup', stopKeyboardPropagation)
  host.addEventListener('keypress', stopKeyboardPropagation)

  return { host, shadowRoot, mountPoint } as const
}

/**
 * 요소를 대상 요소의 위치에 교체 삽입한다.
 *
 * Shorts 선반을 스케줄러 위젯으로 교체할 때 사용.
 * 원본 요소는 숨기고(display:none), 새 요소를 바로 앞에 삽입한다.
 * 이렇게 하면 나중에 원본을 복원할 수 있다.
 *
 * @param target - 교체 대상 (숨길 요소)
 * @param replacement - 대신 표시할 요소
 */
export const replaceWithElement = (
  target: Element,
  replacement: Element
): void => {
  // 원본 숨기기 (제거하지 않음 - 복원 가능하도록)
  ;(target as HTMLElement).style.display = 'none'
  target.setAttribute('data-short-scheduler-hidden', 'true')

  // 대상 바로 앞에 삽입
  target.parentNode?.insertBefore(replacement, target)
}

/**
 * replaceWithElement로 숨긴 요소를 복원한다.
 *
 * 확장프로그램 비활성화 시 원래 YouTube UI로 되돌릴 때 사용.
 *
 * @param container - 복원할 영역의 부모 노드
 */
export const restoreHiddenElements = (
  container: ParentNode = document
): void => {
  const hidden = container.querySelectorAll(
    '[data-short-scheduler-hidden="true"]'
  )

  hidden.forEach((el) => {
    ;(el as HTMLElement).style.display = ''
    el.removeAttribute('data-short-scheduler-hidden')
  })

  // 삽입했던 Shadow DOM 컨테이너도 제거
  const widgets = container.querySelectorAll('[id^="short-scheduler-"]')
  widgets.forEach((widget) => widget.remove())
}

/**
 * YouTube가 다크 테마인지 감지한다.
 *
 * YouTube는 html 태그에 dark 속성을 추가하는 방식으로 다크모드를 적용한다.
 * 우리 위젯도 이에 맞춰 스타일을 변경해야 한다.
 *
 * @returns 다크 테마 여부
 */
export const isDarkTheme = (): boolean => {
  return (
    document.documentElement.hasAttribute('dark') ||
    document.querySelector('ytd-app[darker-dark-theme]') !== null
  )
}
