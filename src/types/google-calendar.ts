/**
 * Google Calendar API 관련 타입 정의
 *
 * Google Calendar API v3의 Event 리소스를 TypeScript 타입으로 정의한다.
 * 전체 API 스펙 중 우리가 사용하는 필드만 Pick하여 정의했다.
 *
 * @see https://developers.google.com/calendar/api/v3/reference/events
 */

// ─────────────────────────────────────────────
// Google Calendar API 응답 타입
// ─────────────────────────────────────────────

/** Google Calendar 이벤트의 시간 정보 */
export interface GoogleEventDateTime {
  /** ISO 8601 형식의 날짜+시간 (예: '2026-03-16T09:00:00+09:00') */
  readonly dateTime?: string
  /** 종일 이벤트의 날짜 (예: '2026-03-16') */
  readonly date?: string
  /** 타임존 (예: 'Asia/Seoul') */
  readonly timeZone?: string
}

/** Google Calendar 이벤트 (API 응답에서 사용하는 필드만 정의) */
export interface GoogleCalendarEvent {
  /** 이벤트 고유 ID */
  readonly id: string
  /** 이벤트 제목 */
  readonly summary: string
  /** 이벤트 설명/메모 */
  readonly description?: string
  /** 시작 시간 */
  readonly start: GoogleEventDateTime
  /** 종료 시간 */
  readonly end: GoogleEventDateTime
  /** 이벤트 상태 ('confirmed' | 'tentative' | 'cancelled') */
  readonly status: string
  /** Google Calendar 색상 ID ('1'~'11') */
  readonly colorId?: string
  /** 이벤트 위치 */
  readonly location?: string
  /** HTML 링크 (Google Calendar에서 열기) */
  readonly htmlLink?: string
  /** 반복 규칙 배열 (예: ['RRULE:FREQ=WEEKLY;BYDAY=MO']) */
  readonly recurrence?: ReadonlyArray<string>
  /** 반복 이벤트의 원본 ID */
  readonly recurringEventId?: string
}

/** Google Calendar API - Events.list 응답 */
export interface GoogleCalendarListResponse {
  /** 이벤트 배열 */
  readonly items: ReadonlyArray<GoogleCalendarEvent>
  /** 다음 페이지 토큰 (페이지네이션) */
  readonly nextPageToken?: string
  /** 동기화 토큰 (증분 동기화용) */
  readonly nextSyncToken?: string
}

// ─────────────────────────────────────────────
// Google Calendar API 요청 타입 (생성/수정용)
// ─────────────────────────────────────────────

/** Google Calendar 이벤트 생성/수정 시 보내는 데이터 */
export interface GoogleEventInput {
  /** 이벤트 제목 */
  readonly summary: string
  /** 이벤트 설명/메모 */
  readonly description?: string
  /** 시작 시간 */
  readonly start: GoogleEventDateTime
  /** 종료 시간 */
  readonly end: GoogleEventDateTime
  /** Google Calendar 색상 ID ('1'~'11') */
  readonly colorId?: string
  /** 이벤트 위치 */
  readonly location?: string
  /** 반복 규칙 배열 (예: ['RRULE:FREQ=YEARLY']) */
  readonly recurrence?: ReadonlyArray<string>
}

// ─────────────────────────────────────────────
// 캘린더 목록 타입
// ─────────────────────────────────────────────

/** Google Calendar 캘린더 정보 (calendarList.list 응답) */
export interface GoogleCalendarInfo {
  /** 캘린더 ID (이메일 형식 또는 고유 ID) */
  readonly id: string
  /** 캘린더 이름 ("개인", "회사" 등) */
  readonly summary: string
  /** 배경 색상 (hex) */
  readonly backgroundColor?: string
  /** 주 캘린더 여부 */
  readonly primary?: boolean
  /** 접근 권한 (reader, writer, owner) */
  readonly accessRole?: string
}

/** Google Calendar 캘린더 목록 응답 */
export interface GoogleCalendarListApiResponse {
  readonly items: ReadonlyArray<GoogleCalendarInfo>
}

// ─────────────────────────────────────────────
// 내부 사용 타입
// ─────────────────────────────────────────────

/** Google Calendar 인증 상태 */
export interface GoogleAuthState {
  /** 인증 완료 여부 */
  readonly isAuthenticated: boolean
  /** OAuth 액세스 토큰 */
  readonly accessToken: string | null
  /** 인증 에러 메시지 */
  readonly error: string | null
}

/** Google Calendar 동기화 설정 */
export interface GoogleCalendarSyncConfig {
  /** 동기화 활성화 여부 */
  readonly enabled: boolean
  /** 동기화할 캘린더 ID (기본: 'primary') */
  readonly calendarId: string
  /** 마지막 동기화 시각 (ISO 8601) */
  readonly lastSyncAt: string | null
  /** 동기화 토큰 (증분 동기화용) */
  readonly syncToken: string | null
}

/** Google 이벤트를 우리 Schedule로 변환할 때 필요한 출처 정보 */
export interface GoogleEventSource {
  /** 출처 표시 ('google') */
  readonly provider: 'google'
  /** 원본 Google Event ID */
  readonly googleEventId: string
  /** Google Calendar에서 열기 링크 */
  readonly htmlLink: string | null
}
