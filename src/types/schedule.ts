export const SCHEDULE_COLORS = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
] as const

export type ScheduleColor = (typeof SCHEDULE_COLORS)[number]

export interface Schedule {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly date: string
  readonly startTime: string
  readonly endTime: string
  readonly color: ScheduleColor
  readonly isCompleted: boolean
  readonly createdAt: string
  readonly updatedAt: string
  /** Google 캘린더 ID (어떤 캘린더에 속하는지) */
  readonly calendarId?: string
  /** 캘린더 이름 ("개인", "회사" 등) */
  readonly calendarName?: string
  /** 캘린더 배경색 (hex) */
  readonly calendarColor?: string
  /** 반복 규칙 (RRULE 문자열, null이면 단일 일정) */
  readonly recurrence?: string | null
  /**
   * 반복 일정의 부모 이벤트 ID (Google 원본 ID, 'google_' 접두사 없음)
   *
   * - 단일 일정: undefined
   * - 반복 일정의 인스턴스: 부모 이벤트의 Google ID
   *
   * 시리즈 전체 삭제 또는 "이 일정과 향후 삭제"(UNTIL 추가) 시
   * 부모를 찾아가기 위해 사용한다.
   */
  readonly recurringEventId?: string
}

export interface ScheduleInput {
  readonly title: string
  readonly description?: string
  readonly date: string
  readonly startTime: string
  readonly endTime: string
  readonly color?: ScheduleColor
  /** 저장할 Google 캘린더 ID (미지정이면 primary) */
  readonly calendarId?: string
  /** 반복 규칙 (RRULE 문자열) */
  readonly recurrence?: string | null
}

export interface DaySchedules {
  readonly date: string
  readonly schedules: ReadonlyArray<Schedule>
}
