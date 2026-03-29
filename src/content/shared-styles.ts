/**
 * Shadow DOM 공유 스타일시트 모듈
 *
 * Adoptable Stylesheets 패턴을 사용하여 모든 Shadow DOM이
 * 하나의 CSSStyleSheet 객체를 참조로 공유한다.
 *
 * 동작 원리:
 * 1. Vite의 `?inline` suffix로 content.css를 빌드 시 문자열로 추출
 * 2. CSSStyleSheet 객체를 한 번만 생성하고 replaceSync로 CSS 로드
 * 3. 각 Shadow DOM에서 shadowRoot.adoptedStyleSheets = [sheet]로 참조
 *
 * 장점:
 * - 메모리 효율: CSS 파싱이 한 번만 발생
 * - 성능: 여러 Shadow DOM이 같은 stylesheet 객체 공유
 * - Chrome Extension에서 100% 지원 (Chrome 73+, MV3는 Chrome 88+)
 */

// Vite ?inline: CSS를 컴파일한 후 JS 문자열로 번들링
// 런타임에는 Tailwind가 컴파일된 순수 CSS 텍스트가 된다
import contentCssText from '@/styles/content.css?inline'

/**
 * 공유 CSSStyleSheet 싱글턴
 *
 * 모듈이 처음 import될 때 한 번만 생성된다.
 * 이후 모든 import는 같은 객체를 참조한다 (ES Module 특성).
 */
const sharedSheet = new CSSStyleSheet()
sharedSheet.replaceSync(contentCssText)

/**
 * Shadow DOM에 공유 스타일시트를 적용한다.
 *
 * @param shadowRoot - 스타일을 적용할 Shadow Root
 *
 * @example
 * ```ts
 * const { shadowRoot, mountPoint } = createShadowContainer('widget')
 * applySharedStyles(shadowRoot)
 * ```
 */
export const applySharedStyles = (shadowRoot: ShadowRoot): void => {
  shadowRoot.adoptedStyleSheets = [sharedSheet]
}

/**
 * 공유 스타일시트 객체를 직접 가져온다.
 *
 * 대부분의 경우 applySharedStyles()를 사용하면 되지만,
 * 추가 stylesheet과 합쳐야 할 때 이 함수를 사용한다.
 *
 * @example
 * ```ts
 * const customSheet = new CSSStyleSheet()
 * customSheet.replaceSync('.my-class { color: red; }')
 * shadowRoot.adoptedStyleSheets = [getSharedSheet(), customSheet]
 * ```
 */
export const getSharedSheet = (): CSSStyleSheet => sharedSheet
