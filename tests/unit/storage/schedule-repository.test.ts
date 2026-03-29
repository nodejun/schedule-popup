import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSchedulesByDate,
  addSchedule,
  updateSchedule,
  deleteSchedule,
  toggleComplete,
} from '@/storage/schedule-repository'

describe('schedule-repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSchedulesByDate', () => {
    it('일정이 없으면 빈 배열을 반환한다', async () => {
      const result = await getSchedulesByDate('2026-03-06')
      expect(result).toEqual([])
    })
  })

  describe('addSchedule', () => {
    it('유효한 일정을 추가한다', async () => {
      const schedule = await addSchedule({
        title: '팀 미팅',
        date: '2026-03-06',
        startTime: '09:00',
        endTime: '10:00',
      })

      expect(schedule.title).toBe('팀 미팅')
      expect(schedule.color).toBe('blue')
      expect(schedule.isCompleted).toBe(false)
      expect(schedule.id).toBeDefined()
    })

    it('잘못된 입력을 거부한다', async () => {
      await expect(
        addSchedule({
          title: '',
          date: '2026-03-06',
          startTime: '09:00',
          endTime: '10:00',
        })
      ).rejects.toThrow()
    })

    it('추가된 일정을 조회할 수 있다', async () => {
      await addSchedule({
        title: '팀 미팅',
        date: '2026-03-06',
        startTime: '09:00',
        endTime: '10:00',
      })

      const schedules = await getSchedulesByDate('2026-03-06')
      expect(schedules).toHaveLength(1)
      expect(schedules[0]?.title).toBe('팀 미팅')
    })
  })

  describe('updateSchedule', () => {
    it('일정을 부분 업데이트한다', async () => {
      const created = await addSchedule({
        title: '팀 미팅',
        date: '2026-03-06',
        startTime: '09:00',
        endTime: '10:00',
      })

      const updated = await updateSchedule('2026-03-06', created.id, {
        title: '수정된 미팅',
      })

      expect(updated.title).toBe('수정된 미팅')
      expect(updated.startTime).toBe('09:00')
    })

    it('존재하지 않는 일정 업데이트 시 에러를 던진다', async () => {
      await expect(
        updateSchedule('2026-03-06', 'nonexistent', { title: '테스트' })
      ).rejects.toThrow('Schedule not found')
    })
  })

  describe('deleteSchedule', () => {
    it('일정을 삭제한다', async () => {
      const created = await addSchedule({
        title: '삭제할 일정',
        date: '2026-03-06',
        startTime: '09:00',
        endTime: '10:00',
      })

      await deleteSchedule('2026-03-06', created.id)

      const schedules = await getSchedulesByDate('2026-03-06')
      expect(schedules).toHaveLength(0)
    })
  })

  describe('toggleComplete', () => {
    it('완료 상태를 토글한다', async () => {
      const created = await addSchedule({
        title: '완료 테스트',
        date: '2026-03-06',
        startTime: '09:00',
        endTime: '10:00',
      })

      expect(created.isCompleted).toBe(false)

      const toggled = await toggleComplete('2026-03-06', created.id)
      expect(toggled.isCompleted).toBe(true)

      const toggledBack = await toggleComplete('2026-03-06', created.id)
      expect(toggledBack.isCompleted).toBe(false)
    })
  })
})
