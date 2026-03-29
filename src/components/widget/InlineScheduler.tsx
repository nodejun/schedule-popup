/**
 * 인라인 스케줄러 위젯
 *
 * YouTube 콘텐츠 영역에 삽입되는 월간 캘린더.
 * 기존 OverlayScheduler와 달리 사이드바가 유지된다.
 */

import type { ReactNode } from 'react'
import { MonthlyCalendar } from '../calendar/MonthlyCalendar'

interface InlineSchedulerProps {
  readonly onClose: () => void
}

export const InlineScheduler = ({ onClose }: InlineSchedulerProps): ReactNode => {
  return <MonthlyCalendar onClose={onClose} />
}
