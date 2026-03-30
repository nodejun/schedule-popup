/**
 * 일정 추가/수정 폼 컴포넌트
 *
 * Modal 안에서 렌더링되며, 추가 모드와 수정 모드를 지원한다.
 * editingSchedule이 null이면 추가, 있으면 수정 모드.
 * zod 스키마로 실시간 검증한다.
 */

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ScheduleInput, ScheduleColor } from '@/types/schedule'
import type { Schedule } from '@/types/schedule'
import { scheduleInputSchema } from '@/schemas/schedule-schema'
import { isTimeOverlap } from '@/utils/date-utils'
import { Button } from '../common/Button'
import { useScheduleStore } from '@/stores/schedule-store'
import { ColorPicker } from '../common/ColorPicker'
import { TimeInput } from '../common/TimeInput'

interface ScheduleFormProps {
  readonly selectedDate: string
  readonly editingSchedule: Schedule | null
  readonly existingSchedules: ReadonlyArray<Schedule>
  readonly onSubmit: (input: ScheduleInput) => void
  readonly onCancel: () => void
}

interface FormState {
  readonly title: string
  readonly description: string
  readonly startTime: string
  readonly endTime: string
  readonly color: ScheduleColor
}

interface FormErrors {
  title?: string
  startTime?: string
  endTime?: string
  overlap?: string
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
})

export const ScheduleForm = ({
  selectedDate,
  editingSchedule,
  existingSchedules,
  onSubmit,
  onCancel,
}: ScheduleFormProps): ReactNode => {
  const initialFormTime = useScheduleStore((s) => s.initialFormTime)
  const [form, setForm] = useState<FormState>(() =>
    createInitialState(editingSchedule, selectedDate, initialFormTime)
  )
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setForm(createInitialState(editingSchedule, selectedDate, initialFormTime))
    setErrors({})
  }, [editingSchedule, selectedDate])

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // 입력 시 해당 필드 에러 클리어
    setErrors((prev) => ({ ...prev, [field]: undefined, overlap: undefined }))
  }

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {}

    // zod 검증
    const result = scheduleInputSchema.safeParse({
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
        if (field === 'title') {
          newErrors.title = issue.message
        }
        if (field === 'startTime') {
          newErrors.startTime = issue.message
        }
        if (field === 'endTime') {
          newErrors.endTime = issue.message
        }
      }
    }

    // 시간 겹침 검사 (수정 중인 스케줄은 제외)
    const othersSchedules = editingSchedule
      ? existingSchedules.filter((s) => s.id !== editingSchedule.id)
      : existingSchedules

    const hasOverlap = othersSchedules.some((s) =>
      isTimeOverlap(
        { startTime: form.startTime, endTime: form.endTime },
        { startTime: s.startTime, endTime: s.endTime }
      )
    )

    if (hasOverlap) {
      newErrors.overlap = '다른 일정과 시간이 겹칩니다'
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
    }

    try {
      await onSubmit(input)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrors({ overlap: `수정 실패: ${msg}` })
    }
  }

  const isEditMode = editingSchedule !== null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 제목 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          제목
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="일정 제목을 입력하세요"
          maxLength={100}
          className={`px-3 py-2 rounded-md border text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors ${
            errors.title
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-300 dark:border-neutral-600 focus:ring-blue-500'
          } focus:outline-none focus:ring-2`}
          autoFocus
        />
        {errors.title && (
          <span className="text-xs text-red-500">{errors.title}</span>
        )}
      </div>

      {/* 설명 */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          설명 (선택)
        </label>
        <textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="메모를 남겨보세요"
          maxLength={500}
          rows={2}
          className="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 시간 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <TimeInput
            label="시작"
            value={form.startTime}
            onChange={(t) => updateField('startTime', t)}
            error={errors.startTime}
          />
        </div>
        <div className="flex-1">
          <TimeInput
            label="종료"
            value={form.endTime}
            onChange={(t) => updateField('endTime', t)}
            min={form.startTime}
            error={errors.endTime}
          />
        </div>
      </div>

      {/* 시간 겹침 경고 */}
      {errors.overlap && (
        <div className="px-3 py-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <span className="text-xs text-yellow-700 dark:text-yellow-400">
            {errors.overlap}
          </span>
        </div>
      )}

      {/* 색상 */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          색상
        </label>
        <ColorPicker
          value={form.color}
          onChange={(c) => updateField('color', c)}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          취소
        </Button>
        <Button variant="primary" type="submit">
          {isEditMode ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
