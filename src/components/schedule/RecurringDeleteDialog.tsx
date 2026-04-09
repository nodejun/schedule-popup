/**
 * 반복 일정 삭제 확인 다이얼로그
 *
 * Google Calendar 앱과 동일한 3-옵션 라디오를 제공한다:
 *   1. 이 일정만           (instance) — 인스턴스 1건만 취소
 *   2. 이 일정과 향후 일정  (future)   — 부모 RRULE에 UNTIL 추가
 *   3. 모든 반복 일정      (all)      — 부모 이벤트 통째로 삭제
 *
 * 디폴트는 'instance' — 가장 보수적인(영향 범위가 작은) 옵션을 선택해두어
 * 사용자가 실수로 Enter를 쳐도 전체 시리즈가 날아가지 않게 한다.
 *
 * Modal 컴포넌트와 분리한 이유:
 * - 폼 모달 위에 또 띄울 수 있어야 함 (z-index 110, Modal은 100)
 * - 더 작고 단순한 형태가 어울림 (헤더 X 버튼 없음)
 */

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { DeleteMode } from '@/stores/schedule-store'
import { Button } from '../common/Button'

interface RecurringDeleteDialogProps {
  readonly isOpen: boolean
  /** 삭제할 일정 제목 (메시지 표시용) */
  readonly scheduleTitle: string
  readonly onCancel: () => void
  readonly onConfirm: (mode: DeleteMode) => void
}

interface OptionDef {
  readonly value: DeleteMode
  readonly label: string
  readonly description: string
}

/** 라디오 옵션 정의 — Google Calendar와 동일한 순서/문구 */
const OPTIONS: ReadonlyArray<OptionDef> = [
  {
    value: 'instance',
    label: '이 일정만',
    description: '선택한 날짜의 반복 1건만 삭제',
  },
  {
    value: 'future',
    label: '이 일정과 향후 일정',
    description: '오늘 이후 반복은 모두 삭제, 과거 기록은 보존',
  },
  {
    value: 'all',
    label: '모든 반복 일정',
    description: '과거·미래 모든 반복을 삭제',
  },
]

export const RecurringDeleteDialog = ({
  isOpen,
  scheduleTitle,
  onCancel,
  onConfirm,
}: RecurringDeleteDialogProps): ReactNode => {
  const [mode, setMode] = useState<DeleteMode>('instance')

  // 다이얼로그가 다시 열릴 때마다 디폴트로 리셋
  useEffect(() => {
    if (isOpen) setMode('instance')
  }, [isOpen])

  // ESC 키로 취소
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center antialiased">
      {/* 배경 오버레이 — backdrop-blur 대신 단색을 진하게.
          blur 레이어를 없애 다이얼로그 텍스트가 GPU 합성 영향을 받지 않도록 한다. */}
      <div
        className="absolute inset-0 bg-black/55"
        onClick={onCancel}
        role="presentation"
      />

      {/* 다이얼로그 본체 */}
      <div
        className="relative w-full max-w-[400px] mx-4 bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm ring-1 ring-black/10 dark:ring-white/10"
        role="dialog"
        aria-labelledby="recurring-delete-title"
      >
        <h3
          id="recurring-delete-title"
          className="text-lg font-semibold text-gray-700 dark:text-neutral-300 mb-2"
        >
          반복 일정 삭제
        </h3>
        <p className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-5 truncate leading-snug">
          "{scheduleTitle}"
        </p>

        {/* 라디오 옵션 */}
        <div className="flex flex-col gap-2 mb-6">
          {OPTIONS.map((opt) => {
            const isSelected = mode === opt.value
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                }`}
              >
                <input
                  type="radio"
                  name="delete-mode"
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => setMode(opt.value)}
                  className="mt-1 w-4 h-4 cursor-pointer accent-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-base font-semibold ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-neutral-100'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-[13px] font-normal text-gray-600 dark:text-neutral-300 mt-1 leading-snug">
                    {opt.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onCancel} type="button">
            취소
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => onConfirm(mode)}
            type="button"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
