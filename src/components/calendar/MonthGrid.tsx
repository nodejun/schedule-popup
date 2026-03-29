/**
 * 월간 캘린더 그리드
 * 7열 × 5~6행, 요일 헤더 포함
 */

import type { Schedule } from '@/types/schedule'
import { getMonthGridDates, WEEKDAY_LABELS } from '@/utils/calendar-utils'
import { MonthDayCell } from './MonthDayCell'

interface MonthGridProps {
  readonly currentMonth: string
  readonly selectedDate: string
  readonly monthSchedules: Readonly<Record<string, ReadonlyArray<Schedule>>>
  readonly onDateSelect: (date: string) => void
}

const WEEKEND_DAYS = new Set([5, 6])

export const MonthGrid = ({
  currentMonth,
  selectedDate,
  monthSchedules,
  onDateSelect,
}: MonthGridProps) => {
  const weeks = getMonthGridDates(currentMonth)

  return (
    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* 요일 헤더 */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flexShrink: 0, padding: '4px 6px 0', margin: '0 4px' }}
      >
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={`py-3 text-center text-[11px] font-medium tracking-wider leading-snug ${
              WEEKEND_DAYS.has(index)
                ? 'text-red-400/70 dark:text-red-400/50'
                : 'text-gray-400 dark:text-neutral-500'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 — 각 행이 동일한 비율로 남은 공간을 채움 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 6px 6px' }}>
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 0 }}
          >
            {week.map((date) => (
              <MonthDayCell
                key={date}
                date={date}
                currentMonth={currentMonth}
                schedules={monthSchedules[date] ?? []}
                isSelected={date === selectedDate}
                onClick={onDateSelect}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
