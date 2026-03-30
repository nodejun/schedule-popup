/**
 * 일간 상세 패널 (YouTube 레드 테마)
 *
 * 월간 그리드에서 날짜 클릭 시 하단에 표시
 * 기존 TimelineView를 래핑하되 YouTube 스타일 액센트 적용
 */

import type { Schedule } from '@/types/schedule'
import { TimelineView } from '@/components/schedule/TimelineView'
import { formatDateDisplay } from '@/utils/date-utils'

interface DailyDetailPanelProps {
  readonly selectedDate: string
  readonly schedules: ReadonlyArray<Schedule>
  readonly startHour: number
  readonly endHour: number
  readonly onEditSchedule: (schedule: Schedule) => void
  readonly onToggleComplete: (id: string) => void
  readonly onOpenAddForm: () => void
  readonly onClose: () => void
  readonly onTimeSlotClick?: (startTime: string, endTime: string) => void
}

export const DailyDetailPanel = ({
  selectedDate,
  schedules,
  startHour,
  endHour,
  onEditSchedule,
  onToggleComplete,
  onOpenAddForm,
  onClose,
  onTimeSlotClick,
}: DailyDetailPanelProps) => {
  return (
    <div
      className="bg-white dark:bg-[#252525] rounded-2xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 h-full flex flex-col"
    >
      {/* 헤더 — 고정 */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200"
            aria-label="패널 닫기"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-neutral-200 leading-snug">
              {formatDateDisplay(selectedDate)}
            </h3>
            <span className="text-[11px] text-gray-400 leading-snug">
              {schedules.length}개 일정
            </span>
          </div>
        </div>

        {/* 일정 추가 버튼 — YouTube 레드 */}
        <button
          type="button"
          onClick={onOpenAddForm}
          className="flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-2
                     bg-red-500 text-white hover:bg-red-600 active:bg-red-700
                     transition-all duration-200 hover:scale-[1.02]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          일정 추가
        </button>
      </div>

      {/* 타임라인 — 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <TimelineView
          schedules={schedules}
          selectedDate={selectedDate}
          startHour={startHour}
          endHour={endHour}
          onEditSchedule={onEditSchedule}
          onToggleComplete={onToggleComplete}
          onTimeSlotClick={onTimeSlotClick}
        />
      </div>
    </div>
  )
}
