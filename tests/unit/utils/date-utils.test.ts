import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatTime,
  getTimeSlots,
  timeToMinutes,
  isTimeOverlap,
  sortByStartTime,
  addDays,
  getDayOfWeek,
  getTimeDurationMinutes,
  formatDateDisplay,
} from '@/utils/date-utils'
import type { Schedule } from '@/types/schedule'

const makeSchedule = (
  startTime: string,
  endTime: string
): Pick<Schedule, 'startTime' | 'endTime'> => ({
  startTime,
  endTime,
})

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
    const date = new Date(2026, 2, 6) // 2026-03-06
    expect(formatDate(date)).toBe('2026-03-06')
  })

  it('한 자리 월/일을 0으로 패딩한다', () => {
    const date = new Date(2026, 0, 5) // 2026-01-05
    expect(formatDate(date)).toBe('2026-01-05')
  })
})

describe('formatTime', () => {
  it('시간을 HH:mm 형식으로 변환한다', () => {
    const date = new Date(2026, 0, 1, 9, 30)
    expect(formatTime(date)).toBe('09:30')
  })
})

describe('getTimeSlots', () => {
  it('시간 슬롯 목록을 생성한다', () => {
    const slots = getTimeSlots(9, 12)
    expect(slots).toEqual(['09:00', '10:00', '11:00'])
  })

  it('빈 범위에 대해 빈 배열을 반환한다', () => {
    const slots = getTimeSlots(9, 9)
    expect(slots).toEqual([])
  })
})

describe('timeToMinutes', () => {
  it('시간을 분으로 변환한다', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('isTimeOverlap', () => {
  it('겹치는 일정을 감지한다', () => {
    expect(
      isTimeOverlap(makeSchedule('09:00', '10:00'), makeSchedule('09:30', '11:00'))
    ).toBe(true)
  })

  it('겹치지 않는 일정을 올바르게 판단한다', () => {
    expect(
      isTimeOverlap(makeSchedule('09:00', '10:00'), makeSchedule('10:00', '11:00'))
    ).toBe(false)
  })

  it('포함 관계를 감지한다', () => {
    expect(
      isTimeOverlap(makeSchedule('09:00', '12:00'), makeSchedule('10:00', '11:00'))
    ).toBe(true)
  })
})

describe('sortByStartTime', () => {
  it('시작 시간 기준으로 정렬한다', () => {
    const schedules = [
      { startTime: '14:00' },
      { startTime: '09:00' },
      { startTime: '11:00' },
    ] as Schedule[]

    const sorted = sortByStartTime(schedules)
    expect(sorted[0]?.startTime).toBe('09:00')
    expect(sorted[1]?.startTime).toBe('11:00')
    expect(sorted[2]?.startTime).toBe('14:00')
  })

  it('원본 배열을 변이시키지 않는다', () => {
    const original = [
      { startTime: '14:00' },
      { startTime: '09:00' },
    ] as Schedule[]

    sortByStartTime(original)
    expect(original[0]?.startTime).toBe('14:00')
  })
})

describe('addDays', () => {
  it('날짜에 일수를 더한다', () => {
    expect(addDays('2026-03-06', 1)).toBe('2026-03-07')
    expect(addDays('2026-03-06', -1)).toBe('2026-03-05')
  })

  it('월 경계를 올바르게 처리한다', () => {
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01')
  })
})

describe('getDayOfWeek', () => {
  it('요일을 올바르게 반환한다', () => {
    expect(getDayOfWeek('2026-03-06')).toBe('금')
  })
})

describe('formatDateDisplay', () => {
  it('표시용 날짜 문자열을 반환한다', () => {
    expect(formatDateDisplay('2026-03-06')).toBe('3월 6일 (금)')
  })
})

describe('getTimeDurationMinutes', () => {
  it('시간 차이를 분으로 계산한다', () => {
    expect(getTimeDurationMinutes('09:00', '10:30')).toBe(90)
  })
})
