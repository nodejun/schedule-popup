import { z } from 'zod'

export const settingsSchema = z
  .object({
    timelineStartHour: z.number().int().min(0).max(23),
    timelineEndHour: z.number().int().min(1).max(24),
    defaultView: z.enum(['day', 'week']),
    theme: z.enum(['auto', 'light', 'dark']),
    showCompletedSchedules: z.boolean(),
    reminderMinutesBefore: z.number().int().min(0).max(60),
  })
  .refine((data) => data.timelineStartHour < data.timelineEndHour, {
    message: '시작 시간이 종료 시간보다 빨라야 합니다',
    path: ['timelineEndHour'],
  })

export type ValidatedSettings = z.infer<typeof settingsSchema>
