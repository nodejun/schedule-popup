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
}

export interface ScheduleInput {
  readonly title: string
  readonly description?: string
  readonly date: string
  readonly startTime: string
  readonly endTime: string
  readonly color?: ScheduleColor
}

export interface DaySchedules {
  readonly date: string
  readonly schedules: ReadonlyArray<Schedule>
}
