/**
 * 스케줄 목록 컴포넌트
 *
 * 미니위젯과 Popup에서 사용하는 간단한 리스트 형태의 일정 표시.
 * TimelineView와 달리 시간대 그리드 없이 카드 목록만 표시한다.
 */

import type { ReactNode } from 'react'
import type { Schedule, ScheduleColor } from '@/types/schedule'
import { sortByStartTime } from '@/utils/date-utils'
import { useTranslation } from '@/i18n'

interface ScheduleListProps {
  readonly schedules: ReadonlyArray<Schedule>
  readonly maxItems?: number
  readonly onToggleComplete?: (id: string) => void
  readonly onEdit?: (schedule: Schedule) => void
}

const dotColor: Record<ScheduleColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export const ScheduleList = ({
  schedules,
  maxItems,
  onToggleComplete,
  onEdit,
}: ScheduleListProps): ReactNode => {
  const t = useTranslation()
  const sorted = sortByStartTime(schedules)
  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted
  const remaining = maxItems ? Math.max(0, sorted.length - maxItems) : 0

  if (schedules.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-4">
        {t.schedule.noSchedulesToday}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {displayed.map((schedule) => (
        <div
          key={schedule.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
          onClick={() => onEdit?.(schedule)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEdit?.(schedule)
          }}
        >
          {/* 완료 체크 */}
          {onToggleComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleComplete(schedule.id)
              }}
              className="flex-shrink-0"
              aria-label={schedule.isCompleted ? t.aria.markIncomplete : t.aria.markComplete}
            >
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  schedule.isCompleted
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-neutral-300 dark:border-neutral-600'
                }`}
              >
                {schedule.isCompleted && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          )}

          {/* 색상 도트 */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[schedule.color]}`} />

          {/* 시간 */}
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono flex-shrink-0">
            {schedule.startTime}
          </span>

          {/* 제목 */}
          <span
            className={`text-sm truncate text-neutral-800 dark:text-neutral-200 ${
              schedule.isCompleted ? 'line-through opacity-60' : ''
            }`}
          >
            {schedule.title}
          </span>
        </div>
      ))}

      {remaining > 0 && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center py-1">
          {t.schedule.moreCount(remaining)}
        </p>
      )}
    </div>
  )
}
