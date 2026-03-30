/**
 * 날짜/시간 순수 함수 유틸리티
 * 외부 라이브러리 없이 네이티브 API만 사용
 */

import type { Schedule } from '@/types/schedule'

export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const getToday = (): string => formatDate(new Date())

export const getTimeSlots = (
  startHour: number,
  endHour: number
): ReadonlyArray<string> => {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
  }
  return slots
}

export const parseTime = (time: string): { hours: number; minutes: number } => {
  const [hoursStr, minutesStr] = time.split(':')
  return {
    hours: parseInt(hoursStr ?? '0', 10),
    minutes: parseInt(minutesStr ?? '0', 10),
  }
}

export const timeToMinutes = (time: string): number => {
  const { hours, minutes } = parseTime(time)
  return hours * 60 + minutes
}

export const isTimeOverlap = (
  a: Pick<Schedule, 'startTime' | 'endTime'>,
  b: Pick<Schedule, 'startTime' | 'endTime'>
): boolean => {
  const aStart = timeToMinutes(a.startTime)
  const aEnd = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd = timeToMinutes(b.endTime)
  return aStart < bEnd && bStart < aEnd
}

export const sortByStartTime = (
  schedules: ReadonlyArray<Schedule>
): ReadonlyArray<Schedule> =>
  [...schedules].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  )

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export const getDayOfWeek = (dateStr: string): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const date = new Date(dateStr)
  return days[date.getDay()] ?? ''
}

export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = getDayOfWeek(dateStr)
  return `${month}월 ${day}일 (${dayOfWeek})`
}

export const getTimeDurationMinutes = (
  startTime: string,
  endTime: string
): number => timeToMinutes(endTime) - timeToMinutes(startTime)

export const isToday = (dateStr: string): boolean => dateStr === getToday()

/**
 * 분(숫자)을 "HH:mm" 문자열로 변환한다.
 * timeToMinutes의 역함수.
 *
 * @example
 * minutesToTimeString(540)  // → '09:00'
 * minutesToTimeString(630)  // → '10:30'
 * minutesToTimeString(1080) // → '18:00'
 */
export const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
