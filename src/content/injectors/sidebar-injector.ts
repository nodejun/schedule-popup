/**
 * 사이드바 Shorts 버튼 수정 모듈
 *
 * YouTube 왼쪽 사이드바의 "Shorts" 버튼을 "Schedule"로 변경한다.
 *
 * YouTube 사이드바 구조 (2가지 형태):
 *
 * 1. 확장 사이드바 (ytd-guide-renderer):
 *    ```
 *    ytd-guide-entry-renderer
 *      └── a[title="Shorts"]
 *          ├── yt-icon (아이콘)
 *          └── span.title (텍스트: "Shorts")
 *    ```
 *
 * 2. 미니 사이드바 (ytd-mini-guide-renderer):
 *    ```
 *    ytd-mini-guide-entry-renderer
 *      └── a[title="Shorts"]
 *          ├── yt-icon (아이콘)
 *          └── span.title (텍스트: "Shorts")
 *    ```
 *
 * 변경 내용:
 * - 텍스트: "Shorts" → "Schedule"
 * - 아이콘: Shorts 아이콘 → 캘린더 아이콘 (SVG 교체)
 * - 클릭 동작: /shorts → 커스텀 핸들러 (스케줄러 페이지 표시)
 */

import { SELECTORS } from "../utils/youtube-selectors";
import { findElement } from "../utils/dom-helpers";

/** 캘린더 아이콘 SVG (YouTube 아이콘 스타일과 통일) */
const CALENDAR_ICON_SVG = `
<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"
     style="width: 24px; height: 24px; fill: currentColor;">
  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1
           0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
  <rect x="7" y="12" width="2" height="2"/>
  <rect x="11" y="12" width="2" height="2"/>
  <rect x="15" y="12" width="2" height="2"/>
  <rect x="7" y="16" width="2" height="2"/>
  <rect x="11" y="16" width="2" height="2"/>
</svg>
`.trim();

/** 사이드바 클릭 핸들러 타입 */
export type SidebarClickHandler = () => void;

/** Sidebar Injector 인터페이스 */
interface SidebarInjector {
  readonly start: () => void;
  readonly stop: () => void;
}

/**
 * 사이드바 링크를 수정한다.
 *
 * @param selectors - 대상 셀렉터 배열
 * @param onClick - Shorts 대신 실행할 클릭 핸들러
 */
const modifySidebarLink = (
  selectors:
    | typeof SELECTORS.SIDEBAR_SHORTS
    | typeof SELECTORS.SIDEBAR_MINI_SHORTS,
  onClick: SidebarClickHandler,
): void => {
  const link = findElement(selectors) as HTMLAnchorElement | null;
  if (!link) return;

  // 이미 수정된 경우 건너뛰기
  if (link.hasAttribute("data-short-scheduler-modified")) return;
  link.setAttribute("data-short-scheduler-modified", "true");

  // 원본 정보 저장 (복원용)
  link.setAttribute("data-original-title", link.title);
  link.setAttribute("data-original-href", link.href);

  // 텍스트 변경
  link.title = "Schedule";
  const titleSpan = link.querySelector(".title, yt-formatted-string");
  if (titleSpan) {
    titleSpan.textContent = "Schedule";
  }

  // 아이콘 변경
  const iconContainer = link.querySelector("yt-icon");
  if (iconContainer) {
    // 원본 아이콘 HTML 저장
    iconContainer.setAttribute("data-original-icon", iconContainer.innerHTML);
    iconContainer.innerHTML = CALENDAR_ICON_SVG;
  }

  // 클릭 동작 변경
  // href를 제거하여 기본 네비게이션 방지
  link.removeAttribute("href");
  link.style.cursor = "pointer";

  // 클릭 이벤트 핸들러 등록
  const handleClick = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };
  link.addEventListener("click", handleClick, true);

  // 정리용으로 핸들러 참조 저장
  link.setAttribute("data-short-scheduler-handler", "true");
  (link as HTMLAnchorElement & { _scheduleClickHandler?: (e: Event) => void })[
    "_scheduleClickHandler"
  ] = handleClick;
};

/**
 * 수정된 사이드바 링크를 원래대로 복원한다.
 */
const restoreSidebarLinks = (): void => {
  const modified = document.querySelectorAll(
    '[data-short-scheduler-modified="true"]',
  );

  modified.forEach((link) => {
    const anchor = link as HTMLAnchorElement & {
      _scheduleClickHandler?: (e: Event) => void;
    };

    // 원본 텍스트 복원
    const originalTitle = anchor.getAttribute("data-original-title");
    if (originalTitle) {
      anchor.title = originalTitle;
      const titleSpan = anchor.querySelector(".title, yt-formatted-string");
      if (titleSpan) {
        titleSpan.textContent = originalTitle;
      }
    }

    // 원본 href 복원
    const originalHref = anchor.getAttribute("data-original-href");
    if (originalHref) {
      anchor.href = originalHref;
    }

    // 원본 아이콘 복원
    const iconContainer = anchor.querySelector("yt-icon");
    if (iconContainer) {
      const originalIcon = iconContainer.getAttribute("data-original-icon");
      if (originalIcon) {
        iconContainer.innerHTML = originalIcon;
        iconContainer.removeAttribute("data-original-icon");
      }
    }

    // 클릭 핸들러 제거
    if (anchor._scheduleClickHandler) {
      anchor.removeEventListener("click", anchor._scheduleClickHandler, true);
      delete anchor._scheduleClickHandler;
    }

    // 정리 속성 제거
    anchor.removeAttribute("data-short-scheduler-modified");
    anchor.removeAttribute("data-original-title");
    anchor.removeAttribute("data-original-href");
    anchor.removeAttribute("data-short-scheduler-handler");
    anchor.style.cursor = "";
  });
};

/**
 * 사이드바 Injector를 생성한다.
 *
 * YouTube 사이드바는 페이지 이동 후 재렌더링될 수 있으므로
 * MutationObserver로 지속 감시한다.
 *
 * @param onClick - Schedule 버튼 클릭 시 실행할 핸들러
 * @returns start/stop 메서드
 */
export const createSidebarInjector = (
  onClick: SidebarClickHandler,
): SidebarInjector => {
  let observer: MutationObserver | null = null;

  const processSidebar = (): void => {
    modifySidebarLink(SELECTORS.SIDEBAR_SHORTS, onClick);
    modifySidebarLink(SELECTORS.SIDEBAR_MINI_SHORTS, onClick);
  };

  const start = (): void => {
    // 즉시 처리
    processSidebar();

    // 사이드바 DOM 변경 감시
    observer = new MutationObserver(() => {
      processSidebar();
    });

    // guide 컨테이너 또는 body 감시
    const guide = document.querySelector("ytd-app") ?? document.body;

    observer.observe(guide, {
      childList: true,
      subtree: true,
    });
  };

  const stop = (): void => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    restoreSidebarLinks();
  };

  return { start, stop } as const;
};
