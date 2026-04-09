/**
 * RRULE 조작 유틸 (반복 일정 규칙 변환)
 *
 * Google Calendar의 반복 일정에서 "이 일정과 향후 일정" 삭제를 구현하기 위해,
 * 기존 RRULE에 UNTIL 종료일을 추가하는 함수를 제공한다.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10
 */

/** Asia/Seoul 타임존 오프셋 (scheduleToGoogleEvent와 일치시킴) */
const SEOUL_OFFSET = '+09:00'

/**
 * 기존 RRULE에 UNTIL 종료일을 추가하여 새 RRULE을 만든다.
 *
 * 동작 단계:
 * 1. 'RRULE:' 접두사를 분리한다.
 * 2. 본문을 ';'로 split하고, 충돌하는 COUNT/UNTIL 부분을 제거한다.
 *    (UNTIL과 COUNT는 RFC 5545에 의해 상호 배타적)
 * 3. 인스턴스 시작 시각보다 1초 전을 UTC 형식(YYYYMMDDTHHmmssZ)으로 계산한다.
 *    1초 전인 이유: RRULE의 UNTIL은 inclusive — 그 순간에 시작하는 이벤트도 포함됨.
 * 4. 'UNTIL=...'를 부분 배열에 추가하고 다시 ';'로 join한다.
 *
 * @param originalRrule - 부모 이벤트의 기존 RRULE (예: 'RRULE:FREQ=WEEKLY;BYDAY=MO')
 * @param instanceDate - 자르기 시작할 인스턴스의 날짜 (YYYY-MM-DD)
 * @param instanceStartTime - 인스턴스 시작 시각 (HH:mm)
 * @returns UNTIL이 추가된 새 RRULE 문자열
 *
 * @example
 * buildUntilRrule('RRULE:FREQ=WEEKLY', '2026-04-09', '09:00')
 * // → 'RRULE:FREQ=WEEKLY;UNTIL=20260408T235959Z'
 *
 * @example
 * // 기존 BYDAY는 보존, COUNT는 제거됨
 * buildUntilRrule('RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10', '2026-04-09', '09:00')
 * // → 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20260408T235959Z'
 */
export const buildUntilRrule = (
  originalRrule: string,
  instanceDate: string,
  instanceStartTime: string
): string => {
  const prefix = 'RRULE:'
  const ruleBody = originalRrule.startsWith(prefix)
    ? originalRrule.slice(prefix.length)
    : originalRrule

  // COUNT, UNTIL 제거 — UNTIL과 COUNT는 상호 배타적, 기존 UNTIL은 새 값으로 덮어씀
  const parts = ruleBody
    .split(';')
    .filter((part) => {
      const upper = part.toUpperCase()
      return !upper.startsWith('COUNT=') && !upper.startsWith('UNTIL=')
    })

  // 인스턴스 시작 시각을 Asia/Seoul 기준 ISO로 변환
  // 예: '2026-04-09' + '09:00' → '2026-04-09T09:00:00+09:00'
  const instanceIso = `${instanceDate}T${instanceStartTime}:00${SEOUL_OFFSET}`
  const instanceMs = new Date(instanceIso).getTime()

  if (Number.isNaN(instanceMs)) {
    throw new Error(`Invalid instance date/time: ${instanceDate} ${instanceStartTime}`)
  }

  // 1초 전 → RRULE UNTIL은 inclusive이므로, 인스턴스가 살아남지 않도록 1초 빼기
  const untilDate = new Date(instanceMs - 1000)
  const untilStr = formatRruleUntilUtc(untilDate)

  parts.push(`UNTIL=${untilStr}`)

  return `${prefix}${parts.join(';')}`
}

/**
 * Date를 RRULE UNTIL 형식 (YYYYMMDDTHHmmssZ)으로 포맷한다.
 *
 * RFC 5545에서 UNTIL은 두 가지 형식 가능:
 * - DATE: YYYYMMDD (시간 없음)
 * - DATE-TIME: YYYYMMDDTHHmmssZ (UTC, 'Z' 접미사 필수)
 *
 * 우리는 시간 정밀도가 필요하므로 DATE-TIME(UTC)을 사용한다.
 */
const formatRruleUntilUtc = (date: Date): string => {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`
}
