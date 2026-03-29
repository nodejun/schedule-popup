import { describe, it, expect } from 'vitest'
import { scheduleInputSchema } from '@/schemas/schedule-schema'

describe('scheduleInputSchema', () => {
  const validInput = {
    title: '팀 미팅',
    date: '2026-03-06',
    startTime: '09:00',
    endTime: '10:00',
  }

  it('유효한 입력을 통과시킨다', () => {
    const result = scheduleInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('기본값이 올바르게 적용된다', () => {
    const result = scheduleInputSchema.safeParse(validInput)
    if (result.success) {
      expect(result.data.color).toBe('blue')
      expect(result.data.description).toBe('')
    }
  })

  it('빈 제목을 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('100자 초과 제목을 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      title: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('잘못된 날짜 형식을 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      date: '2026/03/06',
    })
    expect(result.success).toBe(false)
  })

  it('잘못된 시간 형식을 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      startTime: '9:00',
    })
    expect(result.success).toBe(false)
  })

  it('시작 시간이 종료 시간보다 늦으면 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      startTime: '14:00',
      endTime: '10:00',
    })
    expect(result.success).toBe(false)
  })

  it('유효한 색상을 허용한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      color: 'red',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 색상을 거부한다', () => {
    const result = scheduleInputSchema.safeParse({
      ...validInput,
      color: 'pink',
    })
    expect(result.success).toBe(false)
  })
})
