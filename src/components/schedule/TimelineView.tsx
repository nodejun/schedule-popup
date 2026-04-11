/**
 * 타임라인 뷰 컴포넌트
 *
 * 하루의 시간대를 세로 그리드로 표시하고,
 * 각 스케줄을 시간 위치에 맞게 절대 배치한다.
 * 현재 시각을 빨간 가로선으로 표시한다.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import type { Schedule } from '@/types/schedule'
import { timeToMinutes, getTimeSlots, isToday, sortByStartTime, minutesToTimeString } from '@/utils/date-utils'
import { ScheduleCard } from './ScheduleCard'
import { useTranslation } from '@/i18n'

interface TimelineViewProps {
  readonly schedules: ReadonlyArray<Schedule>
  readonly selectedDate: string
  readonly startHour: number
  readonly endHour: number
  readonly onEditSchedule: (schedule: Schedule) => void
  readonly onToggleComplete: (id: string) => void
  /** 타임라인 빈 영역 클릭 시 호출 (시작/종료 시간 전달) */
  readonly onTimeSlotClick?: (startTime: string, endTime: string) => void
  /** 미리보기 블록 (폼이 열려있을 때 표시) */
  readonly previewTime?: {
    startTime: string
    endTime: string
    title?: string
    color?: string
  } | null
}

