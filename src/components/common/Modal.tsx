/**
 * 모달 오버레이 컴포넌트
 *
 * Shadow DOM 안에서 동작하므로, Portal 대신 직접 오버레이를 렌더링한다.
 * ESC 키와 배경 클릭으로 닫을 수 있다.
 */

import { useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n'

interface ModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly title: string
  readonly children: ReactNode
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps): ReactNode => {
  const t = useTranslation()
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
        onClick={onClose}
        role="presentation"
      />

      {/* 모달 본체 */}
      <div className="relative w-full max-w-[440px] mx-4 max-h-[80vh] overflow-y-auto bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">

        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 bg-inherit z-[1] rounded-t-2xl ring-1 ring-black/5 dark:ring-white/10"
        >
          <h2 className="text-xl m-0 text-gray-900 dark:text-neutral-100 font-bold leading-snug">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[10px] border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all duration-200"
            aria-label={t.aria.closeModal}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 pb-5 pt-4">{children}</div>
      </div>
    </div>
  )
}
