/**
 * Google OAuth 인증 서비스
 *
 * Content Script에서는 chrome.identity를 직접 호출할 수 없으므로,
 * Service Worker에 메시지를 보내서 대신 처리하도록 한다.
 *
 * 흐름:
 * Content Script → chrome.runtime.sendMessage → Service Worker
 *   → chrome.identity.getAuthToken → 토큰 반환
 *
 * NestJS 비유: Controller가 직접 DB 접근 못 하고 Service를 통해 접근하는 것과 같음
 */

import type { GoogleAuthState } from '@/types/google-calendar'

// ─────────────────────────────────────────────
// 1. getAuthToken — Service Worker에게 토큰 요청
// ─────────────────────────────────────────────

/**
 * Google OAuth 액세스 토큰을 획득한다.
 *
 * Service Worker에 메시지를 보내서 chrome.identity.getAuthToken을 대신 호출한다.
 *
 * @param interactive - 로그인 팝업 표시 여부 (기본: true)
 * @returns 액세스 토큰 문자열
 */
export const getAuthToken = async (
  interactive: boolean = true
): Promise<string> => {
  const response = await chrome.runtime.sendMessage({
    type: 'google-auth-token',
    interactive,
  })

  if (!response?.token) {
    throw new Error('토큰을 가져올 수 없습니다')
  }

  return response.token
}

// ─────────────────────────────────────────────
// 2. removeAuthToken — 토큰 무효화 (로그아웃)
// ─────────────────────────────────────────────

/**
 * 캐시된 OAuth 토큰을 제거하고 Google 서버에서 무효화한다.
 */
export const removeAuthToken = async (token: string): Promise<void> => {
  // Service Worker에게 캐시 토큰 제거 요청
  await chrome.runtime.sendMessage({
    type: 'google-auth-remove',
    token,
  })

  // Google 서버에서 토큰 폐기
  try {
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
  } catch {
    // 네트워크 에러는 무시 — 토큰은 자연 만료됨
  }
}

// ─────────────────────────────────────────────
// 3. getAuthState — 현재 인증 상태 확인
// ─────────────────────────────────────────────

/**
 * 현재 Google 인증 상태를 확인한다.
 */
export const getAuthState = async (): Promise<GoogleAuthState> => {
  try {
    const token = await getAuthToken(false)
    return { isAuthenticated: true, accessToken: token, error: null }
  } catch {
    return { isAuthenticated: false, accessToken: null, error: null }
  }
}

// ─────────────────────────────────────────────
// 4. fetchWithAuth — 인증된 API 호출
// ─────────────────────────────────────────────

/**
 * Google API에 인증된 요청을 보낸다.
 * 토큰을 Authorization 헤더에 자동 첨부하고, 401 시 재시도한다.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken(false)

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  // 401 = 토큰 만료 → 토큰 갱신 후 1회 재시도
  if (response.status === 401) {
    await removeAuthToken(token)
    const newToken = await getAuthToken(false)

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    })
  }

  return response
}
