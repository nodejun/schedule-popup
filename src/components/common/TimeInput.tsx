/**
 * 시간 입력 컴포넌트
 *
 * HH:MM 형식의 시간을 입력받는다.
 * 네이티브 time input을 사용하여 모바일/데스크톱 모두 호환.
 */

import type { ReactNode } from 'react'

interface TimeInputProps {
  readonly label: string
  readonly value: string
  readonly onChange: (time: string) => void
  readonly min?: string
  readonly max?: string
  readonly error?: string
}

export const TimeInput = ({
  label,
  value,
  onChange,
  min,
  max,
  error,
}: TimeInputProps): ReactNode => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={`px-3 py-2 rounded-md border text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-neutral-300 dark:border-neutral-600 focus:ring-blue-500'
        } focus:outline-none focus:ring-2 focus:ring-offset-0`}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}
