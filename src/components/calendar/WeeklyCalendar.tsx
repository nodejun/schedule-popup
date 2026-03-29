/**
 * 주간 캘린더 (홈 피드 Shorts 선반 대체)
 *
 * 월~일 7일 컴팩트 스트립 — YouTube 레드 테마
 * 각 날짜에 일정 도트 + 오늘 빨간 원 강조
 */

import { useEffect, useCallback } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { getWeekDates, WEEKDAY_LABELS, getWeekStart } from '@/utils/calendar-utils'
import { isToday, getToday } from '@/utils/date-utils'
import type { Schedule, ScheduleColor } from '@/types/schedule'

interface WeeklyCalendarProps {
  readonly onOpenScheduler?: (date?: string) => void
}

const DOT_COLORS: Record<ScheduleColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-400',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

const MAX_DOTS = 3

interface DayColumnProps {
  readonly date: string
  readonly dayLabel: string
  readonly schedules: ReadonlyArray<Schedule>
  readonly onClick: (date: string) => void
}

const DayColumn = ({ date, dayLabel, schedules, onClick }: DayColumnProps) => {
  const today = isToday(date)
  const dayNumber = parseInt(date.split('-')[2] ?? '1', 10)
  const visibleSchedules = schedules.slice(0, MAX_DOTS)
  const remaining = Math.max(0, schedules.length - MAX_DOTS)

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg
                 hover:bg-neutral-100 dark:hover:bg-neutral-700/50
                 transition-colors cursor-pointer flex-1"
      aria-label={`${date} 일정 ${schedules.length}개`}
    >
      {/* 요일 */}
      <span
        className={`text-[11px] font-medium ${
          today
            ? 'text-red-500 dark:text-red-400'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {dayLabel}
      </span>

      {/* 날짜 */}
      <span
        className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
          today
            ? 'bg-red-500 text-white'
            : 'text-neutral-800 dark:text-neutral-200'
        }`}
      >
        {dayNumber}
      </span>

      {/* 일정 도트 */}
      <div className="flex items-center gap-0.5 min-h-[8px]">
        {visibleSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[schedule.color]}`}
          />
        ))}
      </div>

      {/* 추가 개수 */}
      {remaining > 0 && (
        <span className="text-[9px] text-neutral-400 leading-none">
          +{remaining}
        </span>
      )}
    </button>
  )
}

export const WeeklyCalendar = ({ onOpenScheduler }: WeeklyCalendarProps) => {
  const {
    currentWeekStart,
    weekSchedules,
    isWeekLoading,
    setCurrentWeekStart,
  } = useScheduleStore()

  useEffect(() => {
    const weekStart = getWeekStart(getToday())
    setCurrentWeekStart(weekStart)
  }, [])

  const weekDates = getWeekDates(currentWeekStart)

  const handleDayClick = useCallback(
    (date: string) => {
      onOpenScheduler?.(date)
    },
    [onOpenScheduler]
  )

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* 헤더 — YouTube 레드 그라데이션 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500 to-red-600">
        <div>
          <h3 className="text-sm font-bold text-white">ShortScheduler</h3>
          <p className="text-xs text-white/80">이번 주 일정</p>
        </div>
      </div>

      {/* 주간 그리드 */}
      {isWeekLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex px-2 py-1 bg-white dark:bg-neutral-800">
          {weekDates.map((date, index) => (
            <DayColumn
              key={date}
              date={date}
              dayLabel={WEEKDAY_LABELS[index] ?? ''}
              schedules={weekSchedules[date] ?? []}
              onClick={handleDayClick}
            />
          ))}
        </div>
      )}

      {/* 하단 CTA — YouTube 레드 */}
      <div className="px-3 pb-3 pt-1 bg-white dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => onOpenScheduler?.()}
          className="w-full py-2 rounded-lg text-sm font-medium
                     text-red-500 dark:text-red-400
                     bg-red-50 dark:bg-red-900/20
                     hover:bg-red-100 dark:hover:bg-red-900/30
                     transition-colors"
        >
          전체 일정 보기
        </button>
      </div>
    </div>
  )
}
