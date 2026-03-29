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
import { Modal } from '@/components/common/Modal'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { Button } from '@/components/common/Button'
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

  useEffect(() => {
    loadSettings()
    fetchMonthSchedules()
  }, [])

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

  const handleDeleteSchedule = useCallback(
    async (id: string) => {
      await deleteSchedule(id)
      closeForm()
    },
    [deleteSchedule, closeForm]
  )

  return (
    <div
      className="bg-white dark:bg-[#1f1f1f] font-sans"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* ── 상단 헤더 ── */}
      <div
        className="bg-white/80 dark:bg-[#1f1f1f]/80"
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '56px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <MonthNavigator
          currentMonth={currentMonth}
          onMonthChange={handleMonthChange}
        />

        {/* Google Calendar 연결 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!googleAuth.isAuthenticated ? (
            <button
              type="button"
              onClick={connectGoogle}
              aria-label="Google Calendar 연결"
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 500,
                border: '1px solid #dbeafe',
                background: 'none',
                cursor: 'pointer',
              }}
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
                className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 transition-all duration-200 disabled:opacity-50"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid #dcfce7',
                  background: 'none',
                  cursor: isGoogleSyncing ? 'not-allowed' : 'pointer',
                }}
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
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: 400,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
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
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/60 transition-all duration-200"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
          <div className="w-7 h-7 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── 메인 영역: 그리드 + (선택 시) 사이드 패널 ── */}
      {!isMonthLoading && (
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', background: '#f5f5f5' }}>
          {/* 캘린더 그리드 — 항상 전체 높이 차지 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <MonthGrid
              currentMonth={currentMonth}
              selectedDate={showDetail ? selectedDate : ''}
              monthSchedules={mergedMonthSchedules}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* 일간 상세 — 오른쪽 사이드 패널 */}
          {showDetail && (
            <div
              style={{
                width: '380px',
                flexShrink: 0,
                overflowY: 'auto',
                padding: '12px',
              }}
            >
              <DailyDetailPanel
                selectedDate={selectedDate}
                schedules={[...schedules, ...(googleSchedules[selectedDate] ?? [])]}
                startHour={settings.timelineStartHour}
                endHour={settings.timelineEndHour}
                onEditSchedule={openEditForm}
                onToggleComplete={toggleComplete}
                onOpenAddForm={openAddForm}
                onClose={handleCloseDetail}
              />
            </div>
          )}
        </div>
      )}

      {/* 일정 폼 모달 — overflow:hidden 밖에서 렌더링 */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingSchedule ? '일정 수정' : '일정 추가'}
      >
        <ScheduleForm
          selectedDate={selectedDate}
          editingSchedule={editingSchedule}
          existingSchedules={schedules}
          onSubmit={handleSubmitForm}
          onCancel={closeForm}
        />
        {editingSchedule && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e5e5' }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteSchedule(editingSchedule.id)}
            >
              삭제
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
