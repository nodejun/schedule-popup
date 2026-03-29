/**
 * 모달 오버레이 컴포넌트
 *
 * Shadow DOM 안에서 동작하므로, Portal 대신 직접 오버레이를 렌더링한다.
 * ESC 키와 배경 클릭으로 닫을 수 있다.
 */

import { useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 배경 오버레이 */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        role="presentation"
      />

      {/* 모달 본체 */}
      <div
        className="bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10 rounded-2xl"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          margin: '0 16px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* 헤더 */}
        <div
          className="ring-1 ring-black/5 dark:ring-white/10"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            position: 'sticky',
            top: 0,
            background: 'inherit',
            zIndex: 1,
            borderRadius: '16px 16px 0 0',
          }}
        >
          <h2 className="text-gray-900 dark:text-neutral-100 font-bold leading-snug" style={{ fontSize: '16px', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-all duration-200"
            style={{ padding: '6px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer' }}
            aria-label="닫기"
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
        <div style={{ padding: '16px 20px 20px' }}>{children}</div>
      </div>
    </div>
  )
}
