/**
 * 스케줄 데이터 접근 계층
 * 모든 함수는 immutable — 새 객체를 반환하며 기존 데이터를 변이시키지 않음
 * Storage 키 전략: `schedules:YYYY-MM-DD` (날짜별 분할)
 */

import type { Schedule, ScheduleInput } from '@/types/schedule'
import { scheduleInputSchema } from '@/schemas/schedule-schema'
import { storageGet, storageSet, storageRemove, storageGetMultiple } from './chrome-storage'
import { generateId } from '@/utils/id-generator'

const STORAGE_KEY_PREFIX = 'schedules'

const buildKey = (date: string): string => `${STORAGE_KEY_PREFIX}:${date}`

export const getSchedulesByDate = async (
  date: string
): Promise<ReadonlyArray<Schedule>> => {
  const schedules = await storageGet<Schedule[]>(buildKey(date))
  return schedules ?? []
}

/**
 * 여러 날짜의 스케줄을 한번에 조회
 * chrome.storage.sync.get([keys])로 단일 API 호출로 배치 처리
 * @param dates YYYY-MM-DD 형식 날짜 배열
 * @returns 날짜 → 스케줄 배열 맵
 */
export const getSchedulesByDateRange = async (
  dates: ReadonlyArray<string>
): Promise<Readonly<Record<string, ReadonlyArray<Schedule>>>> => {
  if (dates.length === 0) {
    return {}
  }

  const keys = dates.map(buildKey)
  const raw = await storageGetMultiple<Schedule[]>(keys)

  const result: Record<string, ReadonlyArray<Schedule>> = {}
  for (const date of dates) {
    const key = buildKey(date)
    result[date] = raw[key] ?? []
  }

  return result
}

export const addSchedule = async (
  input: ScheduleInput
): Promise<Schedule> => {
  const validated = scheduleInputSchema.parse(input)
  const now = new Date().toISOString()

  const newSchedule: Schedule = {
    id: generateId(),
    title: validated.title,
    description: validated.description ?? '',
    date: validated.date,
    startTime: validated.startTime,
    endTime: validated.endTime,
    color: validated.color ?? 'blue',
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  }

  const existing = await getSchedulesByDate(validated.date)
  const updated = [...existing, newSchedule]
  await storageSet(buildKey(validated.date), updated)

  return newSchedule
}

export const updateSchedule = async (
  date: string,
  id: string,
  patch: Partial<ScheduleInput>
): Promise<Schedule> => {
  const existing = await getSchedulesByDate(date)
  const index = existing.findIndex((s) => s.id === id)

  if (index === -1) {
    throw new Error(`Schedule not found: ${id}`)
  }

  const current = existing[index]
  if (!current) {
    throw new Error(`Schedule not found: ${id}`)
  }

  const updatedSchedule: Schedule = {
    ...current,
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.startTime !== undefined && { startTime: patch.startTime }),
    ...(patch.endTime !== undefined && { endTime: patch.endTime }),
    ...(patch.color !== undefined && { color: patch.color }),
    updatedAt: new Date().toISOString(),
  }

  const updated = existing.map((s) => (s.id === id ? updatedSchedule : s))
  await storageSet(buildKey(date), updated)

  return updatedSchedule
}

export const deleteSchedule = async (
  date: string,
  id: string
): Promise<void> => {
  const existing = await getSchedulesByDate(date)
  const filtered = existing.filter((s) => s.id !== id)

  if (filtered.length === 0) {
    await storageRemove(buildKey(date))
  } else {
    await storageSet(buildKey(date), filtered)
  }
}

export const toggleComplete = async (
  date: string,
  id: string
): Promise<Schedule> => {
  const existing = await getSchedulesByDate(date)
  const target = existing.find((s) => s.id === id)

  if (!target) {
    throw new Error(`Schedule not found: ${id}`)
  }

  const toggled: Schedule = {
    ...target,
    isCompleted: !target.isCompleted,
    updatedAt: new Date().toISOString(),
  }

  const updated = existing.map((s) => (s.id === id ? toggled : s))
  await storageSet(buildKey(date), updated)

  return toggled
}
