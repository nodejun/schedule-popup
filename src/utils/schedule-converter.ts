/**
 * Google Calendar 이벤트 ↔ Schedule 변환 유틸
 *
 * Google Calendar API의 이벤트 형식과 우리 Schedule 형식은 다르다.
 * 이 파일이 둘 사이의 "번역기" 역할을 한다.
 *
 * NestJS 비유: Entity ↔ DTO 변환 mapper
 */

import type { GoogleCalendarEvent, GoogleEventInput } from '@/types/google-calendar'
import type { Schedule, ScheduleColor, ScheduleInput } from '@/types/schedule'

// ─────────────────────────────────────────────
// Google colorId ↔ 우리 color 매핑
// ─────────────────────────────────────────────

/**
 * Google Calendar colorId → 우리 ScheduleColor 매핑 테이블
 *
 * Google은 색상을 '1'~'11' 문자열로 관리하고,
 * 우리는 'blue', 'green' 등 이름으로 관리한다.
 *
 * @see https://developers.google.com/calendar/api/v3/reference/colors
 */
const GOOGLE_COLOR_TO_SCHEDULE: Readonly<Record<string, ScheduleColor>> = {
  '1': 'blue',     // Lavender → blue
  '2': 'green',    // Sage → green
  '3': 'purple',   // Grape → purple
  '4': 'red',      // Flamingo → red
  '5': 'yellow',   // Banana → yellow
  '6': 'orange',   // Tangerine → orange
  '7': 'blue',     // Peacock → blue
  '8': 'green',    // Basil → green
  '9': 'blue',     // Blueberry → blue
  '10': 'green',   // Sage → green
  '11': 'red',     // Tomato → red
}

/**
 * 우리 ScheduleColor → Google Calendar colorId 매핑 (역방향)
 */
const SCHEDULE_COLOR_TO_GOOGLE: Readonly<Record<ScheduleColor, string>> = {
  blue: '9',      // Blueberry
  green: '2',     // Sage
  red: '11',      // Tomato
  yellow: '5',    // Banana
  purple: '3',    // Grape
  orange: '6',    // Tangerine
}

// ─────────────────────────────────────────────
// 시간 파싱 헬퍼
// ─────────────────────────────────────────────

/**
 * Google의 ISO 8601 dateTime에서 날짜(YYYY-MM-DD)를 추출한다.
 *
 * @example
 * extractDate('2026-03-16T09:00:00+09:00') → '2026-03-16'
 * extractDate('2026-03-16') → '2026-03-16' (종일 이벤트)
 */
const extractDate = (dateTime?: string, date?: string): string => {
  if (date) return date
  if (dateTime) return dateTime.slice(0, 10)
  return ''
}

/**
 * Google의 ISO 8601 dateTime에서 시간(HH:mm)을 추출한다.
 *
 * @example
 * extractTime('2026-03-16T09:00:00+09:00') → '09:00'
 * extractTime(undefined) → '00:00' (종일 이벤트)
 */
const extractTime = (dateTime?: string): string => {
  if (!dateTime) return '00:00'
  const timePart = dateTime.slice(11, 16)
  return timePart || '00:00'
}

// ─────────────────────────────────────────────
// Google Event → Schedule 변환
// ─────────────────────────────────────────────

/**
 * Google Calendar 이벤트를 우리 Schedule 형식으로 변환한다.
 *
 * @param event - Google Calendar 이벤트
 * @returns 우리 Schedule 형식의 객체
 *
 * NestJS 비유: Entity → ResponseDTO 변환
 */
interface CalendarMeta {
  readonly calendarId?: string
  readonly calendarName?: string
  readonly calendarColor?: string
}

export const googleEventToSchedule = (
  event: GoogleCalendarEvent,
  meta: CalendarMeta = {}
): Schedule => ({
  id: `google_${event.id}`,
  title: event.summary || '(제목 없음)',
  description: event.description ?? '',
  date: extractDate(event.start.dateTime, event.start.date),
  startTime: extractTime(event.start.dateTime),
  endTime: extractTime(event.end.dateTime),
  color: GOOGLE_COLOR_TO_SCHEDULE[event.colorId ?? ''] ?? 'blue',
  isCompleted: event.status === 'cancelled',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  recurrence: event.recurrence?.[0] ?? null,
  // 반복 인스턴스만 채워짐 (단발성 이벤트는 undefined)
  recurringEventId: event.recurringEventId,
  // 캘린더 메타 — 아이콘/색상 구분에 사용
  calendarId: meta.calendarId,
  calendarName: meta.calendarName,
  calendarColor: meta.calendarColor,
})

/**
 * Google 이벤트 배열을 Schedule 배열로 일괄 변환한다.
 * cancelled 상태의 이벤트는 제외한다.
 */
export const googleEventsToSchedules = (
  events: ReadonlyArray<GoogleCalendarEvent>,
  meta: CalendarMeta = {}
): ReadonlyArray<Schedule> =>
  events
    .filter((event) => event.status !== 'cancelled')
    .map((event) => googleEventToSchedule(event, meta))

// ─────────────────────────────────────────────
// Schedule → Google Event 변환
// ─────────────────────────────────────────────

/**
 * 우리 Schedule/ScheduleInput을 Google Calendar 이벤트 형식으로 변환한다.
 *
 * @param input - 우리 스케줄 입력 데이터
 * @returns Google Calendar API에 보낼 이벤트 데이터
 *
 * NestJS 비유: CreateDTO → Entity 변환
 */
export const scheduleToGoogleEvent = (input: ScheduleInput): GoogleEventInput => ({
  summary: input.title,
  description: input.description ?? '',
  start: {
    dateTime: `${input.date}T${input.startTime}:00`,
    timeZone: 'Asia/Seoul',
  },
  end: {
    dateTime: `${input.date}T${input.endTime}:00`,
    timeZone: 'Asia/Seoul',
  },
  colorId: SCHEDULE_COLOR_TO_GOOGLE[input.color ?? 'blue'],
  ...(input.recurrence ? { recurrence: [input.recurrence] } : {}),
})