/** "09:00" → "AM 9:00", "14:30" → "PM 2:30" (locale-aware) */
const formatAmPm = (time: string, am: string, pm: string): string => {
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr ?? '0', 10)
  const period = hour < 12 ? am : pm
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${period} ${displayHour}:${minute}`
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
  previewTime,
}: TimelineViewProps): ReactNode => {
  const t = useTranslation()
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

  const containerRef = useRef<HTMLDivElement>(null)

  // 타임라인 열릴 때: 일정 있으면 첫 일정, 없으면 현재 시간으로 스크롤
  useEffect(() => {
    if (!containerRef.current) return
    const isCurrentDay = isToday(selectedDate)
    const targetMinutes = sorted.length > 0
      ? timeToMinutes(sorted[0]!.startTime)
      : isCurrentDay
        ? currentMinutes
        : 9 * 60  // 오전 9시 기본값
    const totalHeight = timeSlots.length * HOUR_HEIGHT_PX
    const scrollTarget = ((targetMinutes - startHour * 60) / totalMinutes) * totalHeight - 40
    const scrollParent = containerRef.current.parentElement
    if (scrollParent) {
      scrollParent.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }
  }, [selectedDate])

  // previewTime이 바뀌면 해당 위치로 스크롤
  useEffect(() => {
    if (!previewTime || !containerRef.current) return
    const pvStart = timeToMinutes(previewTime.startTime)
    const totalHeight = timeSlots.length * HOUR_HEIGHT_PX
    const scrollTarget = ((pvStart - startHour * 60) / totalMinutes) * totalHeight - 60
    // 스크롤 컨테이너는 부모 (overflow-y-auto)
    const scrollParent = containerRef.current.parentElement
    if (scrollParent) {
      scrollParent.scrollTo({ top: Math.max(0, scrollTarget), behavior: 'smooth' })
    }
  }, [previewTime?.startTime, previewTime?.endTime])

  return (
    <div
      ref={containerRef}
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
          {/* 시간 라벨 + 구분선 — 같은 높이에 나란히 */}
          <div className="absolute left-0 right-0 top-0 flex items-center">
            <span className="w-[70px] shrink-0 text-right pr-2 text-[11px] text-gray-900 dark:text-neutral-300 select-none tabular-nums font-medium whitespace-nowrap">
              {formatAmPm(slot, t.time.am, t.time.pm)}
            </span>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <span className="hidden">
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
            <div className="w-[70px] flex justify-end pr-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            {/* 얇은 빨간 선 */}
            <div className="flex-1 h-0.5 bg-red-500" />
          </div>
        </div>
      )}

      {/* 스케줄 카드 + 미리보기 — 겹치는 일정은 나란히 배치 */}
      {(() => {
        // 미리보기도 포함한 전체 항목 리스트
        type Item = { id: string; startTime: string; endTime: string; isPreview: boolean; schedule?: Schedule }
        const items: Item[] = sorted.map((s) => ({
          id: s.id, startTime: s.startTime, endTime: s.endTime, isPreview: false, schedule: s,
        }))
        if (previewTime) {
          items.push({
            id: '__preview__', startTime: previewTime.startTime, endTime: previewTime.endTime, isPreview: true,
          })
          items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        }

        // 겹침 열 위치 계산
        const columns: { item: Item; col: number; totalCols: number }[] = []
        const active: { end: number; col: number }[] = []

        for (const item of items) {
          const sStart = timeToMinutes(item.startTime)
          const sEnd = timeToMinutes(item.endTime)
          const stillActive = active.filter((a) => a.end > sStart)
          const usedCols = new Set(stillActive.map((a) => a.col))
          let col = 0
          while (usedCols.has(col)) col++
          stillActive.push({ end: sEnd, col })
          active.length = 0
          active.push(...stillActive)
          columns.push({ item, col, totalCols: 0 })
        }

        // totalCols 계산
        for (let i = 0; i < columns.length; i++) {
          const curr = columns[i]!
          const currStart = timeToMinutes(curr.item.startTime)
          const currEnd = timeToMinutes(curr.item.endTime)
          let maxCol = curr.col
          for (const other of columns) {
            const oStart = timeToMinutes(other.item.startTime)
            const oEnd = timeToMinutes(other.item.endTime)
            if (currStart < oEnd && oStart < currEnd) {
              maxCol = Math.max(maxCol, other.col)
            }
          }
          columns[i] = { ...curr, totalCols: maxCol + 1 }
        }

        const previewColors: Record<string, { bg: string; border: string; text: string; sub: string }> = {
          blue:   { bg: 'bg-blue-50 dark:bg-blue-900/40',     border: '#3b82f6', text: 'text-blue-800 dark:text-blue-200',   sub: 'text-blue-600 dark:text-blue-300' },
          green:  { bg: 'bg-green-50 dark:bg-green-900/40',   border: '#22c55e', text: 'text-green-800 dark:text-green-200', sub: 'text-green-600 dark:text-green-300' },
          red:    { bg: 'bg-red-50 dark:bg-red-900/40',       border: '#ef4444', text: 'text-red-800 dark:text-red-200',     sub: 'text-red-600 dark:text-red-300' },
          yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/40', border: '#eab308', text: 'text-yellow-800 dark:text-yellow-200', sub: 'text-yellow-600 dark:text-yellow-300' },
          purple: { bg: 'bg-purple-50 dark:bg-purple-900/40', border: '#a855f7', text: 'text-purple-800 dark:text-purple-200', sub: 'text-purple-600 dark:text-purple-300' },
          orange: { bg: 'bg-orange-50 dark:bg-orange-900/40', border: '#f97316', text: 'text-orange-800 dark:text-orange-200', sub: 'text-orange-600 dark:text-orange-300' },
        }

        return columns.map(({ item, col, totalCols }) => {
          const itemStart = timeToMinutes(item.startTime)
          const itemEnd = timeToMinutes(item.endTime)
          const topPct = minutesToPercent(itemStart)
          const heightPct = ((itemEnd - itemStart) / totalMinutes) * 100

          if (item.isPreview && previewTime) {
            // 미리보기 블록 (나란히 배치 적용)
            const displayTitle = previewTime.title?.trim() || t.schedule.noTitle
            const c = previewColors[previewTime.color ?? 'blue'] ?? previewColors['blue']!
            const leftBase = 70
            const rightGap = 8
            const colWidthPct = 100 / totalCols
            const colLeft = col * colWidthPct
            return (
              <div
                key="__preview__"
                className={`absolute rounded-xl pointer-events-none overflow-hidden ${c.bg}`}
                style={{
                  top: `${topPct}%`,
                  height: `${Math.max(heightPct, 2.5)}%`,
                  minHeight: '48px',
                  borderLeft: `4px solid ${c.border}`,
                  padding: '8px 10px',
                  left: `calc(${leftBase}px + (100% - ${leftBase}px - ${rightGap}px) * ${colLeft / 100})`,
                  width: `calc((100% - ${leftBase}px - ${rightGap}px) * ${colWidthPct / 100} - 2px)`,
                }}
              >
                <p className={`text-[13px] font-semibold truncate leading-tight ${c.text}`}>
                  {displayTitle}
                </p>
                <p className={`text-[12px] font-medium mt-1 tabular-nums ${c.sub}`}>
                  {formatAmPm(previewTime.startTime, t.time.am, t.time.pm)} ~ {formatAmPm(previewTime.endTime, t.time.am, t.time.pm)}
                </p>
              </div>
            )
          }

          // 일반 스케줄 카드
          const schedule = item.schedule!
          const isNow =
            isCurrentTimeVisible &&
            currentMinutes >= itemStart &&
            currentMinutes <= itemEnd

          return (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              topPercent={topPct}
              heightPercent={heightPct}
              isNow={isNow}
              onEdit={onEditSchedule}
              onToggleComplete={onToggleComplete}
              columnIndex={col}
              totalColumns={totalCols}
            />
          )
        })
      })()}

      {/* 빈 상태 */}
      {schedules.length === 0 && !previewTime && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-neutral-400 dark:text-neutral-500">
            <p className="text-sm">{t.schedule.noSchedules}</p>
            <p className="text-xs mt-1">{t.schedule.addPrompt}</p>
          </div>
        </div>
      )}
    </div>
  )
}
