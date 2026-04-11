/**
 * Popup 앱 컴포넌트
 *
 * Chrome 확장프로그램 아이콘 클릭 시 표시되는 팝업.
 * 오늘 일정 목록 + 빠른 추가 + YouTube 스케줄러 열기 버튼.
 */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useScheduleStore } from '@/stores/schedule-store'
import { DateNavigator } from '@/components/common/DateNavigator'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { useTranslation } from '@/i18n'

export const App = (): ReactNode => {
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
    toggleComplete,
    openAddForm,
    openEditForm,
    closeForm,
  } = useScheduleStore()

  useEffect(() => {
    void fetchSchedules()
  }, [fetchSchedules])

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

  const handleOpenFullScheduler = () => {
    void chrome.tabs.create({ url: 'https://www.youtube.com/shorts' })
  }

  return (
    <div className="w-[350px] min-h-[400px] max-h-[500px] flex flex-col bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">ShortScheduler</h1>
          <Button variant="primary" size="sm" onClick={() => openAddForm()}>
            {t.schedule.addSchedule}
          </Button>
        </div>

        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ScheduleList
            schedules={[...schedules]}
            onToggleComplete={toggleComplete}
            onEdit={openEditForm}
          />
        )}
      </div>

      {/* 하단: 풀 스케줄러 열기 */}
      <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
        <button
          onClick={handleOpenFullScheduler}
          className="w-full py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
        >
          {t.schedule.openInYouTube}
        </button>
      </div>

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
      </Modal>
    </div>
  )
}
