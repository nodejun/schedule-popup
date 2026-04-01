/**
 * Google Calendar 상태 관리 스토어
 *
 * Google Calendar 인증 및 동기화를 전담하는 독립 스토어.
 * schedule-store와 분리하여 관심사를 분리한다.
 *
 * NestJS 비유: GoogleCalendarService (ScheduleService와 별도)
 */

import { create } from 'zustand'
import type { Schedule } from '@/types/schedule'
import type { GoogleAuthState } from '@/types/google-calendar'
import {
  getAuthToken,
  removeAuthToken,
} from '@/services/google-auth'
import { getEvents } from '@/services/google-calendar-api'
import { googleEventsToSchedules } from '@/utils/schedule-converter'

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

interface GoogleCalendarState {
  /** Google 인증 상태 */
  readonly googleAuth: GoogleAuthState
  /** Google에서 가져온 스케줄 (날짜별) */
  readonly googleSchedules: Readonly<Record<string, ReadonlyArray<Schedule>>>
  /** Google 동기화 로딩 중 */
  readonly isGoogleSyncing: boolean
  /** 동기화 에러 메시지 */
  readonly syncError: string | null
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

interface GoogleCalendarActions {
  /** 캐시된 토큰으로 자동 인증 확인 + 동기화 (캘린더 열릴 때 호출) */
  readonly checkAuthAndSync: (yearMonth: string) => Promise<void>
  /** Google 로그인 + 초기 동기화 */
  readonly connectGoogle: () => Promise<void>
  /** Google 로그아웃 */
  readonly disconnectGoogle: () => Promise<void>
  /** Google에서 특정 기간의 일정 가져오기 */
  readonly syncFromGoogle: (yearMonth: string) => Promise<void>
}

export type GoogleCalendarStore = GoogleCalendarState & GoogleCalendarActions

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useGoogleCalendarStore = create<GoogleCalendarStore>(
  (set, get) => ({
    // --- State ---
    googleAuth: { isAuthenticated: false, accessToken: null, error: null },
    googleSchedules: {},
    isGoogleSyncing: false,
    syncError: null,

    // --- Actions ---
    checkAuthAndSync: async (yearMonth: string) => {
      // 이미 인증된 상태면 동기화만
      if (get().googleAuth.isAuthenticated) {
        get().syncFromGoogle(yearMonth)
        return
      }
      // 캐시된 토큰 확인 (팝업 없이, interactive: false)
      try {
        const token = await getAuthToken(false)
        set({
          googleAuth: {
            isAuthenticated: true,
            accessToken: token,
            error: null,
          },
        })
        get().syncFromGoogle(yearMonth)
      } catch {
        // 토큰 없음 = 미연결 상태 → 무시 (사용자가 직접 연결해야 함)
      }
    },

    connectGoogle: async () => {
      try {
        const token = await getAuthToken(true)
        set({
          googleAuth: {
            isAuthenticated: true,
            accessToken: token,
            error: null,
          },
          syncError: null,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Google 연결 실패'
        set({
          googleAuth: {
            isAuthenticated: false,
            accessToken: null,
            error: message,
          },
        })
      }
    },

    disconnectGoogle: async () => {
      const { googleAuth } = get()
      if (googleAuth.accessToken) {
        await removeAuthToken(googleAuth.accessToken)
      }
      set({
        googleAuth: { isAuthenticated: false, accessToken: null, error: null },
        googleSchedules: {},
        syncError: null,
      })
    },

    syncFromGoogle: async (yearMonth: string) => {
      const { googleAuth } = get()
      if (!googleAuth.isAuthenticated) return

      set({ isGoogleSyncing: true, syncError: null })
      try {
        // 해당 월의 시작~끝 기간 계산
        const timeMin = `${yearMonth}-01T00:00:00Z`
        const lastDay = new Date(
          parseInt(yearMonth.split('-')[0] ?? '2026', 10),
          parseInt(yearMonth.split('-')[1] ?? '1', 10),
          0
        ).getDate()
        const timeMax = `${yearMonth}-${String(lastDay).padStart(2, '0')}T23:59:59Z`

        // Google Calendar API 호출
        const events = await getEvents(timeMin, timeMax)

        // Google 이벤트 → Schedule 변환
        const schedules = googleEventsToSchedules(events)

        // 날짜별로 분류
        const googleSchedules: Record<string, ReadonlyArray<Schedule>> = {}
        for (const schedule of schedules) {
          const existing = googleSchedules[schedule.date] ?? []
          googleSchedules[schedule.date] = [...existing, schedule]
        }

        set({ googleSchedules, isGoogleSyncing: false })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Google 동기화 실패'
        set({ syncError: message, isGoogleSyncing: false })
      }
    },
  })
)
