/**
 * 스케줄 상태 관리 스토어
 *
 * zustand은 React Context 없이 모듈 스코프 싱글턴으로 동작하므로,
 * Shadow DOM 안의 React root에서도 import만으로 같은 상태를 공유한다.
 *
 * 모든 상태 변경은 immutable — 기존 상태를 변이시키지 않고 새 객체를 반환한다.
 */

import { create } from 'zustand'
import type { Schedule, ScheduleInput } from '@/types/schedule'
import {
  getSchedulesByDate,
  getSchedulesByDateRange,
  addSchedule as repoAdd,
  updateSchedule as repoUpdate,
  deleteSchedule as repoDelete,
  toggleComplete as repoToggle,
} from '@/storage/schedule-repository'
import { getToday } from '@/utils/date-utils'
import { createEvent, updateEvent, deleteEvent } from '@/services/google-calendar-api'
import { scheduleToGoogleEvent } from '@/utils/schedule-converter'
import { useGoogleCalendarStore } from './google-calendar-store'
import {
  getCurrentMonth,
  getWeekDates,
  getMonthGridAllDates,
  getWeekStart,
} from '@/utils/calendar-utils'
interface ScheduleState {
  /** 현재 선택된 날짜 (YYYY-MM-DD) */
  readonly selectedDate: string
  /** 선택된 날짜의 스케줄 목록 */
  readonly schedules: ReadonlyArray<Schedule>
  /** 데이터 로딩 중 여부 */
  readonly isLoading: boolean
  /** 에러 메시지 */
  readonly error: string | null
  /** 편집 중인 스케줄 (null이면 새로 추가 모드) */
  readonly editingSchedule: Schedule | null
  /** 폼 모달 열림 여부 */
  readonly isFormOpen: boolean

  /** 현재 표시 중인 월 (YYYY-MM) */
  readonly currentMonth: string
  /** 현재 주의 월요일 (YYYY-MM-DD) */
  readonly currentWeekStart: string
  /** 월간 뷰 스케줄 맵 (date → schedules) */
  readonly monthSchedules: Readonly<Record<string, ReadonlyArray<Schedule>>>
  /** 주간 뷰 스케줄 맵 (date → schedules) */
  readonly weekSchedules: Readonly<Record<string, ReadonlyArray<Schedule>>>
  /** 월간 데이터 로딩 중 */
  readonly isMonthLoading: boolean
  /** 주간 데이터 로딩 중 */
  readonly isWeekLoading: boolean

}

interface ScheduleActions {
  /** 날짜 변경 및 해당 날짜의 스케줄 로드 */
  readonly setSelectedDate: (date: string) => Promise<void>
  /** 현재 날짜의 스케줄 새로고침 */
  readonly fetchSchedules: () => Promise<void>
  /** 새 스케줄 추가 */
  readonly addSchedule: (input: ScheduleInput) => Promise<void>
  /** 스케줄 수정 */
  readonly updateSchedule: (
    id: string,
    patch: Partial<ScheduleInput>
  ) => Promise<void>
  /** 스케줄 삭제 */
  readonly deleteSchedule: (id: string) => Promise<void>
  /** 완료 상태 토글 */
  readonly toggleComplete: (id: string) => Promise<void>
  /** 폼 모달 열기 (추가 모드) */
  readonly openAddForm: () => void
  /** 폼 모달 열기 (수정 모드) */
  readonly openEditForm: (schedule: Schedule) => void
  /** 폼 모달 닫기 */
  readonly closeForm: () => void

  /** 월 변경 및 해당 월 스케줄 일괄 로드 */
  readonly setCurrentMonth: (yearMonth: string) => Promise<void>
  /** 월간 스케줄 새로고침 */
  readonly fetchMonthSchedules: () => Promise<void>
  /** 주간 시작일 변경 및 해당 주 스케줄 로드 */
  readonly setCurrentWeekStart: (date: string) => Promise<void>
  /** 주간 스케줄 새로고침 */
  readonly fetchWeekSchedules: () => Promise<void>

}

