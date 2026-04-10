/**
 * 이번 주 하이라이트 패널
 *
 * MiniWidget 가운데 패널 — 이번 주의 주목할 만한 일정 최대 4개 표시.
 * 반복 일정, 생일, 회사 일정을 캘린더 아이콘으로 구분.
 */

import type { ReactNode } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { useGoogleCalendarStore } from '@/stores/google-calendar-store'
import { getWeekDates } from '@/utils/calendar-utils'
import { sortByStartTime } from '@/utils/date-utils'
import type { Schedule } from '@/types/schedule'

const MAX_HIGHLIGHTS = 4

const getCalendarIcon = (schedule: Schedule): string => {
  const name = (schedule.calendarName ?? '').toLowerCase()
  const title = (schedule.title ?? '').toLowerCase()
  // calendarName 또는 title 둘 다 검사 (생일 캘린더명이 다를 수 있음)
  if (
    name.includes('생일') || name.includes('birthday') ||
    title.includes('생일') || title.includes('birthday')
  ) return '🎂'
  if (
    name.includes('회사') ||
    name.includes('work') ||
    name.includes('업무') ||
    name.includes('직장')
  )
    return '🏢'
  if (schedule.recurrence || schedule.recurringEventId) return '🔄'
  return '👤'
}

const getRecurrenceLabel = (recurrence: string | null | undefined): string | null => {
  if (!recurrence) return null
  if (recurrence.includes('DAILY')) return '매일'
  if (recurrence.includes('WEEKLY')) return '매주'
  if (recurrence.includes('MONTHLY')) return '매월'
  if (recurrence.includes('YEARLY')) return '매년'
  return null
}

interface HighlightRowProps {
  readonly schedule: Schedule
  readonly date: string
}

const HighlightRow = ({ schedule, date }: HighlightRowProps) => {
  const icon = getCalendarIcon(schedule)
  // recurrence 필드: 마스터 이벤트만 가짐. 인스턴스는 recurringEventId로 반복 여부 판별
  const recurrenceLabel =
    getRecurrenceLabel(schedule.recurrence) ??
    (schedule.recurringEventId ? '반복' : null)

  const [, monthStr, dayStr] = date.split('-')
  const displayDate = `${parseInt(monthStr ?? '1', 10)}/${parseInt(dayStr ?? '1', 10)}`

  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-2xl flex-shrink-0 leading-tight" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base text-neutral-400 flex-shrink-0 font-medium">{displayDate}</span>
          <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200 truncate leading-tight">
            {schedule.title}
          </p>
        </div>
        {recurrenceLabel && (
          <span className="text-base text-blue-400 font-medium">({recurrenceLabel})</span>
        )}
      </div>
    </div>
  )
}

interface WeekHighlightsProps {
  readonly weekStart: string
}

export const WeekHighlights = ({ weekStart }: WeekHighlightsProps): ReactNode => {
  const { weekSchedules } = useScheduleStore()
  const { googleSchedules } = useGoogleCalendarStore()

  const weekDates = getWeekDates(weekStart)

  const allItems: Array<{ schedule: Schedule; date: string }> = []

  for (const date of weekDates) {
    const localList = weekSchedules[date] ?? []
    const googleList = googleSchedules[date] ?? []

    const seenIds = new Set(localList.map((s) => s.id))
    const uniqueGoogle = googleList.filter((s) => !seenIds.has(s.id))

    const combined = sortByStartTime([...localList, ...uniqueGoogle])

    for (const schedule of combined) {
      allItems.push({ schedule, date })
    }
  }

  const sorted = [...allItems].sort((a, b) => {
    const aScore = getHighlightScore(a.schedule)
    const bScore = getHighlightScore(b.schedule)
    if (bScore !== aScore) return bScore - aScore
    return a.date.localeCompare(b.date)
  })

  const highlights = sorted.slice(0, MAX_HIGHLIGHTS)

  return (
    <div className="flex flex-col h-full">
      {/* 섹션 헤더 */}
      <h4 className="text-lg font-bold text-neutral-700 dark:text-neutral-300 mb-2">
        이번 주 하이라이트
      </h4>

      {/* 하이라이트 목록 */}
      <div className="flex-1 overflow-hidden">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            <span className="text-3xl">📅</span>
            <p className="text-sm text-neutral-400">이번 주 일정 없음</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-[200px]">
            {highlights.map(({ schedule, date }) => (
              <HighlightRow key={`${date}-${schedule.id}`} schedule={schedule} date={date} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const getHighlightScore = (schedule: Schedule): number => {
  const name = (schedule.calendarName ?? '').toLowerCase()
  const title = (schedule.title ?? '').toLowerCase()
  if (
    name.includes('생일') || name.includes('birthday') ||
    title.includes('생일') || title.includes('birthday')
  ) return 3
  if (schedule.recurrence || schedule.recurringEventId) return 2
  if (name.includes('회사') || name.includes('work')) return 1
  return 0
}
