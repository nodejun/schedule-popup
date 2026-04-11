/**
 * i18n — lightweight translation hook
 *
 * Detects the browser/Chrome UI language and returns the matching locale.
 * Falls back to English for any language other than Korean.
 *
 * Usage:
 *   const t = useTranslation()
 *   t.common.cancel          // 'Cancel' | '취소'
 *   t.schedule.moreCount(3)  // '+3 more' | '+3개 더'
 */

import { en } from './en'
import { ko } from './ko'
import { useSettingsStore } from '@/stores/settings-store'

/**
 * Union of all supported locale types.
 * Using a union (not just `typeof en`) lets functions that accept
 * `Translations` receive either locale object without type errors.
 */
export type Translations = typeof en | typeof ko

/**
 * Returns the locale object for the given language code.
 * Defaults to English for any non-Korean language.
 */
function getLocale(lang: string) {
  return lang.startsWith('ko') ? ko : en
}

/**
 * Detects the active UI language.
 * Prefers the Chrome extension UI language when available,
 * falls back to `navigator.language`.
 */
function detectLanguage(): string {
  try {
    // chrome.i18n.getUILanguage() returns e.g. 'ko', 'en-US'
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage()
    }
  } catch {
    // ignore — non-extension context (tests, storybook, etc.)
  }
  return navigator.language ?? 'en'
}

/**
 * Settings 언어 설정을 반영한 실효 언어 코드를 반환한다.
 * 'auto'인 경우 브라우저/Chrome 언어를 자동 감지한다.
 */
function resolveLanguage(setting: 'auto' | 'ko' | 'en'): string {
  return setting === 'auto' ? detectLanguage() : setting
}

/**
 * Returns the translation object for the active locale.
 * This is a plain function (not a React hook) so it can be used
 * outside of React components (e.g., in stores or utils).
 *
 * Reads language preference from settings store (getState — no subscription).
 */
export function getTranslations() {
  const { settings } = useSettingsStore.getState()
  return getLocale(resolveLanguage(settings.language))
}

/**
 * React hook that returns translations for the active locale.
 *
 * Subscribes to the settings store so language changes (KO/EN toggle)
 * trigger a re-render without a page reload.
 */
export function useTranslation() {
  const language = useSettingsStore((s) => s.settings.language)
  return getLocale(resolveLanguage(language))
}

// Re-export locale objects for direct access when needed
export { en, ko }
