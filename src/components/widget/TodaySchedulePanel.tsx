/**
 * 오늘의 일정 패널
 *
 * MiniWidget 왼쪽 패널 — 선택된 날짜의 일정을 간결하게 목록으로 표시.
 * 로컬 일정 + Google 일정을 시간순으로 합쳐서 보여준다.
 */

import type { ReactNode } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { useGoogleCalendarStore } from '@/stores/google-calendar-store'
import { isToday, sortByStartTime } from '@/utils/date-utils'
import type { Schedule, ScheduleColor } from '@/types/schedule'

/** "09:00" → "AM 9:00", "14:30" → "PM 2:30" */
const formatAmPm = (time: string): string => {
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr ?? '0', 10)
  const period = hour < 12 ? 'AM' : 'PM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${period} ${displayHour}:${minute ?? '00'}`
}

const DOT_COLORS: Record<ScheduleColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-400',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

interface ScheduleRowProps {
  readonly schedule: Schedule
}

const ScheduleRow = ({ schedule }: ScheduleRowProps) => {
  const dotStyle = schedule.calendarColor
    ? { backgroundColor: schedule.calendarColor }
    : undefined

  const dotClass = schedule.calendarColor
    ? 'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5'
    : `w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${DOT_COLORS[schedule.color]}`

  return (
    <div className="flex items-start gap-2 py-1">
      <span className={dotClass} style={dotStyle} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200 truncate leading-tight">
          {schedule.title}
        </p>
        <p className="text-base text-neutral-500 dark:text-neutral-400 leading-tight">
          {formatAmPm(schedule.startTime)} – {formatAmPm(schedule.endTime)}
        </p>
      </div>
    </div>
  )
}

interface TodaySchedulePanelProps {
  readonly date: string
  readonly onOpenScheduler?: (date: string) => void
}

export const TodaySchedulePanel = ({
  date,
  onOpenScheduler,
}: TodaySchedulePanelProps): ReactNode => {
  const { weekSchedules } = useScheduleStore()
  const { googleSchedules } = useGoogleCalendarStore()

  const localList = weekSchedules[date] ?? []
  const googleList = googleSchedules[date] ?? []

  const seenIds = new Set(localList.map((s) => s.id))
  const uniqueGoogle = googleList.filter((s) => !seenIds.has(s.id))

  const combined = sortByStartTime([...localList, ...uniqueGoogle])
  const isSelectedToday = isToday(date)

  const headerText = isSelectedToday
    ? '오늘'
    : (() => {
        const [, monthStr, dayStr] = date.split('-')
        const days = ['일', '월', '화', '수', '목', '금', '토']
        const dateObj = new Date(date)
        const dow = days[dateObj.getDay()] ?? ''
        return `${parseInt(monthStr ?? '1', 10)}/${parseInt(dayStr ?? '1', 10)} (${dow})`
      })()

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-bold text-neutral-700 dark:text-neutral-300">
          {headerText}
        </h4>
        {isSelectedToday && (
          <span className="text-base px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full font-medium">
            Today
          </span>
        )}
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 overflow-hidden">
        {combined.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            <span className="text-3xl">📭</span>
            <p className="text-sm text-neutral-400">일정 없음</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-[200px]">
            {combined.map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </div>

      {/* 하단 CTA */}
      <button
        type="button"
        onClick={() => onOpenScheduler?.(date)}
        className="mt-2 text-sm font-medium text-blue-500 dark:text-blue-400 hover:underline text-left"
      >
        캘린더 →
      </button>
    </div>
  )
}
