/**
 * 미니 위젯 컴포넌트
 *
 * YouTube 홈 피드의 Shorts 선반을 대체하는 3컬럼 컴팩트 위젯.
 *
 * 레이아웃:
 * ┌──────────────┬────────────────────────┬──────────┐
 * │ 오늘의 일정   │ 이번 주 하이라이트      │ 이번 주   │
 * │ 일정 목록    │ 🎂/🏢/👤 일정 카드    │ 7일 스트립│
 * │ [캘린더 →]   │                        │ < 4월1주 >│
 * └──────────────┴────────────────────────┴──────────┘
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { useGoogleCalendarStore } from '@/stores/google-calendar-store'
import { getToday, addDays } from '@/utils/date-utils'
import { getWeekStart, getWeekDates, toYearMonth } from '@/utils/calendar-utils'
import type { Schedule } from '@/types/schedule'
import { TodaySchedulePanel } from './TodaySchedulePanel'
import { WeekHighlights } from './WeekHighlights'
import { WeekStrip } from '../calendar/WeekStrip'

interface MiniWidgetProps {
  readonly onOpenScheduler?: (date?: string) => void
}

/** 해당 주의 고유 yearMonth 목록 반환 (월 경계 넘으면 2개) */
const getWeekYearMonths = (weekStart: string): ReadonlyArray<string> => {
  const dates = getWeekDates(weekStart)
  const months = new Set(dates.map(toYearMonth))
  return [...months]
}

export const MiniWidget = ({ onOpenScheduler }: MiniWidgetProps): ReactNode => {
  const today = getToday()
  const [selectedDate, setSelectedDate] = useState<string>(today)

  const {
    currentWeekStart,
    weekSchedules,
    isWeekLoading,
    setCurrentWeekStart,
  } = useScheduleStore()

  const {
    googleAuth,
    googleSchedules,
    checkAuthAndSync,
    syncFromGoogle,
  } = useGoogleCalendarStore()

  /**
   * 로컬 weekSchedules + googleSchedules 병합
   * WeekStrip 배지가 Google 일정 개수도 반영하도록
   */
  const mergedWeekSchedules = useMemo((): Record<string, ReadonlyArray<Schedule>> => {
    const weekDates = getWeekDates(currentWeekStart)
    const result: Record<string, ReadonlyArray<Schedule>> = {}
    for (const date of weekDates) {
      const local = weekSchedules[date] ?? []
      const google = googleSchedules[date] ?? []
      const seenIds = new Set(local.map((s) => s.id))
      const uniqueGoogle = google.filter((s) => !seenIds.has(s.id))
      result[date] = [...local, ...uniqueGoogle]
    }
    return result
  }, [weekSchedules, googleSchedules, currentWeekStart])

  /** 초기 마운트: 로컬 주간 데이터 + Google 동기화 */
  useEffect(() => {
    const weekStart = getWeekStart(today)
    void setCurrentWeekStart(weekStart)
    // Google 인증 확인 후 이번 주의 월(들) 동기화
    const yearMonth = toYearMonth(today)
    void checkAuthAndSync(yearMonth)
  }, [])

  /** 주간 이동 시 Google 동기화 보장 */
  const syncGoogleForWeek = useCallback(
    (weekStart: string) => {
      if (!googleAuth.isAuthenticated) return
      const yearMonths = getWeekYearMonths(weekStart)
      for (const ym of yearMonths) {
        void syncFromGoogle(ym)
      }
    },
    [googleAuth.isAuthenticated, syncFromGoogle]
  )

  const handleDaySelect = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handlePrevWeek = useCallback(() => {
    const prevWeekStart = addDays(currentWeekStart, -7)
    void setCurrentWeekStart(prevWeekStart)
    syncGoogleForWeek(prevWeekStart)
  }, [currentWeekStart, setCurrentWeekStart, syncGoogleForWeek])

  const handleNextWeek = useCallback(() => {
    const nextWeekStart = addDays(currentWeekStart, 7)
    void setCurrentWeekStart(nextWeekStart)
    syncGoogleForWeek(nextWeekStart)
  }, [currentWeekStart, setCurrentWeekStart, syncGoogleForWeek])

  const handleOpenScheduler = useCallback(
    (date?: string) => {
      onOpenScheduler?.(date ?? selectedDate)
    },
    [onOpenScheduler, selectedDate]
  )

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500 to-red-600">
        <div>
          <h3 className="text-lg font-bold text-white">ShortScheduler</h3>
          <p className="text-base text-white/80">이번 주 일정</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenScheduler(selectedDate)}
          className="text-base text-white/80 hover:text-white transition-colors font-medium"
        >
          전체 보기 →
        </button>
      </div>

      {/* 3컬럼 본체 */}
      <div
        className="grid grid-cols-[1fr_1.4fr_1fr] divide-x divide-neutral-100 dark:divide-neutral-700
                   bg-white dark:bg-neutral-800 min-h-[300px]"
      >
        {/* 왼쪽: 오늘의 일정 */}
        <div className="px-3 py-3">
          <TodaySchedulePanel date={selectedDate} onOpenScheduler={handleOpenScheduler} />
        </div>

        {/* 가운데: 이번 주 하이라이트 */}
        <div className="px-3 py-3">
          <WeekHighlights weekStart={currentWeekStart} />
        </div>

        {/* 오른쪽: 주간 스트립 */}
        <div className="flex flex-col">
          <WeekStrip
            weekStart={currentWeekStart}
            weekSchedules={mergedWeekSchedules}
            isLoading={isWeekLoading}
            selectedDate={selectedDate}
            onDaySelect={handleDaySelect}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
        </div>
      </div>
    </div>
  )
}
