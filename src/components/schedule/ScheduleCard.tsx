/**
 * 스케줄 카드 컴포넌트
 *
 * 타임라인 위에 절대 위치로 배치되는 개별 일정 카드.
 * 색상별 배경, 완료 상태 표시, 클릭으로 편집 모달 열기를 지원한다.
 */

import type { ReactNode } from 'react'
import type { Schedule, ScheduleColor } from '@/types/schedule'

interface ScheduleCardProps {
  readonly schedule: Schedule
  readonly topPercent: number
  readonly heightPercent: number
  readonly isNow: boolean
  readonly onEdit: (schedule: Schedule) => void
  readonly onToggleComplete: (id: string) => void
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
}: ScheduleCardProps): ReactNode => {
  const colors = colorStyles[schedule.color]
  const minHeight = Math.max(heightPercent, 2.5) // 최소 높이 보장

  const hasDescription = schedule.description && schedule.description.trim().length > 0

  return (
    <div
      className={[
        'absolute left-14 right-2 cursor-pointer overflow-hidden',
        'rounded-xl transition-all duration-200 hover:scale-[1.02]',
        colors.bg,
        schedule.isCompleted ? 'opacity-50' : '',
        isNow ? 'ring-1 ring-red-400/30' : '',
      ].filter(Boolean).join(' ')}
      style={{
        top: `${topPercent}%`,
        height: `${minHeight}%`,
        minHeight: '36px',
        borderLeft: `4px solid ${isNow ? '#ef4444' : colors.borderColor}`,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onClick={() => onEdit(schedule)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEdit(schedule)
      }}
    >
      {/* 상단: 체크박스 + 제목 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
        <button
          type="button"
          style={{ flexShrink: 0, marginTop: '1px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(schedule.id)
          }}
          aria-label={schedule.isCompleted ? '미완료로 변경' : '완료로 변경'}
        >
          <div
            className={`flex items-center justify-center transition-all duration-200 ${
              schedule.isCompleted
                ? 'bg-red-400 border-red-400'
                : 'border-gray-300 dark:border-neutral-500'
            }`}
            style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid' }}
          >
            {schedule.isCompleted && (
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 제목 */}
          <p
            className={`${colors.text} ${schedule.isCompleted ? 'line-through' : ''}`}
            style={{ fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {schedule.title}
          </p>

          {/* 설명 */}
          {hasDescription && (
            <p
              className="text-gray-600 dark:text-neutral-400 leading-snug"
              style={{ fontSize: '11px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {schedule.description}
            </p>
          )}
        </div>
      </div>

      {/* 하단: 시간 (왼쪽 아래) */}
      <p
        className="text-gray-400 dark:text-neutral-500 leading-snug"
        style={{ fontSize: '10px', margin: '4px 0 0 22px', fontVariantNumeric: 'tabular-nums' }}
      >
        {schedule.startTime} – {schedule.endTime}
      </p>
    </div>
  )
}
