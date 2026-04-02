import { z } from 'zod'
import { SCHEDULE_COLORS } from '@/types/schedule'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/

const timeSchema = z.string().regex(TIME_REGEX, 'HH:mm 형식이어야 합니다')
const dateSchema = z.string().regex(DATE_REGEX, 'YYYY-MM-DD 형식이어야 합니다')

export const scheduleInputSchema = z
  .object({
    title: z
      .string()
      .min(1, '제목은 필수입니다')
      .max(100, '제목은 100자 이내여야 합니다'),
    description: z
      .string()
      .max(500, '설명은 500자 이내여야 합니다')
      .optional()
      .default(''),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    color: z.enum(SCHEDULE_COLORS).optional().default('blue'),
    calendarId: z.string().optional(),
    recurrence: z.string().nullable().optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: '시작 시간이 종료 시간보다 빨라야 합니다',
    path: ['endTime'],
  })

export const scheduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  color: z.enum(SCHEDULE_COLORS),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ValidatedScheduleInput = z.infer<typeof scheduleInputSchema>
export type ValidatedSchedule = z.infer<typeof scheduleSchema>
