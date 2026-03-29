/**
 * 미니 위젯 컴포넌트
 *
 * YouTube 홈 피드의 Shorts 선반을 대체하는 컴팩트 위젯.
 * 주간 캘린더로 이번 주 일정을 한눈에 보여준다.
 */

import type { ReactNode } from 'react'
import { WeeklyCalendar } from '../calendar/WeeklyCalendar'

interface MiniWidgetProps {
  /** "일정 관리" 버튼 클릭 시 콜백 (인라인 스케줄러 열기) */
  readonly onOpenScheduler?: (date?: string) => void
}

export const MiniWidget = ({ onOpenScheduler }: MiniWidgetProps): ReactNode => {
  return <WeeklyCalendar onOpenScheduler={onOpenScheduler} />
}
