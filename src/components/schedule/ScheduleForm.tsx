/**
 * 일정 추가/수정 폼 컴포넌트
 *
 * Modal 안에서 렌더링되며, 추가 모드와 수정 모드를 지원한다.
 * editingSchedule이 null이면 추가, 있으면 수정 모드.
 * zod 스키마로 실시간 검증한다.
 */

import { useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ScheduleInput, ScheduleColor } from '@/types/schedule'
import type { Schedule } from '@/types/schedule'
import { createScheduleInputSchema } from '@/schemas/schedule-schema'
import { Button } from '../common/Button'
import { useScheduleStore } from '@/stores/schedule-store'
import { useGoogleCalendarStore } from '@/stores/google-calendar-store'
import { ColorPicker } from '../common/ColorPicker'
import { TimeInput } from '../common/TimeInput'
import { useTranslation } from '@/i18n'

interface ScheduleFormProps {
  readonly selectedDate: string
  readonly editingSchedule: Schedule | null
  readonly existingSchedules: ReadonlyArray<Schedule>
  readonly onSubmit: (input: ScheduleInput) => void
  readonly onCancel: () => void
  /** 제목 변경 시 부모에게 알림 (미리보기용) */
  readonly onTitleChange?: (title: string) => void
  /** 색상 변경 시 부모에게 알림 (미리보기용) */
  readonly onColorChange?: (color: string) => void
  /** 시간 변경 시 부모에게 알림 (미리보기용) */
  readonly onTimeChange?: (startTime: string, endTime: string) => void
}

interface FormState {
  readonly title: string
  readonly description: string
  readonly startTime: string
  readonly endTime: string
  readonly color: ScheduleColor
  readonly calendarId: string
  readonly recurrence: string | null
}

interface FormErrors {
  title?: string
  startTime?: string
  endTime?: string
  general?: string
}


const createInitialState = (
  schedule: Schedule | null,
  _selectedDate: string,
  initialTime: { startTime: string; endTime: string } | null
): FormState => ({
  title: schedule?.title ?? '',
  description: schedule?.description ?? '',
  startTime: schedule?.startTime ?? initialTime?.startTime ?? '09:00',
  endTime: schedule?.endTime ?? initialTime?.endTime ?? '10:00',
  color: schedule?.color ?? 'blue',
  calendarId: schedule?.calendarId ?? 'primary',
  recurrence: schedule?.recurrence ?? null,
})

