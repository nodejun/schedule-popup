/**
 * 타임라인 뷰 컴포넌트
 *
 * 하루의 시간대를 세로 그리드로 표시하고,
 * 각 스케줄을 시간 위치에 맞게 절대 배치한다.
 * 현재 시각을 빨간 가로선으로 표시한다.
 */

import { useState, useEffect, useCallback } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import type { Schedule } from '@/types/schedule'
import { timeToMinutes, getTimeSlots, isToday, sortByStartTime, minutesToTimeString } from '@/utils/date-utils'
import { ScheduleCard } from './ScheduleCard'

interface TimelineViewProps {
  readonly schedules: ReadonlyArray<Schedule>
  readonly selectedDate: string
  readonly startHour: number
  readonly endHour: number
  readonly onEditSchedule: (schedule: Schedule) => void
  readonly onToggleComplete: (id: string) => void
  /** 타임라인 빈 영역 클릭 시 호출 (시작/종료 시간 전달) */
  readonly onTimeSlotClick?: (startTime: string, endTime: string) => void
}

const HOUR_HEIGHT_PX = 60

export const TimelineView = ({
  schedules,
  selectedDate,
  startHour,
  endHour,
  onEditSchedule,
  onToggleComplete,
  onTimeSlotClick,
}: TimelineViewProps): ReactNode => {
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  // 1분마다 현재 시각 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes())
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const timeSlots = getTimeSlots(startHour, endHour)
  const totalMinutes = (endHour - startHour) * 60
  const startMinutes = startHour * 60

  /** 시간(분)을 퍼센트 위치로 변환 */
  const minutesToPercent = (minutes: number): number => {
    const relative = minutes - startMinutes
    return (relative / totalMinutes) * 100
  }

  const showCurrentTimeLine = isToday(selectedDate)
  const currentTimePercent = minutesToPercent(currentMinutes)
  const isCurrentTimeVisible =
    showCurrentTimeLine &&
    currentTimePercent >= 0 &&
    currentTimePercent <= 100

  const sorted = sortByStartTime(schedules)

  /** 타임라인 빈 영역 클릭 → Y좌표를 시간으로 변환 → 콜백 호출 */
  const handleTimelineClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!onTimeSlotClick) return
      // ScheduleCard 클릭이면 무시 (stopPropagation으로 처리)
      if (e.target !== e.currentTarget) return

      const rect = e.currentTarget.getBoundingClientRect()
      const clickY = e.clientY - rect.top + e.currentTarget.scrollTop
      const totalHeight = timeSlots.length * HOUR_HEIGHT_PX
      const clickMinutes = startHour * 60 + (clickY / totalHeight) * totalMinutes

      // 30분 단위로 스냅
      const snappedStart = Math.floor(clickMinutes / 30) * 30
      const snappedEnd = Math.min(snappedStart + 60, endHour * 60)

      onTimeSlotClick(
        minutesToTimeString(snappedStart),
        minutesToTimeString(snappedEnd)
      )
    },
    [onTimeSlotClick, timeSlots.length, startHour, totalMinutes, endHour]
  )

  return (
    <div
      className="relative overflow-y-auto cursor-pointer"
      style={{ height: `${timeSlots.length * HOUR_HEIGHT_PX}px` }}
      onClick={handleTimelineClick}
    >
      {/* 시간 눈금 */}
      {timeSlots.map((slot) => (
        <div
          key={slot}
          className="absolute left-0 right-0"
          style={{
            top: `${minutesToPercent(timeToMinutes(slot))}%`,
            height: `${(1 / timeSlots.length) * 100}%`,
          }}
        >
          {/* 시간 구분선 — 얇은 회색 */}
          <div className="absolute left-12 right-0 top-0 h-px bg-neutral-200 dark:bg-neutral-700" />
          <span className="absolute left-2 top-0 -translate-y-1/2 text-[11px] text-neutral-400 dark:text-neutral-500 select-none tabular-nums tracking-wide">

            {slot}
          </span>
        </div>
      ))}

      {/* 현재 시각 표시선 — 카드 뒤에 렌더링 (카드에 가려짐) */}
      {isCurrentTimeVisible && (
        <div
          className="absolute inset-x-0 pointer-events-none"
          style={{ top: `${currentTimePercent}%` }}
        >
          <div className="flex items-center">
            {/* 왼쪽 빨간 점 */}
            <div className="w-12 flex justify-end pr-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            {/* 얇은 빨간 선 */}
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
        </div>
      )}

      {/* 스케줄 카드들 */}
      {sorted.map((schedule) => {
        const scheduleStart = timeToMinutes(schedule.startTime)
        const scheduleEnd = timeToMinutes(schedule.endTime)
        const topPercent = minutesToPercent(scheduleStart)
        const heightPercent =
          ((scheduleEnd - scheduleStart) / totalMinutes) * 100

        // 현재 시간이 이 카드의 시간 범위 안에 있는지 판별
        const isNow =
          isCurrentTimeVisible &&
          currentMinutes >= scheduleStart &&
          currentMinutes <= scheduleEnd

        return (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            topPercent={topPercent}
            heightPercent={heightPercent}
            isNow={isNow}
            onEdit={onEditSchedule}
            onToggleComplete={onToggleComplete}
          />
        )
      })}

      {/* 빈 상태 */}
      {schedules.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-neutral-400 dark:text-neutral-500">
            <p className="text-sm">일정이 없습니다</p>
            <p className="text-xs mt-1">+ 버튼을 눌러 추가하세요</p>
          </div>
        </div>
      )}
    </div>
  )
}
