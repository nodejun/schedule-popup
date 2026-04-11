/**
 * 시간 선택 컴포넌트 (드롭다운 방식)
 *
 * 네이티브 <input type="time"> 대신 커스텀 드롭다운으로
 * 15분 단위로 시간을 선택한다.
 * 드롭다운은 fixed 포지션으로 모달 밖에 떠서 잘리지 않는다.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n'

interface TimeInputProps {
  readonly label: string
  readonly value: string
  readonly onChange: (time: string) => void
  readonly min?: string
  readonly max?: string
  readonly error?: string
}

/** 15분 단위 시간 슬롯 생성 (00:00 ~ 23:45) */
const generateTimeSlots = (): ReadonlyArray<string> => {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      )
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

/** 시간을 "AM/PM HH:MM" (또는 로케일 형식)으로 표시 */
const formatDisplayTime = (time: string, am: string, pm: string): string => {
  const [hourStr, minute] = time.split(':')
  const hour = parseInt(hourStr ?? '0', 10)
  const period = hour < 12 ? am : pm
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${period} ${String(displayHour).padStart(2, '0')}:${minute}`
}

export const TimeInput = ({
  label,
  value,
  onChange,
  min,
  error,
}: TimeInputProps): ReactNode => {
  const t = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // 토글 (열기/닫기)
  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  // 외부 클릭 시 닫기 (버튼 + 드롭다운 영역 제외)
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      // Shadow DOM 안에서도 실제 클릭된 요소를 가져오기 위해 composedPath 사용
      const target = (e.composedPath()[0] ?? e.target) as Node
      if (
        buttonRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [isOpen])

  // 드롭다운 위치 계산 + 선택된 시간으로 스크롤
  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setIsPositioned(false)
      return
    }

    const rect = buttonRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      top: rect.bottom + 4,
      maxHeight: '200px',
    })
    setIsPositioned(true)
  }, [isOpen])

  // 드롭다운이 위치 잡힌 후 선택된 시간으로 스크롤
  useEffect(() => {
    if (!isPositioned || !listRef.current) return
    // 약간의 딜레이 후 스크롤 (DOM 렌더링 완료 대기)
    const timer = setTimeout(() => {
      if (listRef.current) {
        const selectedEl = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selectedEl) {
          listRef.current.scrollTop = selectedEl.offsetTop - listRef.current.clientHeight / 2 + selectedEl.clientHeight / 2
        }
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [isPositioned])

  const handleSelect = (time: string) => {
    onChange(time)
    setIsOpen(false)
  }

  // min 이후의 시간만 표시 (종료 시간 선택 시)
  const filteredSlots = min
    ? TIME_SLOTS.filter((slot) => slot > min)
    : TIME_SLOTS

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-medium text-gray-700 dark:text-neutral-300">
        {label}
      </label>

      {/* 선택된 시간 표시 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={[
          'flex items-center justify-between px-4 py-3 rounded-xl border text-lg font-medium',
          'bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100',
          'transition-all duration-200 cursor-pointer',
          error
            ? 'border-red-500 ring-1 ring-red-500'
            : isOpen
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-200 dark:border-neutral-600 hover:border-gray-300',
        ].join(' ')}
      >
        <span>{formatDisplayTime(value, t.time.am, t.time.pm)}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* 드롭다운 목록 (fixed — 모달 밖에 떠서 잘리지 않음) */}
      {isOpen && isPositioned && (
        <div
          ref={listRef}
          className="z-[200] overflow-y-auto rounded-xl bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={dropdownStyle}
        >
          {filteredSlots.map((slot) => {
            const isSelected = slot === value
            return (
              <button
                key={slot}
                type="button"
                data-selected={isSelected}
                onClick={() => handleSelect(slot)}
                className={[
                  'w-full px-4 py-2.5 text-left text-base transition-all duration-200',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                {formatDisplayTime(slot, t.time.am, t.time.pm)}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}
