/**
 * 월간 네비게이터 (Google Calendar 스타일)
 *
 * [오늘] < > 2026년 3월   형태의 깔끔한 헤더
 * YouTube 레드 테마 적용
 */

import { formatMonthDisplay, getCurrentMonth } from '@/utils/calendar-utils'
import { useTranslation } from '@/i18n'

interface MonthNavigatorProps {
  readonly currentMonth: string
  readonly onMonthChange: (yearMonth: string) => void
}

const ChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M12.5 15L7.5 10L12.5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M7.5 15L12.5 10L7.5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const MonthNavigator = ({
  currentMonth,
  onMonthChange,
}: MonthNavigatorProps) => {
  const t = useTranslation()
  const isCurrentMonth = currentMonth === getCurrentMonth()

  const handlePrev = () => {
    const [yearStr, monthStr] = currentMonth.split('-')
    const year = parseInt(yearStr ?? '2026', 10)
    const month = parseInt(monthStr ?? '1', 10)
    const date = new Date(year, month - 2, 1)
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onMonthChange(newMonth)
  }

  const handleNext = () => {
    const [yearStr, monthStr] = currentMonth.split('-')
    const year = parseInt(yearStr ?? '2026', 10)
    const month = parseInt(monthStr ?? '1', 10)
    const date = new Date(year, month, 1)
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onMonthChange(newMonth)
  }

  const handleToday = () => {
    onMonthChange(getCurrentMonth())
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* 오늘 버튼 */}
      <button
        type="button"
        onClick={handleToday}
        disabled={isCurrentMonth}
        className={`text-sm font-medium transition-all ${
          isCurrentMonth
            ? 'text-neutral-300 cursor-default dark:text-neutral-600'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 active:bg-neutral-200/60 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800/60'
        }`}
        style={{ padding: '6px 16px', borderRadius: '10px', border: '1.5px solid', borderColor: isCurrentMonth ? '#e5e5e5' : '#d4d4d4' }}
      >
        {t.common.today}
      </button>

      {/* < > 네비게이션 */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrev}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:bg-neutral-800/60 transition-all"
          aria-label={t.aria.prevMonth}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-2 rounded-xl text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/80 dark:text-neutral-400 dark:hover:bg-neutral-800/60 transition-all"
          aria-label={t.aria.nextMonth}
        >
          <ChevronRight />
        </button>
      </div>

      {/* 년월 표시 */}
      <h2
        className="text-neutral-800 dark:text-neutral-100"
        style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}
      >
        {formatMonthDisplay(currentMonth)}
      </h2>
    </div>
  )
}
