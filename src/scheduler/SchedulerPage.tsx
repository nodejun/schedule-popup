/**
 * 독립 스케줄러 페이지
 *
 * /shorts 접속 시 리다이렉트되는 확장프로그램 전체 페이지.
 * YouTube 컨텍스트 없이 독립적으로 동작한다.
 *
 * 구성:
 * - 상단 네비게이션 바 (YouTube 복귀 버튼)
 * - FullPageScheduler 컴포넌트 재사용
 */

import type { ReactNode } from 'react'
import { FullPageScheduler } from '@/components/widget/FullPageScheduler'

const handleBackToYouTube = (): void => {
  // history.back()은 브라우저 캐시에서 이전 페이지를 복원하므로 즉시 돌아간다.
  // 히스토리가 없는 경우(새 탭으로 직접 접속) YouTube 홈으로 이동.
  if (window.history.length > 1) {
    window.history.back()
  } else {
    window.location.href = 'https://www.youtube.com'
  }
}

export const SchedulerPage = (): ReactNode => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <button
            type="button"
            onClick={handleBackToYouTube}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            YouTube로 돌아가기
          </button>
        </div>
      </nav>

      {/* 스케줄러 본문 */}
      <main className="py-4">
        <FullPageScheduler />
      </main>
    </div>
  )
}
