/**
 * google-auth.ts 테스트
 *
 * chrome.identity API를 mock하여 인증 함수들을 검증한다.
 *
 * NestJS 비유: AuthService 단위 테스트 (외부 API는 mock)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthToken, removeAuthToken, getAuthState } from '@/services/google-auth'

// chrome.identity mock
const mockGetAuthToken = vi.fn()
const mockRemoveCachedAuthToken = vi.fn()

// chrome 전역 객체 mock
vi.stubGlobal('chrome', {
  identity: {
    getAuthToken: mockGetAuthToken,
    removeCachedAuthToken: mockRemoveCachedAuthToken,
  },
})

// fetch mock
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({ ok: true })
})

// ─────────────────────────────────────────────
// getAuthToken
// ─────────────────────────────────────────────

describe('getAuthToken', () => {
  it('토큰을 성공적으로 반환한다', async () => {
    mockGetAuthToken.mockResolvedValue({ token: 'test-token-123' })

    const token = await getAuthToken(true)

    expect(token).toBe('test-token-123')
    expect(mockGetAuthToken).toHaveBeenCalledWith({ interactive: true })
  })

  it('interactive false로 호출할 수 있다', async () => {
    mockGetAuthToken.mockResolvedValue({ token: 'cached-token' })

    await getAuthToken(false)

    expect(mockGetAuthToken).toHaveBeenCalledWith({ interactive: false })
  })

  it('토큰이 없으면 에러를 던진다', async () => {
    mockGetAuthToken.mockResolvedValue({ token: undefined })

    await expect(getAuthToken(true)).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────
// removeAuthToken
// ─────────────────────────────────────────────

describe('removeAuthToken', () => {
  it('캐시된 토큰을 제거한다', async () => {
    mockRemoveCachedAuthToken.mockImplementation((_opts: unknown, cb: () => void) => cb())

    await removeAuthToken('old-token')

    expect(mockRemoveCachedAuthToken).toHaveBeenCalledWith(
      { token: 'old-token' },
      expect.any(Function)
    )
  })

  it('Google revoke URL을 호출한다', async () => {
    mockRemoveCachedAuthToken.mockImplementation((_opts: unknown, cb: () => void) => cb())

    await removeAuthToken('old-token')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/revoke?token=old-token'
    )
  })

  it('revoke 네트워크 에러는 무시한다', async () => {
    mockRemoveCachedAuthToken.mockImplementation((_opts: unknown, cb: () => void) => cb())
    mockFetch.mockRejectedValue(new Error('Network error'))

    // 에러를 던지지 않아야 함
    await expect(removeAuthToken('old-token')).resolves.toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// getAuthState
// ─────────────────────────────────────────────

describe('getAuthState', () => {
  it('인증된 상태를 반환한다', async () => {
    mockGetAuthToken.mockResolvedValue({ token: 'valid-token' })

    const state = await getAuthState()

    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('valid-token')
    expect(state.error).toBeNull()
  })

  it('미인증 상태를 반환한다', async () => {
    mockGetAuthToken.mockRejectedValue(new Error('No token'))

    const state = await getAuthState()

    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.error).toBeNull()
  })
})
