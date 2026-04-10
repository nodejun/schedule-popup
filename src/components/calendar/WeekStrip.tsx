/**
 * 주간 스트립 컴포넌트
 *
 * 7일 날짜 열 그리드 — WeeklyCalendar와 MiniWidget에서 공용.
 * 오늘은 빨간 원, 선택된 날짜는 파란 링.
 * 일정 개수 배지 표시 + 이전/다음 주 네비게이션 지원.
 */

import { useCallback } from 'react'
import { getWeekDates, WEEKDAY_LABELS } from '@/utils/calendar-utils'
import { isToday } from '@/utils/date-utils'
import type { Schedule } from '@/types/schedule'

interface DayColumnProps {
  readonly date: string
  readonly dayLabel: string
  readonly scheduleCount: number
  readonly isSelected: boolean
  readonly onClick: (date: string) => void
}

const DayColumn = ({ date, dayLabel, scheduleCount, isSelected, onClick }: DayColumnProps) => {
  const today = isToday(date)
  const dayNumber = parseInt(date.split('-')[2] ?? '1', 10)

  return (
    <button
      type="button"
      onClick={() => onClick(date)}
      className="flex flex-col items-center gap-1.5 py-2 px-0.5 rounded-lg
                 hover:bg-neutral-100 dark:hover:bg-neutral-700/50
                 transition-colors cursor-pointer flex-1 min-w-0"
      aria-label={`${date} 일정 ${scheduleCount}개`}
    >
      {/* 요일 */}
      <span
        className={`text-lg font-semibold leading-none ${
          today
            ? 'text-red-500 dark:text-red-400'
            : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {dayLabel}
      </span>

      {/* 날짜 숫자 */}
      <span
        className={`text-lg font-bold w-12 h-12 flex items-center justify-center rounded-full ${
          today
            ? 'bg-red-500 text-white'
            : isSelected
              ? 'ring-2 ring-blue-400 text-blue-500 dark:text-blue-400'
              : 'text-neutral-800 dark:text-neutral-200'
        }`}
      >
        {dayNumber}
      </span>

      {/* 일정 개수 배지 */}
      <div className="h-6 flex items-center justify-center">
        {scheduleCount > 0 ? (
          <span
            className={`text-base font-semibold px-2 py-0.5 rounded-full leading-none ${
              today
                ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                : isSelected
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {scheduleCount}
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        )}
      </div>
    </button>
  )
}

interface WeekStripProps {
  readonly weekStart: string
  readonly weekSchedules: Record<string, ReadonlyArray<Schedule>>
  readonly isLoading?: boolean
  readonly selectedDate?: string
  readonly onDaySelect: (date: string) => void
  readonly onPrevWeek?: () => void
  readonly onNextWeek?: () => void
}

const getWeekLabel = (weekStart: string): string => {
  const date = new Date(weekStart)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekNum = Math.ceil(day / 7)
  return `${month}월 ${weekNum}주`
}

export const WeekStrip = ({
  weekStart,
  weekSchedules,
  isLoading = false,
  selectedDate,
  onDaySelect,
  onPrevWeek,
  onNextWeek,
}: WeekStripProps) => {
  const weekDates = getWeekDates(weekStart)
  const hasNav = Boolean(onPrevWeek || onNextWeek)

  const handleDayClick = useCallback(
    (date: string) => { onDaySelect(date) },
    [onDaySelect]
  )

  return (
    <div className="flex flex-col h-full">
      {/* 주 네비게이션 헤더 */}
      {hasNav && (
        <div className="flex items-center justify-between px-1 pt-2 pb-0.5">
          <button
            type="button"
            onClick={onPrevWeek}
            className="w-10 h-10 flex items-center justify-center rounded-lg
                       text-neutral-500 dark:text-neutral-400
                       hover:text-neutral-900 dark:hover:text-neutral-100
                       hover:bg-neutral-100 dark:hover:bg-neutral-700
                       transition-colors text-2xl font-bold"
            aria-label="이전 주"
          >
            ‹
          </button>
          <span className="text-base font-bold text-neutral-600 dark:text-neutral-300">
            {getWeekLabel(weekStart)}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            className="w-10 h-10 flex items-center justify-center rounded-lg
                       text-neutral-500 dark:text-neutral-400
                       hover:text-neutral-900 dark:hover:text-neutral-100
                       hover:bg-neutral-100 dark:hover:bg-neutral-700
                       transition-colors text-2xl font-bold"
            aria-label="다음 주"
          >
            ›
          </button>
        </div>
      )}

      {/* 날짜 그리드 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex px-1 py-1 flex-1">
          {weekDates.map((date, index) => (
            <DayColumn
              key={date}
              date={date}
              dayLabel={WEEKDAY_LABELS[index] ?? ''}
              scheduleCount={(weekSchedules[date] ?? []).length}
              isSelected={selectedDate === date}
              onClick={handleDayClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
