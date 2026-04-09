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
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
} from '@/services/google-calendar-api'
import { scheduleToGoogleEvent } from '@/utils/schedule-converter'
import { buildUntilRrule } from '@/utils/recurrence-utils'
import { useGoogleCalendarStore } from './google-calendar-store'
import {
  getCurrentMonth,
  getWeekDates,
  getMonthGridAllDates,
  getWeekStart,
} from '@/utils/calendar-utils'

/**
 * 반복 일정 삭제 모드
 *
 * - 'instance': 이 일정만 (Google이 EXDATE로 처리)
 * - 'future':   이 일정과 이후 모든 반복 (RRULE에 UNTIL 추가)
 * - 'all':      모든 반복 일정 (부모 이벤트 통째로 삭제)
 *
 * 단일 일정에는 의미가 없으며 'instance'와 동일하게 동작한다.
 */
export type DeleteMode = 'instance' | 'future' | 'all'

/**
 * ID로 Schedule을 찾는다 — 로컬 + Google 양쪽을 모두 검색.
 *
 * 로컬 schedules 배열은 선택된 날짜의 일정만 들고 있고,
 * Google 일정은 별도 store의 googleSchedules 맵에 날짜별로 저장돼 있어서
 * 두 곳을 다 뒤져야 한다.
 *
 * @param id - 찾을 스케줄 ID ('google_' 접두사 포함 가능)
 * @param localSchedules - 현재 선택 날짜의 로컬 스케줄 배열
 * @param googleSchedulesMap - Google 스케줄 맵 (date → schedules)
 * @returns 찾은 Schedule 또는 undefined
 */
const findScheduleById = (
  id: string,
  localSchedules: ReadonlyArray<Schedule>,
  googleSchedulesMap: Readonly<Record<string, ReadonlyArray<Schedule>>>
): Schedule | undefined => {
  // 1. 로컬 schedules에서 우선 검색
  const local = localSchedules.find((s) => s.id === id)
  if (local) return local

  // 2. Google schedules 맵의 모든 값에서 검색
  for (const dateSchedules of Object.values(googleSchedulesMap)) {
    const found = dateSchedules.find((s) => s.id === id)
    if (found) return found
  }

  return undefined
}
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
  /** 타임라인 클릭 시 사전 입력할 시간 (null이면 기본값 사용) */
  readonly initialFormTime: { readonly startTime: string; readonly endTime: string } | null

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
  /**
   * 스케줄 삭제
   *
   * @param id - 삭제할 스케줄 ID
   * @param mode - 반복 일정일 때의 삭제 모드 (기본: 'instance')
   *               - 'instance': 이 일정만 (단일 일정도 동일)
   *               - 'future':   이 일정과 향후 모든 반복
   *               - 'all':      모든 반복 일정 (부모 통째 삭제)
   */
  readonly deleteSchedule: (id: string, mode?: DeleteMode) => Promise<void>
  /** 완료 상태 토글 */
  readonly toggleComplete: (id: string) => Promise<void>
  /** 폼 모달 열기 (추가 모드) */
  readonly openAddForm: (initialTime?: { startTime: string; endTime: string }) => void
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
  initialFormTime: null,
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
      const { googleAuth, syncFromGoogle } = useGoogleCalendarStore.getState()

      if (googleAuth.isAuthenticated) {
        // Google 연결 시 → 선택한 캘린더에 저장 (recurrence 포함)
        await createEvent(scheduleToGoogleEvent(input), input.calendarId ?? 'primary')
        // Google에서 다시 가져오기
        await syncFromGoogle(get().currentMonth)
      } else {
        // 미연결 시 → 로컬에 저장
        await repoAdd(input)
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
      const { googleAuth, syncFromGoogle } = useGoogleCalendarStore.getState()

      if (googleAuth.isAuthenticated) {
        // Google 연결 시 → 선택한 캘린더에서 수정
        const googleEventId = id.startsWith('google_') ? id.replace('google_', '') : id
        const calendarId = patch.calendarId ?? 'primary'
        await updateEvent(googleEventId, scheduleToGoogleEvent({
          title: patch.title ?? '',
          date: patch.date ?? selectedDate,
          startTime: patch.startTime ?? '00:00',
          endTime: patch.endTime ?? '23:59',
          ...patch,
        } as ScheduleInput), calendarId)
        await syncFromGoogle(get().currentMonth)
      } else {
        // 미연결 시 → 로컬에서만 수정
        await repoUpdate(selectedDate, id, patch)
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

  deleteSchedule: async (id: string, mode: DeleteMode = 'instance') => {
    const { selectedDate } = get()
    set({ isLoading: true, error: null })
    try {
      const { googleAuth, googleSchedules, syncFromGoogle } =
        useGoogleCalendarStore.getState()

      if (googleAuth.isAuthenticated) {
        // 1. 현재 화면에 있는 모든 일정에서 target 찾기
        //    (로컬 schedules + Google schedules 둘 다 뒤져야 함)
        const target = findScheduleById(id, get().schedules, googleSchedules)
        if (!target) {
          throw new Error('삭제할 일정을 찾을 수 없습니다')
        }

        // 2. Google에 보낼 ID 정리 ('google_' 접두사 제거)
        const googleEventId = id.startsWith('google_')
          ? id.replace('google_', '')
          : id
        const calendarId = target.calendarId ?? 'primary'
        const isRecurringInstance = !!target.recurringEventId

        // 3. 분기 처리
        if (!isRecurringInstance || mode === 'instance') {
          // 단일 일정 또는 "이 일정만" — 인스턴스 ID로 직접 삭제
          // (Google이 알아서 EXDATE로 처리)
          await deleteEvent(googleEventId, calendarId)
        } else if (mode === 'all') {
          // "모든 반복 일정" — 부모 이벤트 통째로 삭제
          await deleteEvent(target.recurringEventId!, calendarId)
        } else {
          // "이 일정과 향후" — 부모를 GET해서 RRULE에 UNTIL 추가, PATCH
          const parent = await getEvent(target.recurringEventId!, calendarId)
          const originalRrule = parent.recurrence?.[0]
          if (!originalRrule) {
            throw new Error(
              '부모 이벤트의 반복 규칙(RRULE)을 찾을 수 없습니다'
            )
          }
          const newRrule = buildUntilRrule(
            originalRrule,
            target.date,
            target.startTime
          )
          await updateEvent(
            target.recurringEventId!,
            { recurrence: [newRrule] },
            calendarId
          )
        }

        await syncFromGoogle(get().currentMonth)
      } else {
        // Google 미연결 시 → 로컬에서만 삭제 (mode 무시)
        await repoDelete(selectedDate, id)
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

  openAddForm: (initialTime) => {
    set({ isFormOpen: true, editingSchedule: null, initialFormTime: initialTime ?? null })
  },

  openEditForm: (schedule: Schedule) => {
    set({ isFormOpen: true, editingSchedule: schedule, initialFormTime: null })
  },

  closeForm: () => {
    set({ isFormOpen: false, editingSchedule: null, initialFormTime: null })
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
