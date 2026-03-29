/**
 * schedule-converter.ts 테스트
 *
 * Google Calendar Event ↔ Schedule 변환이 정확한지 검증한다.
 * 순수 함수 테스트라서 mock 없이 입력 → 출력만 확인.
 *
 * NestJS 비유: mapper/transformer 단위 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  googleEventToSchedule,
  googleEventsToSchedules,
  scheduleToGoogleEvent,
} from '@/utils/schedule-converter'
import type { GoogleCalendarEvent } from '@/types/google-calendar'

// ─────────────────────────────────────────────
// 테스트용 Google Event 데이터
// ─────────────────────────────────────────────

const createGoogleEvent = (
  overrides: Partial<GoogleCalendarEvent> = {}
): GoogleCalendarEvent => ({
  id: 'test-event-id',
  summary: '회의',
  description: '팀 미팅',
  start: { dateTime: '2026-03-16T09:00:00+09:00' },
  end: { dateTime: '2026-03-16T10:00:00+09:00' },
  status: 'confirmed',
  colorId: '9',
  htmlLink: 'https://calendar.google.com/event/test',
  ...overrides,
})

// ─────────────────────────────────────────────
// Google Event → Schedule 변환
// ─────────────────────────────────────────────

describe('googleEventToSchedule', () => {
  it('기본 필드를 올바르게 변환한다', () => {
    const event = createGoogleEvent()
    const schedule = googleEventToSchedule(event)

    expect(schedule.id).toBe('google_test-event-id')
    expect(schedule.title).toBe('회의')
    expect(schedule.description).toBe('팀 미팅')
    expect(schedule.date).toBe('2026-03-16')
    expect(schedule.startTime).toBe('09:00')
    expect(schedule.endTime).toBe('10:00')
    expect(schedule.isCompleted).toBe(false)
  })

  it('id에 google_ 접두어를 붙인다', () => {
    const event = createGoogleEvent({ id: 'abc123' })
    const schedule = googleEventToSchedule(event)

    expect(schedule.id).toBe('google_abc123')
  })

  it('colorId를 ScheduleColor로 매핑한다', () => {
    const blueEvent = createGoogleEvent({ colorId: '9' })
    expect(googleEventToSchedule(blueEvent).color).toBe('blue')

    const greenEvent = createGoogleEvent({ colorId: '2' })
    expect(googleEventToSchedule(greenEvent).color).toBe('green')

    const redEvent = createGoogleEvent({ colorId: '11' })
    expect(googleEventToSchedule(redEvent).color).toBe('red')
  })

  it('colorId가 없으면 기본값 blue를 사용한다', () => {
    const event = createGoogleEvent({ colorId: undefined })
    expect(googleEventToSchedule(event).color).toBe('blue')
  })

  it('제목이 없으면 "(제목 없음)"을 사용한다', () => {
    const event = createGoogleEvent({ summary: '' })
    expect(googleEventToSchedule(event).title).toBe('(제목 없음)')
  })

  it('cancelled 이벤트는 isCompleted가 true이다', () => {
    const event = createGoogleEvent({ status: 'cancelled' })
    expect(googleEventToSchedule(event).isCompleted).toBe(true)
  })

  it('종일 이벤트 (date만 있고 dateTime 없음)를 처리한다', () => {
    const event = createGoogleEvent({
      start: { date: '2026-03-16' },
      end: { date: '2026-03-17' },
    })
    const schedule = googleEventToSchedule(event)

    expect(schedule.date).toBe('2026-03-16')
    expect(schedule.startTime).toBe('00:00')
    expect(schedule.endTime).toBe('00:00')
  })

  it('description이 없으면 빈 문자열을 사용한다', () => {
    const event = createGoogleEvent({ description: undefined })
    expect(googleEventToSchedule(event).description).toBe('')
  })
})

// ─────────────────────────────────────────────
// Google Events 배열 → Schedules 배열
// ─────────────────────────────────────────────

describe('googleEventsToSchedules', () => {
  it('여러 이벤트를 변환한다', () => {
    const events = [
      createGoogleEvent({ id: '1', summary: '회의' }),
      createGoogleEvent({ id: '2', summary: '점심' }),
    ]
    const schedules = googleEventsToSchedules(events)

    expect(schedules).toHaveLength(2)
    expect(schedules[0]?.title).toBe('회의')
    expect(schedules[1]?.title).toBe('점심')
  })

  it('cancelled 이벤트를 제외한다', () => {
    const events = [
      createGoogleEvent({ id: '1', status: 'confirmed' }),
      createGoogleEvent({ id: '2', status: 'cancelled' }),
      createGoogleEvent({ id: '3', status: 'confirmed' }),
    ]
    const schedules = googleEventsToSchedules(events)

    expect(schedules).toHaveLength(2)
  })

  it('빈 배열을 처리한다', () => {
    const schedules = googleEventsToSchedules([])
    expect(schedules).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// Schedule → Google Event 변환
// ─────────────────────────────────────────────

describe('scheduleToGoogleEvent', () => {
  it('기본 필드를 올바르게 변환한다', () => {
    const input = {
      title: '회의',
      description: '팀 미팅',
      date: '2026-03-16',
      startTime: '09:00',
      endTime: '10:00',
      color: 'blue' as const,
    }
    const event = scheduleToGoogleEvent(input)

    expect(event.summary).toBe('회의')
    expect(event.description).toBe('팀 미팅')
    expect(event.start.dateTime).toBe('2026-03-16T09:00:00')
    expect(event.end.dateTime).toBe('2026-03-16T10:00:00')
    expect(event.start.timeZone).toBe('Asia/Seoul')
    expect(event.end.timeZone).toBe('Asia/Seoul')
  })

  it('color를 Google colorId로 매핑한다', () => {
    const blueEvent = scheduleToGoogleEvent({
      title: '테스트', date: '2026-03-16',
      startTime: '09:00', endTime: '10:00', color: 'blue',
    })
    expect(blueEvent.colorId).toBe('9')

    const redEvent = scheduleToGoogleEvent({
      title: '테스트', date: '2026-03-16',
      startTime: '09:00', endTime: '10:00', color: 'red',
    })
    expect(redEvent.colorId).toBe('11')
  })

  it('color가 없으면 기본값 blue(9)를 사용한다', () => {
    const event = scheduleToGoogleEvent({
      title: '테스트', date: '2026-03-16',
      startTime: '09:00', endTime: '10:00',
    })
    expect(event.colorId).toBe('9')
  })

  it('description이 없으면 빈 문자열을 사용한다', () => {
    const event = scheduleToGoogleEvent({
      title: '테스트', date: '2026-03-16',
      startTime: '09:00', endTime: '10:00',
    })
    expect(event.description).toBe('')
  })
})
