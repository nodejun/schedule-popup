/**
 * 오버레이 스케줄러 컴포넌트
 *
 * YouTube 페이지 위에 풀스크린 오버레이로 표시되는 스케줄러.
 * FullPageScheduler를 재사용하되, 상단에 "닫기" 버튼을 추가한다.
 */

import type { ReactNode } from 'react'
import { FullPageScheduler } from './FullPageScheduler'

interface OverlaySchedulerProps {
  /** 오버레이 닫기 콜백 */
  readonly onClose: () => void
}

export const OverlayScheduler = ({
  onClose,
}: OverlaySchedulerProps): ReactNode => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <button
            type="button"
            onClick={onClose}
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
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
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
