/**
 * 월간 그리드의 개별 날짜 셀 (Google Calendar 스타일)
 *
 * - 날짜 숫자 (오늘은 YouTube 레드 원)
 * - 일정을 컬러 바(bar)로 표시 (도트 대신)
 * - 최대 2개 바 + 나머지 개수 텍스트
 */

import type { Schedule, ScheduleColor } from '@/types/schedule'
import { isToday } from '@/utils/date-utils'
import { isSameMonth } from '@/utils/calendar-utils'

interface MonthDayCellProps {
  readonly date: string
  readonly currentMonth: string
  readonly schedules: ReadonlyArray<Schedule>
  readonly isSelected: boolean
  readonly onClick: (date: string) => void
}

const BAR_COLORS: Record<ScheduleColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-400',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

const MAX_BARS = 2

export const MonthDayCell = ({
  date,
  currentMonth,
  schedules,
  isSelected,
  onClick,
}: MonthDayCellProps) => {
  const dayNumber = parseInt(date.split('-')[2] ?? '1', 10)
  const today = isToday(date)
  const inMonth = isSameMonth(date, currentMonth)
  const visibleSchedules = schedules.slice(0, MAX_BARS)
  const remaining = Math.max(0, schedules.length - MAX_BARS)

  return (
    <button
      type="button"
      className={[
        'relative flex flex-col items-start gap-1 cursor-pointer',
        'rounded-2xl p-2',
        'transition-all duration-200',
        isSelected
          ? 'bg-red-50/80 dark:bg-red-900/20 ring-1 ring-red-300/60 dark:ring-red-800/40 shadow-sm'
          : [
              'bg-white/5 ring-1 ring-white/10 dark:ring-neutral-700/30',
              'hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-neutral-800/60',
              'hover:ring-neutral-200 dark:hover:ring-neutral-600',
            ].join(' '),
        !inMonth && 'opacity-30',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ minHeight: 0 }}
      onClick={() => onClick(date)}
      aria-label={`${date} 일정 ${schedules.length}개`}
    >
      {/* 날짜 숫자 */}
      <span
        className={[
          'text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full mb-0.5',
          'transition-all duration-200',
          today
            ? 'bg-red-500 text-white shadow-sm'
            : inMonth
              ? 'text-gray-900 dark:text-neutral-300'
              : 'text-gray-400 dark:text-neutral-600',
        ].join(' ')}
      >
        {dayNumber}
      </span>

      {/* 일정 바 (컬러 바) */}
      {visibleSchedules.map((schedule, index) => (
        <div
          key={schedule.id}
          className={[
            'w-full rounded-lg px-1.5 py-[3px] text-[10px] leading-snug text-white truncate',
            BAR_COLORS[schedule.color],
            'transition-all duration-200',
          ].join(' ')}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {schedule.title}
        </div>
      ))}

      {/* 나머지 개수 */}
      {remaining > 0 && (
        <span className="text-[10px] font-medium text-gray-400 dark:text-neutral-500 px-1 leading-snug">
          +{remaining}개
        </span>
      )}
    </button>
  )
}
