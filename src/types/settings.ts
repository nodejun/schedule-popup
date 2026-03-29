export interface Settings {
  readonly timelineStartHour: number
  readonly timelineEndHour: number
  readonly defaultView: 'day' | 'week'
  readonly theme: 'auto' | 'light' | 'dark'
  readonly showCompletedSchedules: boolean
  readonly reminderMinutesBefore: number
}

export const DEFAULT_SETTINGS: Settings = {
  timelineStartHour: 6,
  timelineEndHour: 24,
  defaultView: 'day',
  theme: 'auto',
  showCompletedSchedules: true,
  reminderMinutesBefore: 10,
} as const
