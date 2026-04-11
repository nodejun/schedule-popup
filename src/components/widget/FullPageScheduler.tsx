/**
 * 풀페이지 스케줄러 컴포넌트
 *
 * YouTube /shorts 페이지를 완전히 대체하는 메인 스케줄러.
 * DateNavigator + TimelineView + ScheduleForm(모달) + FAB(추가 버튼)으로 구성.
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import type { DeleteMode } from '@/stores/schedule-store'
import { useSettingsStore } from '@/stores/settings-store'
import { DateNavigator } from '../common/DateNavigator'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { TimelineView } from '../schedule/TimelineView'
import { ScheduleForm } from '../schedule/ScheduleForm'
import { RecurringDeleteDialog } from '../schedule/RecurringDeleteDialog'
import { useTranslation } from '@/i18n'

export const FullPageScheduler = (): ReactNode => {
  const t = useTranslation()
  const {
    selectedDate,
    schedules,
    isLoading,
    editingSchedule,
    isFormOpen,
    setSelectedDate,
    fetchSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleComplete,
    openAddForm,
    openEditForm,
    closeForm,
  } = useScheduleStore()

  const { settings, loadSettings } = useSettingsStore()

  /** 반복 일정 삭제 다이얼로그 표시 여부 */
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    void loadSettings()
    void fetchSchedules()
  }, [loadSettings, fetchSchedules])

  const handleDateChange = (date: string) => {
    void setSelectedDate(date)
  }

  const handleFormSubmit = (input: Parameters<typeof addSchedule>[0]) => {
    if (editingSchedule) {
      void updateSchedule(editingSchedule.id, input)
    } else {
      void addSchedule(input)
    }
  }

  /**
   * 삭제 버튼 클릭:
   * - 반복 일정의 인스턴스라면 → 다이얼로그 표시 (3옵션 선택)
   * - 단일 일정이라면          → 즉시 삭제
   */
  const handleDelete = () => {
    if (!editingSchedule) return
    if (editingSchedule.recurringEventId) {
      setShowDeleteDialog(true)
    } else {
      void deleteSchedule(editingSchedule.id)
      closeForm()
    }
  }

  /** 다이얼로그에서 모드 확정 시 호출 */
  const handleDeleteConfirm = (mode: DeleteMode) => {
    if (!editingSchedule) return
    void deleteSchedule(editingSchedule.id, mode)
    setShowDeleteDialog(false)
    closeForm()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 font-sans">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          ShortScheduler
        </h1>
        <Button variant="primary" size="md" onClick={() => openAddForm()}>
          {t.schedule.addSchedule}
        </Button>
      </div>

      {/* 날짜 네비게이터 */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      {/* 로딩 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 타임라인 */}
      {!isLoading && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
          <TimelineView
            schedules={[...schedules]}
            selectedDate={selectedDate}
            startHour={settings.timelineStartHour}
            endHour={settings.timelineEndHour}
            onEditSchedule={openEditForm}
            onToggleComplete={toggleComplete}
          />
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingSchedule ? t.schedule.editSchedule : t.schedule.newSchedule}
      >
        <ScheduleForm
          selectedDate={selectedDate}
          editingSchedule={editingSchedule}
          existingSchedules={[...schedules]}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
        {/* 수정 모드에서 삭제 버튼 */}
        {editingSchedule && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="w-full"
            >
              {t.schedule.deleteSchedule}
            </Button>
          </div>
        )}
      </Modal>

      {/* 반복 일정 삭제 확인 다이얼로그 — 폼 모달 위에 표시됨 (z-index 110) */}
      <RecurringDeleteDialog
        isOpen={showDeleteDialog}
        scheduleTitle={editingSchedule?.title ?? ''}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
