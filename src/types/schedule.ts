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
