/**
 * Shorts 네비게이션 차단 (MAIN World 스크립트)
 *
 * YouTube의 모든 페이지에서 실행되어,
 * SPA 내부 네비게이션으로 /shorts에 접근하는 것을 차단한다.
 *
 * 차단 방법:
 * - history.pushState / replaceState를 가로챈다
 * - URL이 /shorts를 포함하면 실행을 블로킹한다
 * - 'ss-shorts-blocked' 커스텀 이벤트를 발생시킨다
 * - Content Script(Isolated World)가 이벤트를 수신하여 스케줄러 페이지로 리다이렉트한다
 *
 * 직접 URL 접근(주소창 입력, 외부 링크)은 declarativeNetRequest가 처리한다.
 */
(function() {
  'use strict';

  // ── pushState / replaceState 가로채기 ──

  var realPushState = history.pushState;
  var realReplaceState = history.replaceState;

  /**
   * URL이 /shorts 경로인지 확인한다.
   *
   * @param {*} url - pushState/replaceState에 전달된 URL
   * @returns {boolean}
   */
  function isShortsUrl(url) {
    if (!url) return false;
    try {
      // 상대 경로('/shorts/xxx')와 절대 경로 모두 처리
      var resolved = new URL(url.toString(), location.href);
      return resolved.pathname === '/shorts' || resolved.pathname.startsWith('/shorts/');
    } catch(e) {
      return false;
    }
  }

  history.pushState = function(state, title, url) {
    if (isShortsUrl(url)) {
      // /shorts 네비게이션 차단 → Content Script에 알림
      window.dispatchEvent(new CustomEvent('ss-shorts-blocked'));
      return;
    }
    return realPushState.apply(this, arguments);
  };

  history.replaceState = function(state, title, url) {
    if (isShortsUrl(url)) {
      window.dispatchEvent(new CustomEvent('ss-shorts-blocked'));
      return;
    }
    return realReplaceState.apply(this, arguments);
  };

  // cleanup 함수를 전역에 노출
  window.__shortSchedulerMainCleanup = function() {
    history.pushState = realPushState;
    history.replaceState = realReplaceState;
  };
})();
