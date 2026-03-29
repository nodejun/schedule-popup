/**
 * ShortScheduler - Background Service Worker
 *
 * 역할:
 * 1. /shorts 직접 접근(주소창 입력, 외부 링크) 차단 → 스케줄러 페이지로 리다이렉트
 * 2. Main World 스크립트 등록 → SPA 내부 pushState /shorts 차단
 * 3. (Phase 4) 알림 예약, 데이터 동기화
 *
 * ## /shorts 차단 전략
 *
 * ### 직접 URL 접근 (주소창, 북마크, 외부 링크)
 * chrome.webNavigation.onBeforeNavigate로 감지하여
 * chrome.tabs.update로 스케줄러 페이지로 리다이렉트한다.
 *
 * ### SPA 내부 네비게이션 (YouTube 사이드바 Shorts 클릭)
 * Main World 스크립트가 history.pushState를 가로채서 차단한다.
 * Content Script가 'ss-shorts-blocked' 이벤트를 수신하여 리다이렉트한다.
 */

/** 스케줄러 페이지 URL */
const SCHEDULER_URL = chrome.runtime.getURL('src/scheduler/index.html')

/** /shorts URL 패턴 체크 */
const isShortsUrl = (url: string): boolean => {
  try {
    const { pathname } = new URL(url)
    return pathname === '/shorts' || pathname.startsWith('/shorts/')
  } catch {
    return false
  }
}

// ── 1. 직접 URL 접근 차단 ──

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    // 메인 프레임만 처리 (iframe 무시)
    if (details.frameId !== 0) return

    if (isShortsUrl(details.url)) {
      // /shorts 접근을 스케줄러 페이지로 리다이렉트
      void chrome.tabs.update(details.tabId, { url: SCHEDULER_URL })
    }
  },
  {
    url: [
      { hostSuffix: 'youtube.com', pathPrefix: '/shorts' },
    ],
  }
)

// ── 2. Content Script 메시지 수신 ──
// Content Script가 직접 chrome.runtime.getURL()을 사용하면
// 확장프로그램 재설치 시 stale context 문제가 발생할 수 있으므로,
// 서비스 워커가 리다이렉트를 대행한다.

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'open-scheduler' && sender.tab?.id) {
    void chrome.tabs.update(sender.tab.id, { url: SCHEDULER_URL })
  }
})

// ── 3. Main World 스크립트 등록 ──

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.scripting.unregisterContentScripts({
      ids: ['shorts-navigation-blocker'],
    })
  } catch {
    // 처음 설치 시에는 해제할 스크립트가 없으므로 무시
  }

  await chrome.scripting.registerContentScripts([
    {
      id: 'shorts-navigation-blocker',
      matches: ['https://www.youtube.com/*'],
      js: ['shorts-playback-blocker.js'],
      runAt: 'document_start',
      world: 'MAIN',
    },
  ])
})