export const ScheduleForm = ({
  selectedDate,
  editingSchedule,
  existingSchedules: _existingSchedules,
  onSubmit,
  onCancel,
  onTitleChange,
  onColorChange,
  onTimeChange,
}: ScheduleFormProps): ReactNode => {
  const t = useTranslation()
  const schema = useMemo(() => createScheduleInputSchema(), [])
  const initialFormTime = useScheduleStore((s) => s.initialFormTime)
  const { googleAuth, calendarList } = useGoogleCalendarStore()
  const [form, setForm] = useState<FormState>(() =>
    createInitialState(editingSchedule, selectedDate, initialFormTime)
  )
  const [errors, setErrors] = useState<FormErrors>({})

  const recurrenceOptions = useMemo(() => [
    { value: '', label: t.recurrence.none },
    { value: 'RRULE:FREQ=DAILY', label: t.recurrence.daily },
    { value: 'RRULE:FREQ=WEEKLY', label: t.recurrence.weekly },
    { value: 'RRULE:FREQ=MONTHLY', label: t.recurrence.monthly },
    { value: 'RRULE:FREQ=YEARLY', label: t.recurrence.yearly },
  ], [t])

  useEffect(() => {
    setForm(createInitialState(editingSchedule, selectedDate, initialFormTime))
    setErrors({})
    // initialFormTime이 바뀌면 미리보기도 갱신
    if (initialFormTime) {
      onTimeChange?.(initialFormTime.startTime, initialFormTime.endTime)
    }
  }, [editingSchedule, selectedDate, initialFormTime])

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // 입력 시 해당 필드 에러 클리어
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}

    const result = schema.safeParse({
      title: form.title,
      description: form.description || undefined,
      date: selectedDate,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
    })

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (field === 'title') newErrors.title = issue.message
        if (field === 'startTime') newErrors.startTime = issue.message
        if (field === 'endTime') newErrors.endTime = issue.message
      }
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const input: ScheduleInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      date: selectedDate,
      startTime: form.startTime,
      endTime: form.endTime,
      color: form.color,
      calendarId: form.calendarId || undefined,
      recurrence: form.recurrence || null,
    }

    try {
      await onSubmit(input)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrors({ general: t.schedule.editFailed(msg) })
    }
  }

  const isEditMode = editingSchedule !== null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title input */}
      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={form.title}
          onChange={(e) => {
            updateField('title', e.target.value)
            onTitleChange?.(e.target.value)
          }}
          placeholder={t.schedule.titlePlaceholder}
          maxLength={100}
          className={`px-1 py-2 border-0 border-b-2 text-2xl font-bold bg-transparent text-gray-900 dark:text-neutral-100 placeholder-gray-300 dark:placeholder-neutral-600 transition-all duration-200 focus:outline-none ${
            errors.title
              ? 'border-red-500'
              : 'border-gray-200 dark:border-neutral-600 focus:border-blue-500'
          }`}
          autoFocus
        />
        {errors.title && (
          <span className="text-sm text-red-500 mt-1">{errors.title}</span>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-base font-medium text-gray-700 dark:text-neutral-300">
          {t.schedule.descriptionLabel}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={t.schedule.descriptionPlaceholder}
          maxLength={500}
          rows={2}
          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-600 text-base bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
      </div>

      {/* Time */}
      <div className="flex gap-3">
        <div className="flex-1">
          <TimeInput
            label={t.schedule.startLabel}
            value={form.startTime}
            onChange={(v) => {
              updateField('startTime', v)
              // Auto-set end time to start + 1 hour
              const [hStr, mStr] = v.split(':')
              const endMinutes = Math.min((parseInt(hStr ?? '0', 10) + 1) * 60 + parseInt(mStr ?? '0', 10), 23 * 60 + 45)
              const autoEnd = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
              updateField('endTime', autoEnd)
              onTimeChange?.(v, autoEnd)
            }}
            error={errors.startTime}
          />
        </div>
        <div className="flex-1">
          <TimeInput
            label={t.schedule.endLabel}
            value={form.endTime}
            onChange={(v) => {
              updateField('endTime', v)
              onTimeChange?.(form.startTime, v)
            }}
            min={form.startTime}
            error={errors.endTime}
          />
        </div>
      </div>

      {/* General error */}
      {errors.general && (
        <div className="px-4 py-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-200 dark:ring-yellow-800">
          <span className="text-sm text-yellow-700 dark:text-yellow-400">
            {errors.general}
          </span>
        </div>
      )}

      {/* Calendar selector — shown when Google is connected */}
      {googleAuth.isAuthenticated && (
        <div className="flex flex-col gap-1.5">
          <label className="text-base font-medium text-gray-700 dark:text-neutral-300">
            {t.schedule.calendarLabel}
          </label>
          <select
            value={form.calendarId}
            onChange={(e) => updateField('calendarId', e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-600 text-base bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {calendarList.length > 0 ? (
              calendarList.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.primary
                    ? `${cal.summary} (${t.schedule.calendarDefaultBadge})`
                    : cal.summary}
                </option>
              ))
            ) : (
              <option value="primary">{t.schedule.defaultCalendar}</option>
            )}
          </select>
        </div>
      )}

      {/* Recurrence */}
      <div className="flex flex-col gap-1.5">
        <label className="text-base font-medium text-gray-700 dark:text-neutral-300">
          {t.schedule.repeatLabel}
        </label>
        <select
          value={form.recurrence ?? ''}
          onChange={(e) => updateField('recurrence', e.target.value || null)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-600 text-base bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {recurrenceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-medium text-gray-700 dark:text-neutral-300">
          {t.schedule.colorLabel}
        </label>
        <ColorPicker
          value={form.color}
          onChange={(c) => {
            updateField('color', c)
            onColorChange?.(c)
          }}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-3">
        <Button variant="ghost" type="button" size="lg" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button variant="primary" type="submit" size="lg">
          {isEditMode ? t.common.save : t.common.add}
        </Button>
      </div>
    </form>
  )
}
