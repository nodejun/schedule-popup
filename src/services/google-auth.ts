/**
 * Google OAuth 인증 서비스
 *
 * chrome.identity API를 사용하여 Google 계정 인증을 처리한다.
 * Chrome Extension에서는 백엔드 서버 없이 chrome.identity가
 * OAuth 토큰 발급/갱신/폐기를 모두 처리한다.
 *
 * 흐름:
 * 1. getAuthToken() → 구글 로그인 팝업 → 토큰 획득
 * 2. fetchWithAuth(url) → 토큰을 Header에 자동 첨부하여 API 호출
 * 3. removeAuthToken() → 로그아웃 (토큰 폐기)
 */

import type { GoogleAuthState } from "@/types/google-calendar";

// ─────────────────────────────────────────────
// 1. getAuthToken — 구글 로그인 + 토큰 획득
// ─────────────────────────────────────────────

/**
 * Google OAuth 액세스 토큰을 획득한다.
 *
 * interactive: true → 사용자에게 로그인 팝업을 보여줌
 * interactive: false → 이미 로그인된 경우에만 토큰 반환 (자동 갱신)
 *
 * @param interactive - 로그인 팝업 표시 여부 (기본: true)
 * @returns 액세스 토큰 문자열
 * @throws 사용자가 로그인을 거부하거나 에러 발생 시
 */
export const getAuthToken = async (
  interactive: boolean = true,
): Promise<string> => {
  const result = await chrome.identity.getAuthToken({ interactive });

  if (!result.token) {
    throw new Error("토큰을 가져올 수 없습니다");
  }

  return result.token;
};

// ─────────────────────────────────────────────
// 2. removeAuthToken — 토큰 무효화 (로그아웃)
// ─────────────────────────────────────────────

/**
 * 캐시된 OAuth 토큰을 제거하고 Google 서버에서 무효화한다.
 *
 * 두 단계로 처리:
 * 1. chrome.identity.removeCachedAuthToken → 크롬 내부 캐시에서 제거
 * 2. fetch(revoke URL) → Google 서버에서도 토큰 폐기
 *
 * @param token - 무효화할 액세스 토큰
 */
export const removeAuthToken = async (token: string): Promise<void> => {
  // 크롬 내부 캐시에서 토큰 제거
  await new Promise<void>((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });

  // Google 서버에서 토큰 폐기 (선택이지만 보안상 권장)
  try {
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
  } catch {
    // 네트워크 에러는 무시 — 토큰은 자연 만료됨
  }
};

// ─────────────────────────────────────────────
// 3. getAuthState — 현재 인증 상태 확인
// ─────────────────────────────────────────────

/**
 * 현재 Google 인증 상태를 확인한다.
 *
 * interactive: false로 호출하여 팝업 없이 토큰 존재 여부만 확인.
 * 로그인된 상태면 토큰이 반환되고, 아니면 에러가 발생한다.
 */
export const getAuthState = async (): Promise<GoogleAuthState> => {
  try {
    const token = await getAuthToken(false);
    return {
      isAuthenticated: true,
      accessToken: token,
      error: null,
    };
  } catch {
    return {
      isAuthenticated: false,
      accessToken: null,
      error: null,
    };
  }
};

// ─────────────────────────────────────────────
// 4. fetchWithAuth — 인증된 API 호출
// ─────────────────────────────────────────────

/**
 * Google API에 인증된 요청을 보낸다.
 *
 * 토큰을 Authorization 헤더에 자동으로 첨부한다.
 * 401 에러(토큰 만료) 시 토큰을 갱신하고 1회 재시도한다.
 *
 * @param url - API 엔드포인트 URL
 * @param options - fetch 옵션 (method, body 등)
 * @returns API 응답
 * @throws 재시도 후에도 실패하면 에러 발생
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAuthToken(false);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // 401 = 토큰 만료 → 토큰 갱신 후 1회 재시도
  if (response.status === 401) {
    await removeAuthToken(token);
    const newToken = await getAuthToken(false);

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  return response;
};
