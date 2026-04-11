/**
 * 캘린더 날짜 계산 유틸리티
 * 주간/월간 뷰에 필요한 날짜 배열 생성 함수
 */

import { formatDate, addDays } from './date-utils'
import { getTranslations } from '@/i18n'

/** 월요일 기준 요일 인덱스 (0=월, 6=일) */
const getMondayBasedDay = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 6 : day - 1
}

/**
 * 주어진 날짜가 속한 주의 월~일 날짜 배열 반환
 * @param dateStr YYYY-MM-DD
 * @returns 7개 날짜 문자열 배열 [월, 화, 수, 목, 금, 토, 일]
 */
export const getWeekDates = (dateStr: string): ReadonlyArray<string> => {
  const date = new Date(dateStr)
  const mondayOffset = getMondayBasedDay(date)
  const monday = addDays(dateStr, -mondayOffset)

  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/**
 * 주어진 날짜가 속한 주의 월요일 날짜 반환
 */
export const getWeekStart = (dateStr: string): string => {
  const date = new Date(dateStr)
  const mondayOffset = getMondayBasedDay(date)
  return addDays(dateStr, -mondayOffset)
}

/**
 * 월간 캘린더 그리드 날짜 생성
 * 5~6주 × 7일 2차원 배열 반환 (이전/다음 달 날짜 포함)
 * @param yearMonth YYYY-MM 형식
 * @returns string[][] (5~6행 × 7열)
 */
export const getMonthGridDates = (yearMonth: string): ReadonlyArray<ReadonlyArray<string>> => {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr ?? '2026', 10)
  const month = parseInt(monthStr ?? '1', 10)

  const firstDay = new Date(year, month - 1, 1)
  const firstDayMondayBased = getMondayBasedDay(firstDay)

  const gridStart = addDays(formatDate(firstDay), -firstDayMondayBased)

  const lastDay = new Date(year, month, 0)
  const lastDayMondayBased = getMondayBasedDay(lastDay)
  const daysAfter = 6 - lastDayMondayBased

  const totalDays = firstDayMondayBased + lastDay.getDate() + daysAfter
  const weeks = totalDays / 7

  const grid: string[][] = []
  for (let week = 0; week < weeks; week++) {
    const row: string[] = []
    for (let day = 0; day < 7; day++) {
      row.push(addDays(gridStart, week * 7 + day))
    }
    grid.push(row)
  }

  return grid
}

/**
 * 월간 그리드에 포함된 모든 날짜를 1차원 배열로 반환
 * (스토리지 일괄 조회용)
 */
export const getMonthGridAllDates = (yearMonth: string): ReadonlyArray<string> => {
  const grid = getMonthGridDates(yearMonth)
  return grid.flat()
}

/**
 * 월간 그리드의 시작~끝 날짜 범위 반환
 */
export const getMonthGridRange = (yearMonth: string): { start: string; end: string } => {
  const allDates = getMonthGridAllDates(yearMonth)
  const first = allDates[0]
  const last = allDates[allDates.length - 1]

  if (!first || !last) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`)
  }

  return { start: first, end: last }
}

/**
 * 월 이동: YYYY-MM 형식에서 n개월 더하기
 */
export const addMonths = (yearMonth: string, n: number): string => {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr ?? '2026', 10)
  const month = parseInt(monthStr ?? '1', 10)

  const date = new Date(year, month - 1 + n, 1)
  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')

  return `${newYear}-${newMonth}`
}

/**
 * 날짜에서 YYYY-MM 추출
 */
export const toYearMonth = (dateStr: string): string => {
  return dateStr.substring(0, 7)
}

/**
 * YYYY-MM 형식을 로케일에 맞는 월 표시 문자열로 변환
 * ko: "2026년 3월", en: "2026. 03"
 */
export const formatMonthDisplay = (yearMonth: string): string => {
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = parseInt(yearStr ?? '2026', 10)
  const month = parseInt(monthStr ?? '1', 10)
  return getTranslations().time.formatMonthYear(year, month)
}

/**
 * 두 날짜가 같은 달인지 확인
 */
export const isSameMonth = (dateStr: string, yearMonth: string): boolean => {
  return toYearMonth(dateStr) === yearMonth
}

/**
 * 오늘 날짜의 YYYY-MM 반환
 */
export const getCurrentMonth = (): string => {
  return toYearMonth(formatDate(new Date()))
}

/** 요일 헤더 라벨 (월요일 시작, 한국어 — 하위 호환용) */
export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const

/** 요일 헤더 라벨 (짧은 영문) */
export const WEEKDAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/**
 * 로케일에 맞는 요일 헤더 라벨 반환 (월요일 시작)
 * ko: ['월', '화', '수', '목', '금', '토', '일']
 * en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
 */
export const getWeekdayLabels = (): ReadonlyArray<string> =>
  getTranslations().time.weekdays
