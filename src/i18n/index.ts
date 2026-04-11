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
 * Returns the translation object for the active locale.
 * This is a plain function (not a React hook) so it can be used
 * outside of React components (e.g., in stores or utils).
 */
export function getTranslations() {
  return getLocale(detectLanguage())
}

/**
 * React hook that returns translations for the active locale.
 *
 * The locale is resolved once at call time and is stable within
 * a render.  Language changes require a page reload (same as Chrome's
 * own i18n behaviour).
 */
export function useTranslation() {
  return getLocale(detectLanguage())
}

// Re-export locale objects for direct access when needed
export { en, ko }
