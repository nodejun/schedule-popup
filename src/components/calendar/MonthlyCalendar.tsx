/**
 * 월간 캘린더 뷰 (Google Calendar 스타일 + YouTube 레드 테마)
 *
 * 레이아웃:
 * ┌─────────────────────────────────────────────┐
 * │ [오늘] < > 2026년 3월           [← 돌아가기] │  ← 헤더 (48px)
 * ├───────────────────────────┬──────────────────┤
 * │ 월  화  수  목  금  토  일  │                  │
 * │  날짜 그리드              │  일간 상세 패널   │  ← 메인 영역
 * │  (전체 공간 차지)          │  (날짜 클릭 시)   │
 * └───────────────────────────┴──────────────────┘
 */

import { useEffect, useState, useCallback } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useGoogleCalendarStore } from '@/stores/google-calendar-store'
import { MonthNavigator } from './MonthNavigator'
import { MonthGrid } from './MonthGrid'
import { DailyDetailPanel } from './DailyDetailPanel'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { minutesToTimeString } from '@/utils/date-utils'
import type { Schedule, ScheduleInput } from '@/types/schedule'

interface MonthlyCalendarProps {
  readonly onClose: () => void
}

export const MonthlyCalendar = ({ onClose }: MonthlyCalendarProps) => {
  const {
    currentMonth,
    selectedDate,
    schedules,
    monthSchedules,
    isMonthLoading,
    isFormOpen,
    editingSchedule,
    initialFormTime,
    setCurrentMonth,
    setSelectedDate,
    fetchMonthSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleComplete,
    openAddForm,
    openEditForm,
    closeForm,
  } = useScheduleStore()

  const { settings, loadSettings } = useSettingsStore()

  const {
    googleAuth,
    googleSchedules,
    isGoogleSyncing,
    checkAuthAndSync,
    connectGoogle,
    disconnectGoogle,
    syncFromGoogle,
  } = useGoogleCalendarStore()

  const [showDetail, setShowDetail] = useState(false)

  // 로컬 스케줄 + Google 스케줄 합치기
  const mergedMonthSchedules: Record<string, ReadonlyArray<Schedule>> = { ...monthSchedules }
  for (const [date, googleItems] of Object.entries(googleSchedules)) {
    const existing = mergedMonthSchedules[date] ?? []
    mergedMonthSchedules[date] = [...existing, ...googleItems]
  }

  const [previewTitle, setPreviewTitle] = useState('')

  useEffect(() => {
    loadSettings()
    fetchMonthSchedules()
    // 캐시된 Google 토큰이 있으면 자동 연결 + 동기화
    checkAuthAndSync(currentMonth)
  }, [])

  // 폼이 닫히면 미리보기 제목 초기화
  useEffect(() => {
    if (!isFormOpen) setPreviewTitle('')
  }, [isFormOpen])

  const handleMonthChange = useCallback(
    (yearMonth: string) => {
      setCurrentMonth(yearMonth)
    },
    [setCurrentMonth]
  )

  const handleDateSelect = useCallback(
    async (date: string) => {
      await setSelectedDate(date)
      setShowDetail(true)
    },
    [setSelectedDate]
  )

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false)
  }, [])

  const handleSubmitForm = useCallback(
    async (input: ScheduleInput) => {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, input)
      } else {
        await addSchedule(input)
      }
    },
    [editingSchedule, addSchedule, updateSchedule]
  )

  const handleTimeSlotClick = useCallback(
    (startTime: string, endTime: string) => {
      openAddForm({ startTime, endTime })
    },
    [openAddForm]
  )

  const handleDeleteSchedule = useCallback(
    async (id: string) => {
      await deleteSchedule(id)
      closeForm()
    },
    [deleteSchedule, closeForm]
  )

  return (
    <div
      className="bg-white dark:bg-[#1f1f1f] font-sans flex flex-col h-full overflow-hidden break-keep-all"
    >
      {/* ── 상단 헤더 ── */}
      <div className="bg-white/80 dark:bg-[#1f1f1f]/80 shrink-0 flex items-center justify-between px-6 h-14 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

        <MonthNavigator
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Google Calendar 연결 버튼 */}
        <div className="flex items-center gap-2">
          {!googleAuth.isAuthenticated ? (
            <button
              type="button"
              onClick={connectGoogle}
              aria-label="Google Calendar 연결"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-medium border border-blue-100 bg-transparent cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Google Calendar 연결
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => syncFromGoogle(currentMonth)}
                disabled={isGoogleSyncing}
                aria-label="Google Calendar 동기화"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-medium border border-green-100 bg-transparent cursor-pointer disabled:cursor-not-allowed text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 transition-all duration-200 disabled:opacity-50"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className={isGoogleSyncing ? 'animate-spin' : ''}
                >
                  <path d="M4 4v5h5M20 20v-5h-5M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {isGoogleSyncing ? '동기화 중...' : '동기화'}
              </button>
              <button
                type="button"
                onClick={disconnectGoogle}
                aria-label="Google Calendar 연결 해제"
                className="px-2.5 py-1.5 rounded-[10px] text-[11px] font-normal border-none bg-transparent cursor-pointer text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                연결 해제
              </button>
            </>
          )}
        </div>

        {/* YouTube 복귀 버튼 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="YouTube로 돌아가기"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium border-none bg-transparent cursor-pointer text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/60 transition-all duration-200"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          YouTube로 돌아가기
        </button>
      </div>

      {/* 로딩 */}
      {isMonthLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-7 h-7 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── 메인 영역: 그리드 + (선택 시) 사이드 패널 ── */}
      {!isMonthLoading && (
        <div className="flex-1 flex min-h-0 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          {/* 캘린더 그리드 — 항상 전체 높이 차지 */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <MonthGrid
              currentMonth={currentMonth}
              selectedDate={showDetail ? selectedDate : ''}
              monthSchedules={mergedMonthSchedules}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* 인라인 폼 — 타임라인 왼쪽에 별도 패널 */}
          {showDetail && isFormOpen && (
            <div className="w-[280px] shrink-0 overflow-y-auto p-3">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm ring-1 ring-black/10 dark:ring-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-gray-900 dark:text-neutral-200">
                    {editingSchedule ? '일정 수정' : '새 일정'}
                  </h4>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200"
                    aria-label="폼 닫기"
                  >
                    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                      <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <ScheduleForm
                  selectedDate={selectedDate}
                  editingSchedule={editingSchedule}
                  existingSchedules={schedules}
                  onSubmit={handleSubmitForm}
                  onCancel={closeForm}
                  onTitleChange={setPreviewTitle}
                />
                {editingSchedule && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(editingSchedule.id)}
                      className="px-4 py-2 text-sm font-medium rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 일간 상세 — 타임라인 */}
          {showDetail && (
            <div className="w-[380px] shrink-0 overflow-hidden p-3">
              <DailyDetailPanel
                selectedDate={selectedDate}
                schedules={[...schedules, ...(googleSchedules[selectedDate] ?? [])]}
                startHour={settings.timelineStartHour}
                endHour={settings.timelineEndHour}
                onEditSchedule={openEditForm}
                onToggleComplete={toggleComplete}
                onOpenAddForm={() => {
                  const now = new Date()
                  const currentMinutes = Math.floor((now.getHours() * 60 + now.getMinutes()) / 15) * 15
                  openAddForm({
                    startTime: minutesToTimeString(currentMinutes),
                    endTime: minutesToTimeString(Math.min(currentMinutes + 60, 23 * 60 + 45)),
                  })
                }}
                onClose={handleCloseDetail}
                onTimeSlotClick={handleTimeSlotClick}
                previewTime={isFormOpen && initialFormTime ? { ...initialFormTime, title: previewTitle } : null}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
