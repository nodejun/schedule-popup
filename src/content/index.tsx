/**
 * ShortScheduler - Content Script 엔트리포인트
 *
 * YouTube 페이지에 주입되어 Shorts 관련 UI를 스케줄러로 교체한다.
 *
 * /shorts 접근 전략 (2단계):
 * 1. SPA 내부 이동 (Shorts 클릭) → MAIN World pushState 차단 → 인라인 스케줄러 표시
 * 2. 직접 URL 접근 (주소창) → webNavigation이 확장프로그램 페이지로 리다이렉트
 *
 * 인라인 방식:
 * YouTube 사이드바를 유지하고 메인 콘텐츠 영역만 교체한다.
 * 닫으면 원래 콘텐츠가 즉시 복원된다.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { createRouteObserver } from './observers/route-observer'
import type { YouTubeRoute } from './observers/route-observer'
import { createShortsShelfInjector } from './injectors/shorts-shelf-injector'
import { createSidebarInjector } from './injectors/sidebar-injector'
import { createSchedulerInline } from './injectors/scheduler-inline-injector'

import { MiniWidget } from '@/components/widget/MiniWidget'
import { InlineScheduler } from '@/components/widget/InlineScheduler'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useScheduleStore } from '@/stores/schedule-store'
import { useSettingsStore } from '@/stores/settings-store'
import { toYearMonth } from '@/utils/calendar-utils'

/**
 * React root 인스턴스 관리
 *
 * Shadow DOM mountPoint마다 별도의 React root를 생성한다.
 * 정리 시 unmount()로 안전하게 해제한다.
 */
const reactRoots = new Map<HTMLDivElement, Root>()

/**
 * 미니 위젯 렌더러 팩토리
 *
 * 홈 피드 Shorts 선반을 대체하는 MiniWidget(주간 캘린더)을 Shadow DOM에 렌더링.
 * onOpenScheduler 콜백을 클로저로 캡처하여 인라인 스케줄러를 열 수 있도록 한다.
 */
const createMiniWidgetRenderer = (
  onOpenScheduler: (date?: string) => void
) => (mountPoint: HTMLDivElement): void => {
  const existingRoot = reactRoots.get(mountPoint)
  if (existingRoot) {
    existingRoot.unmount()
    reactRoots.delete(mountPoint)
  }

  const root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <MiniWidget onOpenScheduler={onOpenScheduler} />
      </ErrorBoundary>
    </StrictMode>
  )
  reactRoots.set(mountPoint, root)
}

/**
 * Content Script 초기화
 */
const init = (): void => {
  // 설정 로드 — 언어 등 설정이 MiniWidget에 반영되도록
  void useSettingsStore.getState().loadSettings()

  // 팝업에서 설정 변경 시 content script에도 즉시 반영
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && 'settings' in changes) {
      void useSettingsStore.getState().loadSettings()
    }
  })

  // 인라인 인젝터 생성 (사이드바 유지, 콘텐츠 영역만 교체)
  const inlineScheduler = createSchedulerInline(
    // 렌더러: InlineScheduler를 Shadow DOM mountPoint에 마운트
    (mountPoint) => {
      const existingRoot = reactRoots.get(mountPoint)
      if (existingRoot) {
        existingRoot.unmount()
        reactRoots.delete(mountPoint)
      }

      const root = createRoot(mountPoint)
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <InlineScheduler onClose={() => inlineScheduler.hide()} />
          </ErrorBoundary>
        </StrictMode>
      )
      reactRoots.set(mountPoint, root)
    },
    // 언마운터: React root 해제
    (mountPoint) => {
      const root = reactRoots.get(mountPoint)
      if (root) {
        root.unmount()
        reactRoots.delete(mountPoint)
      }
    }
  )

  /** 인라인 스케줄러 표시 — date 지정 시 해당 월로 이동 후 열기 */
  const showScheduler = (date?: string): void => {
    if (date) {
      const yearMonth = toYearMonth(date)
      void useScheduleStore.getState().setCurrentMonth(yearMonth)
    }
    inlineScheduler.show()
  }

  // 0. MAIN World pushState 차단 이벤트 수신 → 인라인 스케줄러 표시 (date 없이)
  // nonce 검증: MAIN World 스크립트가 심어둔 nonce와 일치할 때만 처리
  // 외부 스크립트가 ss-shorts-blocked 이벤트를 스푸핑하는 것을 방지한다.
  window.addEventListener('ss-shorts-blocked', (e) => {
    const expectedNonce = (window as Window & { __ssNonce?: string }).__ssNonce
    const detail = (e as CustomEvent<{ nonce?: string }>).detail
    if (!expectedNonce || detail?.nonce !== expectedNonce) return
    showScheduler()
  })

  // 1. Injector 생성 (인라인 스케줄러 열기 콜백을 MiniWidget에 전달)
  const renderMiniWidget = createMiniWidgetRenderer(showScheduler)
  const shelfInjector = createShortsShelfInjector(renderMiniWidget)

  // 2. 라우트별 동작 정의
  const handleRouteChange = (route: YouTubeRoute): void => {
    // 이전 상태 정리
    shelfInjector.stop()

    switch (route) {
      case 'home':
        // 홈: Shorts 선반만 교체, 인라인 스케줄러가 열려있으면 닫기
        if (inlineScheduler.isVisible()) {
          inlineScheduler.hide()
        }
        shelfInjector.start()
        break

      case 'shorts':
        // /shorts에 도달한 경우 (직접 URL은 webNavigation이 처리하므로 여기 오기 드묾)
        // 백업으로 서비스 워커에 리다이렉트 요청
        void chrome.runtime.sendMessage({ type: 'open-scheduler' })
        break

      case 'watch':
      case 'other':
        // 동영상 시청, 기타: 인라인 스케줄러가 열려있으면 닫기
        if (inlineScheduler.isVisible()) {
          inlineScheduler.hide()
        }
        break
    }
  }

  // 3. Route Observer 시작
  const routeObserver = createRouteObserver(handleRouteChange)
  routeObserver.start()

  // 4. 사이드바는 모든 페이지에서 활성화 (토글 방식)
  const sidebarInjector = createSidebarInjector(() => {
    if (inlineScheduler.isVisible()) {
      inlineScheduler.hide()
    } else {
      showScheduler()
    }
  })
  sidebarInjector.start()
}

// DOM이 준비된 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
