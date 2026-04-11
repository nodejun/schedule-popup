export interface Settings {
  readonly timelineStartHour: number
  readonly timelineEndHour: number
  readonly defaultView: 'day' | 'week'
  readonly theme: 'auto' | 'light' | 'dark'
  readonly showCompletedSchedules: boolean
  readonly reminderMinutesBefore: number
  /** UI 언어 설정. 'auto'면 브라우저/Chrome 언어 자동 감지 */
  readonly language: 'auto' | 'ko' | 'en'
}

export const DEFAULT_SETTINGS: Settings = {
  timelineStartHour: 0,
  timelineEndHour: 24,
  defaultView: 'day',
  theme: 'auto',
  showCompletedSchedules: true,
  reminderMinutesBefore: 10,
  language: 'auto',
} as const
