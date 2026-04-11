/**
 * 스케줄 카드 컴포넌트
 *
 * 타임라인 위에 절대 위치로 배치되는 개별 일정 카드.
 * 색상별 배경, 완료 상태 표시, 클릭으로 편집 모달 열기를 지원한다.
 */

import type { ReactNode } from 'react'
import type { Schedule, ScheduleColor } from '@/types/schedule'
import { useTranslation } from '@/i18n'

/** "09:00" → "AM 9:00", "14:30" → "PM 2:30" (locale-aware) */
const formatAmPm = (time: string, am: string, pm: string): string => {
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr ?? '0', 10)
  const period = hour < 12 ? am : pm
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${period} ${displayHour}:${minute}`
}

interface ScheduleCardProps {
  readonly schedule: Schedule
  readonly topPercent: number
  readonly heightPercent: number
  readonly isNow: boolean
  readonly onEdit: (schedule: Schedule) => void
  readonly onToggleComplete: (id: string) => void
  /** 겹치는 일정 중 몇 번째 열인지 (0부터) */
  readonly columnIndex?: number
  /** 겹치는 일정의 총 열 수 */
  readonly totalColumns?: number
}

const colorStyles: Record<ScheduleColor, { bg: string; borderColor: string; text: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    borderColor: '#3b82f6',
    text: 'text-blue-800 dark:text-blue-200',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/40',
    borderColor: '#22c55e',
    text: 'text-green-800 dark:text-green-200',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/40',
    borderColor: '#ef4444',
    text: 'text-red-800 dark:text-red-200',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/40',
    borderColor: '#eab308',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/40',
    borderColor: '#a855f7',
    text: 'text-purple-800 dark:text-purple-200',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/40',
    borderColor: '#f97316',
    text: 'text-orange-800 dark:text-orange-200',
  },
}

export const ScheduleCard = ({
  schedule,
  topPercent,
  heightPercent,
  isNow,
  onEdit,
  onToggleComplete,
  columnIndex = 0,
  totalColumns = 1,
}: ScheduleCardProps): ReactNode => {
  const t = useTranslation()
  const colors = colorStyles[schedule.color]
  const minHeight = Math.max(heightPercent, 2.5) // 최소 높이 보장

  const hasDescription = schedule.description && schedule.description.trim().length > 0

  // 겹치는 일정 나란히 배치: left와 width 계산
  const leftBase = 70 // AM/PM 시간 라벨 너비
  const rightGap = 8  // right-2 = 0.5rem = 8px
  const colWidthPercent = 100 / totalColumns
  const colLeft = columnIndex * colWidthPercent

  return (
    <div
      className={[
        'absolute cursor-pointer overflow-hidden',
        'rounded-xl transition-all duration-200 hover:scale-[1.02]',
        'min-h-9 px-2.5 py-2 flex flex-col justify-between',
        colors.bg,
        schedule.isCompleted ? 'opacity-50' : '',
        isNow ? 'ring-1 ring-red-400/30' : '',
      ].filter(Boolean).join(' ')}
      style={{
        top: `${topPercent}%`,
        height: `${minHeight}%`,
        borderLeft: `4px solid ${isNow ? '#ef4444' : colors.borderColor}`,
        left: `calc(${leftBase}px + (100% - ${leftBase}px - ${rightGap}px) * ${colLeft / 100})`,
        width: `calc((100% - ${leftBase}px - ${rightGap}px) * ${colWidthPercent / 100} - 2px)`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onEdit(schedule)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit(schedule)
      }}
    >
      {/* 상단: 체크박스 + 제목 */}
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="shrink-0 mt-px bg-transparent border-none p-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(schedule.id)
          }}
          aria-label={schedule.isCompleted ? t.aria.markIncomplete : t.aria.markComplete}
        >
          <div
            className={`flex items-center justify-center transition-all duration-200 w-4 h-4 rounded border-2 ${
              schedule.isCompleted
                ? 'bg-red-400 border-red-400'
                : 'border-gray-300 dark:border-neutral-500'
            }`}
          >
            {schedule.isCompleted && (
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <p
            className={`text-[13px] font-semibold m-0 leading-tight truncate ${colors.text} ${schedule.isCompleted ? 'line-through' : ''}`}
          >
            {schedule.title}
          </p>

          {/* 설명 */}
          {hasDescription && (
            <p
              className="text-[11px] mt-0.5 truncate text-gray-600 dark:text-neutral-400 leading-snug"
            >
              {schedule.description}
            </p>
          )}

          {/* 시간 */}
          <p
            className={`text-[12px] font-medium mt-1 tabular-nums leading-snug ${colors.text} opacity-70`}
          >
            {formatAmPm(schedule.startTime, t.time.am, t.time.pm)} ~ {formatAmPm(schedule.endTime, t.time.am, t.time.pm)}
          </p>
        </div>
      </div>

    </div>
  )
}
