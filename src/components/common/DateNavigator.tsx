/**
 * 날짜 네비게이터 컴포넌트
 *
 * ← 오늘 → 형태로 날짜를 이동할 수 있는 헤더.
 * "오늘" 버튼을 누르면 현재 날짜로 돌아온다.
 */

import type { ReactNode } from 'react'
import { addDays, formatDateDisplay, isToday } from '@/utils/date-utils'
import { Button } from './Button'
import { useTranslation } from '@/i18n'

interface DateNavigatorProps {
  readonly selectedDate: string
  readonly onDateChange: (date: string) => void
}

export const DateNavigator = ({
  selectedDate,
  onDateChange,
}: DateNavigatorProps): ReactNode => {
  const t = useTranslation()
  const handlePrev = () => onDateChange(addDays(selectedDate, -1))
  const handleNext = () => onDateChange(addDays(selectedDate, 1))
  const handleToday = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    onDateChange(`${yyyy}-${mm}-${dd}`)
  }

  const isTodaySelected = isToday(selectedDate)

  return (
    <div className="flex items-center justify-between py-3">
      {/* 이전 날짜 */}
      <Button variant="ghost" size="sm" onClick={handlePrev} aria-label={t.aria.prevDate}>
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </Button>

      {/* 날짜 표시 + 오늘 버튼 */}
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {formatDateDisplay(selectedDate)}
        </span>
        {!isTodaySelected && (
          <Button variant="ghost" size="sm" onClick={handleToday}>
            {t.common.today}
          </Button>
        )}
      </div>

      {/* 다음 날짜 */}
      <Button variant="ghost" size="sm" onClick={handleNext} aria-label={t.aria.nextDate}>
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Button>
    </div>
  )
}