export type ScheduleStore = ScheduleState & ScheduleActions

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  // --- State ---
  selectedDate: getToday(),
  schedules: [],
  isLoading: false,
  error: null,
  editingSchedule: null,
  isFormOpen: false,
  currentMonth: getCurrentMonth(),
  currentWeekStart: getWeekStart(getToday()),
  monthSchedules: {},
  weekSchedules: {},
  isMonthLoading: false,
  isWeekLoading: false,

  // --- Actions ---
  setSelectedDate: async (date: string) => {
    set({ selectedDate: date, isLoading: true, error: null })
    try {
      const schedules = await getSchedulesByDate(date)
      set({ schedules, isLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load schedules'
      set({ error: message, isLoading: false })
    }
  },

  fetchSchedules: async () => {
    const { selectedDate } = get()
    set({ isLoading: true, error: null })
    try {
      const schedules = await getSchedulesByDate(selectedDate)
      set({ schedules, isLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load schedules'
      set({ error: message, isLoading: false })
    }
  },

  addSchedule: async (input: ScheduleInput) => {
    set({ isLoading: true, error: null })
    try {
      await repoAdd(input)

      // Google Calendar에도 생성 (연결된 경우만)
      const { googleAuth } = useGoogleCalendarStore.getState()
      if (googleAuth.isAuthenticated) {
        try {
          await createEvent(scheduleToGoogleEvent(input))
        } catch {
          // Google 실패해도 로컬 저장은 유지
        }
      }

      const schedules = await getSchedulesByDate(get().selectedDate)
      set({ schedules, isLoading: false, isFormOpen: false })
      get().fetchMonthSchedules()
      get().fetchWeekSchedules()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to add schedule'
      set({ error: message, isLoading: false })
    }
  },

  updateSchedule: async (id: string, patch: Partial<ScheduleInput>) => {
    const { selectedDate } = get()
    set({ isLoading: true, error: null })
    try {
      const isGoogleEvent = id.startsWith('google_')

      if (isGoogleEvent) {
        // Google 스케줄 → Google API로만 수정 (로컬에 없음)
        const { googleAuth } = useGoogleCalendarStore.getState()
        if (googleAuth.isAuthenticated) {
          const googleEventId = id.replace('google_', '')
          await updateEvent(googleEventId, scheduleToGoogleEvent({
            title: patch.title ?? '',
            date: patch.date ?? selectedDate,
            startTime: patch.startTime ?? '00:00',
            endTime: patch.endTime ?? '23:59',
            ...patch,
          } as ScheduleInput))
          // Google 동기화 갱신
          useGoogleCalendarStore.getState().syncFromGoogle(get().currentMonth)
        }
      } else {
        // 로컬 스케줄 → 로컬 저장소 수정
        await repoUpdate(selectedDate, id, patch)

        // Google 연결 시 Google에도 생성
        const { googleAuth } = useGoogleCalendarStore.getState()
        if (googleAuth.isAuthenticated) {
          try {
            await updateEvent(id, scheduleToGoogleEvent({
              title: patch.title ?? '',
              date: patch.date ?? selectedDate,
              startTime: patch.startTime ?? '00:00',
              endTime: patch.endTime ?? '23:59',
              ...patch,
            } as ScheduleInput))
          } catch {
            // Google 실패해도 로컬 수정은 유지
          }
        }
      }

      const schedules = await getSchedulesByDate(selectedDate)
      set({
        schedules,
        isLoading: false,
        isFormOpen: false,
        editingSchedule: null,
      })
      get().fetchMonthSchedules()
      get().fetchWeekSchedules()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update schedule'
      set({ error: message, isLoading: false })
    }
  },

  deleteSchedule: async (id: string) => {
    const { selectedDate } = get()
    set({ isLoading: true, error: null })
    try {
      const isGoogleEvent = id.startsWith('google_')

      if (isGoogleEvent) {
        // Google 스케줄 → Google API로만 삭제
        const { googleAuth } = useGoogleCalendarStore.getState()
        if (googleAuth.isAuthenticated) {
          const googleEventId = id.replace('google_', '')
          await deleteEvent(googleEventId)
          useGoogleCalendarStore.getState().syncFromGoogle(get().currentMonth)
        }
      } else {
        // 로컬 스케줄 → 로컬 저장소 삭제
        await repoDelete(selectedDate, id)

        // Google 연결 시 Google에서도 삭제
        const { googleAuth } = useGoogleCalendarStore.getState()
        if (googleAuth.isAuthenticated) {
          try {
            await deleteEvent(id)
          } catch {
            // Google 실패해도 로컬 삭제는 유지
          }
        }
      }

      const schedules = await getSchedulesByDate(selectedDate)
      set({ schedules, isLoading: false })
      get().fetchMonthSchedules()
      get().fetchWeekSchedules()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete schedule'
      set({ error: message, isLoading: false })
    }
  },

  toggleComplete: async (id: string) => {
    const { selectedDate } = get()
    try {
      await repoToggle(selectedDate, id)
      const schedules = await getSchedulesByDate(selectedDate)
      set({ schedules })
      get().fetchMonthSchedules()
      get().fetchWeekSchedules()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to toggle schedule'
      set({ error: message })
    }
  },

  openAddForm: () => {
    set({ isFormOpen: true, editingSchedule: null })
  },

  openEditForm: (schedule: Schedule) => {
    set({ isFormOpen: true, editingSchedule: schedule })
  },

  closeForm: () => {
    set({ isFormOpen: false, editingSchedule: null })
  },

  // --- Calendar Actions ---
  setCurrentMonth: async (yearMonth: string) => {
    set({ currentMonth: yearMonth, isMonthLoading: true })
    try {
      const dates = getMonthGridAllDates(yearMonth)
      const monthSchedules = await getSchedulesByDateRange(dates)
      set({ monthSchedules, isMonthLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load month schedules'
      set({ error: message, isMonthLoading: false })
    }
  },

  fetchMonthSchedules: async () => {
    const { currentMonth } = get()
    set({ isMonthLoading: true })
    try {
      const dates = getMonthGridAllDates(currentMonth)
      const monthSchedules = await getSchedulesByDateRange(dates)
      set({ monthSchedules, isMonthLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load month schedules'
      set({ error: message, isMonthLoading: false })
    }
  },

  setCurrentWeekStart: async (date: string) => {
    set({ currentWeekStart: date, isWeekLoading: true })
    try {
      const dates = getWeekDates(date)
      const weekSchedules = await getSchedulesByDateRange(dates)
      set({ weekSchedules, isWeekLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load week schedules'
      set({ error: message, isWeekLoading: false })
    }
  },

  fetchWeekSchedules: async () => {
    const { currentWeekStart } = get()
    set({ isWeekLoading: true })
    try {
      const dates = getWeekDates(currentWeekStart)
      const weekSchedules = await getSchedulesByDateRange(dates)
      set({ weekSchedules, isWeekLoading: false })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load week schedules'
      set({ error: message, isWeekLoading: false })
    }
  },

}))
