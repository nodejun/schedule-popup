/**
 * 설정 상태 관리 스토어
 *
 * 테마, 타임라인 범위, 기본 뷰 등 사용자 설정을 관리한다.
 * chrome.storage.sync를 통해 디바이스 간 동기화된다.
 */

import { create } from 'zustand'
import type { Settings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/types/settings'
import {
  getSettings,
  updateSettings as repoUpdate,
  resetSettings as repoReset,
} from '@/storage/settings-repository'

interface SettingsState {
  readonly settings: Settings
  readonly isLoaded: boolean
}

interface SettingsActions {
  /** 저장소에서 설정 로드 */
  readonly loadSettings: () => Promise<void>
  /** 설정 일부 업데이트 */
  readonly updateSettings: (patch: Partial<Settings>) => Promise<void>
  /** 기본값으로 초기화 */
  readonly resetSettings: () => Promise<void>
}

export type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>((set) => ({
  // --- State ---
  settings: { ...DEFAULT_SETTINGS },
  isLoaded: false,

  // --- Actions ---
  loadSettings: async () => {
    try {
      const settings = await getSettings()
      set({ settings, isLoaded: true })
    } catch {
      set({ settings: { ...DEFAULT_SETTINGS }, isLoaded: true })
    }
  },

  updateSettings: async (patch: Partial<Settings>) => {
    try {
      const updated = await repoUpdate(patch)
      set({ settings: updated })
    } catch {
      // 실패 시 현재 상태 유지
    }
  },

  resetSettings: async () => {
    try {
      const defaults = await repoReset()
      set({ settings: defaults })
    } catch {
      set({ settings: { ...DEFAULT_SETTINGS } })
    }
  },
}))
