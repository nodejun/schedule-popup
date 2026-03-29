/**
 * 설정 데이터 접근 계층
 */

import type { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'
import { storageGet, storageSet } from './chrome-storage'

const SETTINGS_KEY = 'settings'

export const getSettings = async (): Promise<Settings> => {
  const settings = await storageGet<Settings>(SETTINGS_KEY)
  return settings ?? { ...DEFAULT_SETTINGS }
}

export const updateSettings = async (
  patch: Partial<Settings>
): Promise<Settings> => {
  const current = await getSettings()
  const updated: Settings = { ...current, ...patch }
  await storageSet(SETTINGS_KEY, updated)
  return updated
}

export const resetSettings = async (): Promise<Settings> => {
  const defaults = { ...DEFAULT_SETTINGS }
  await storageSet(SETTINGS_KEY, defaults)
  return defaults
}
