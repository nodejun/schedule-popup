/**
 * YouTube DOM 셀렉터 중앙 관리
 *
 * YouTube는 SPA이며 Polymer 기반 Web Components를 사용한다.
 * DOM 구조가 빌드마다 변경될 수 있으므로,
 * 하나의 요소에 대해 여러 셀렉터를 배열로 관리한다.
 * 첫 번째 매칭되는 것을 사용하고, 실패 시 다음으로 폴백한다.
 *
 * YouTube DOM이 변경되면 이 파일만 수정하면 된다.
 */

export const SELECTORS = {
  /** 홈 피드의 Shorts 선반 (가로 스크롤 세로 썸네일 영역) */
  SHORTS_SHELF: [
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    '[is-shorts].ytd-rich-shelf-renderer',
  ] as const,

  /** 왼쪽 사이드바 (확장) Shorts 링크 */
  SIDEBAR_SHORTS: [
    'ytd-guide-entry-renderer a[title="Shorts"]',
    'ytd-guide-entry-renderer a[href="/shorts"]',
  ] as const,

  /** 왼쪽 사이드바 (미니, 축소) Shorts 링크 */
  SIDEBAR_MINI_SHORTS: [
    'ytd-mini-guide-entry-renderer a[title="Shorts"]',
    'ytd-mini-guide-entry-renderer a[href="/shorts"]',
  ] as const,

  /** 메인 콘텐츠 영역 */
  CONTENT_AREA: [
    'ytd-page-manager',
    '#page-manager',
  ] as const,

  /** YouTube 다크 테마 감지 */
  DARK_THEME: [
    'html[dark]',
    'ytd-app[darker-dark-theme]',
  ] as const,

  /** Shorts 페이지 콘텐츠 */
  SHORTS_PAGE_CONTENT: [
    'ytd-shorts',
    'ytd-reel-video-renderer',
  ] as const,

  /** 홈 피드 컨테이너 */
  HOME_FEED: [
    'ytd-rich-grid-renderer',
    'ytd-two-column-browse-results-renderer',
  ] as const,

  /** YouTube 메인 콘텐츠 영역 (사이드바 제외) */
  PRIMARY_CONTENT: [
    'ytd-page-manager #primary',
    'ytd-browse #primary',
    '#primary',
    'ytd-page-manager',
  ] as const,
} as const

/** Shorts 관련 URL 패턴 */
export const SHORTS_PATH_PATTERN = /^\/shorts/
