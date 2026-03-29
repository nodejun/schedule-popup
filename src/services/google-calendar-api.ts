/**
 * Google Calendar API 호출 서비스
 *
 * fetchWithAuth를 사용하여 Google Calendar API의 CRUD를 수행한다.
 * 각 함수는 URL과 옵션을 조합하여 fetchWithAuth에 전달하는 역할.
 *
 * NestJS 비유: CalendarController (fetchWithAuth = HttpService)
 *
 * @see https://developers.google.com/calendar/api/v3/reference/events
 */

import { fetchWithAuth } from './google-auth'
import type {
  GoogleCalendarEvent,
  GoogleCalendarListResponse,
  GoogleEventInput,
} from '@/types/google-calendar'

/** Google Calendar API 기본 URL */
const BASE_URL = 'https://www.googleapis.com/calendar/v3'

// ─────────────────────────────────────────────
// 조회 (Read)
// ─────────────────────────────────────────────

/**
 * 특정 기간의 이벤트 목록을 가져온다.
 *
 * @param timeMin - 시작 시간 (ISO 8601, 예: '2026-03-01T00:00:00Z')
 * @param timeMax - 종료 시간 (ISO 8601, 예: '2026-03-31T23:59:59Z')
 * @param calendarId - 캘린더 ID (기본: 'primary' = 사용자 기본 캘린더)
 * @returns 이벤트 배열
 *
 * NestJS 비유: GET /calendar/events?timeMin=...&timeMax=...
 */
export const getEvents = async (
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
): Promise<ReadonlyArray<GoogleCalendarEvent>> => {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`
  const response = await fetchWithAuth(url)

  if (!response.ok) {
    throw new Error(`Google Calendar API 에러: ${response.status}`)
  }

  const data: GoogleCalendarListResponse = await response.json()
  return data.items ?? []
}

// ─────────────────────────────────────────────
// 생성 (Create)
// ─────────────────────────────────────────────

/**
 * Google Calendar에 새 이벤트를 생성한다.
 *
 * @param input - 이벤트 데이터 (제목, 시작/종료 시간 등)
 * @param calendarId - 캘린더 ID (기본: 'primary')
 * @returns 생성된 이벤트 (Google이 id를 부여해서 돌려줌)
 *
 * NestJS 비유: POST /calendar/events
 */
export const createEvent = async (
  input: GoogleEventInput,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> => {
  const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`이벤트 생성 실패: ${response.status}`)
  }

  return response.json()
}

// ─────────────────────────────────────────────
// 수정 (Update)
// ─────────────────────────────────────────────

/**
 * 기존 이벤트를 수정한다.
 *
 * @param eventId - 수정할 이벤트 ID (createEvent에서 받은 id)
 * @param input - 수정할 데이터 (전체 덮어쓰기)
 * @param calendarId - 캘린더 ID (기본: 'primary')
 * @returns 수정된 이벤트
 *
 * PATCH를 사용하여 보낸 필드만 수정, 나머지는 기존 값 유지.
 * (PUT은 전체 교체라서 빠뜨린 필드가 초기화됨)
 *
 * NestJS 비유: PATCH /calendar/events/:id
 */
export const updateEvent = async (
  eventId: string,
  input: Partial<GoogleEventInput>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> => {
  const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(`이벤트 수정 실패: ${response.status}`)
  }

  return response.json()
}

// ─────────────────────────────────────────────
// 삭제 (Delete)
// ─────────────────────────────────────────────

/**
 * 이벤트를 삭제한다.
 *
 * @param eventId - 삭제할 이벤트 ID
 * @param calendarId - 캘린더 ID (기본: 'primary')
 *
 * NestJS 비유: DELETE /calendar/events/:id
 */
export const deleteEvent = async (
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  const url = `${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`이벤트 삭제 실패: ${response.status}`)
  }
}
