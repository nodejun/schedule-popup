/// <reference types="vite/client" />

/**
 * Vite CSS ?inline import 타입 선언
 *
 * `import css from './style.css?inline'` 형태로 CSS를 문자열로 가져올 때
 * TypeScript가 이를 인식할 수 있도록 모듈 타입을 선언한다.
 *
 * Vite의 `?inline` suffix는 CSS를 컴파일한 뒤
 * JavaScript 문자열로 번들링해주는 기능이다.
 */
declare module '*.css?inline' {
  const css: string
  export default css
}
