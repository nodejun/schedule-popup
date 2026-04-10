/**
 * 주간 캘린더 (홈 피드 Shorts 선반 대체)
 *
 * 월~일 7일 컴팩트 스트립 — YouTube 레드 테마
 * WeekStrip을 포함한 전체 위젯 레이아웃.
 */

import { useEffect } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { getWeekStart } from '@/utils/calendar-utils'
import { getToday } from '@/utils/date-utils'
import { WeekStrip } from './WeekStrip'

interface WeeklyCalendarProps {
  readonly onOpenScheduler?: (date?: string) => void
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

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* 헤더 — YouTube 레드 그라데이션 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500 to-red-600">
        <div>
          <h3 className="text-sm font-bold text-white">ShortScheduler</h3>
          <p className="text-xs text-white/80">이번 주 일정</p>
        </div>
      </div>

      {/* 주간 스트립 */}
      <div className="bg-white dark:bg-neutral-800">
        <WeekStrip
          weekStart={currentWeekStart}
          weekSchedules={weekSchedules}
          isLoading={isWeekLoading}
          onDaySelect={(date) => onOpenScheduler?.(date)}
        />
      </div>

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
