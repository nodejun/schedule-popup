/**
 * 월간 캘린더 그리드
 * 7열 × 5~6행, 요일 헤더 포함
 */

import type { Schedule } from '@/types/schedule'
import { getMonthGridDates } from '@/utils/calendar-utils'
import { MonthDayCell } from './MonthDayCell'
import { useTranslation } from '@/i18n'

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
  const t = useTranslation()
  const weeks = getMonthGridDates(currentMonth)

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 shrink-0 pt-1 px-6">

        {t.time.weekdays.map((label, index) => (
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
      <div className="flex-1 flex flex-col min-h-0 px-6 pb-1.5">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="flex-1 grid grid-cols-7 min-h-0"
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
