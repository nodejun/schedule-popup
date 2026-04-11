import { z } from 'zod'
import { SCHEDULE_COLORS } from '@/types/schedule'
import { getTranslations } from '@/i18n'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/

/**
 * Locale-aware schedule input schema factory.
 * Call once per form render (via useMemo) so messages reflect the active locale.
 */
export const createScheduleInputSchema = () => {
  const t = getTranslations()
  const timeSchema = z.string().regex(TIME_REGEX, t.validation.timeFormat)
  const dateSchema = z.string().regex(DATE_REGEX, t.validation.dateFormat)

  return z
    .object({
      title: z
        .string()
        .min(1, t.validation.titleRequired)
        .max(100, t.validation.titleMaxLength),
      description: z
        .string()
        .max(500, t.validation.descriptionMaxLength)
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
      message: t.validation.startBeforeEnd,
      path: ['endTime'],
    })
}

/** Legacy static export — uses the active locale at import time (English by default). */
export const scheduleInputSchema = createScheduleInputSchema()

// Plain regex schemas without user-facing messages — used for storage validation only
const _timeSchema = z.string().regex(TIME_REGEX)
const _dateSchema = z.string().regex(DATE_REGEX)

export const scheduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  date: _dateSchema,
  startTime: _timeSchema,
  endTime: _timeSchema,
  color: z.enum(SCHEDULE_COLORS),
  isCompleted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ValidatedScheduleInput = z.infer<typeof scheduleInputSchema>
export type ValidatedSchedule = z.infer<typeof scheduleSchema>
