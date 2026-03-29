/**
 * 6색 컬러 선택기
 *
 * 스케줄 색상을 선택하는 컴포넌트.
 * SCHEDULE_COLORS 배열의 6가지 색상 중 하나를 선택한다.
 */

import type { ReactNode } from 'react'
import { SCHEDULE_COLORS } from '@/types/schedule'
import type { ScheduleColor } from '@/types/schedule'

interface ColorPickerProps {
  readonly value: ScheduleColor
  readonly onChange: (color: ScheduleColor) => void
}

const colorMap: Record<ScheduleColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export const ColorPicker = ({
  value,
  onChange,
}: ColorPickerProps): ReactNode => {
  return (
    <div className="flex gap-2">
      {SCHEDULE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`w-7 h-7 rounded-full transition-all duration-150 cursor-pointer ${colorMap[color]} ${
            value === color
              ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-neutral-800 scale-110'
              : 'hover:scale-105'
          }`}
          aria-label={color}
        />
      ))}
    </div>
  )
}
