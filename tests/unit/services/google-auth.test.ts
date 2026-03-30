/**
 * google-auth.ts 테스트
 *
 * chrome.runtime.sendMessage를 mock하여 인증 함수들을 검증한다.
 * (Content Script에서는 chrome.identity를 직접 호출하지 않고
 *  Service Worker에 메시지를 보내는 방식으로 변경됨)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getAuthToken, removeAuthToken, getAuthState } from '@/services/google-auth'

// chrome.runtime.sendMessage mock
const mockSendMessage = vi.fn()

// chrome 전역 객체 mock
vi.stubGlobal('chrome', {
  runtime: {
    sendMessage: mockSendMessage,
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
    mockSendMessage.mockResolvedValue({ token: 'test-token-123' })

    const token = await getAuthToken(true)

    expect(token).toBe('test-token-123')
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'google-auth-token',
      interactive: true,
    })
  })

  it('interactive false로 호출할 수 있다', async () => {
    mockSendMessage.mockResolvedValue({ token: 'cached-token' })

    await getAuthToken(false)

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'google-auth-token',
      interactive: false,
    })
  })

  it('토큰이 없으면 에러를 던진다', async () => {
    mockSendMessage.mockResolvedValue({ token: null })

    await expect(getAuthToken(true)).rejects.toThrow()
  })
})

// ─────────────────────────────────────────────
// removeAuthToken
// ─────────────────────────────────────────────

describe('removeAuthToken', () => {
  it('Service Worker에 토큰 제거 메시지를 보낸다', async () => {
    mockSendMessage.mockResolvedValue({ success: true })

    await removeAuthToken('old-token')

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'google-auth-remove',
      token: 'old-token',
    })
  })

  it('Google revoke URL을 호출한다', async () => {
    mockSendMessage.mockResolvedValue({ success: true })

    await removeAuthToken('old-token')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/revoke?token=old-token'
    )
  })

  it('revoke 네트워크 에러는 무시한다', async () => {
    mockSendMessage.mockResolvedValue({ success: true })
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(removeAuthToken('old-token')).resolves.toBeUndefined()
  })
})

// ─────────────────────────────────────────────
// getAuthState
// ─────────────────────────────────────────────

describe('getAuthState', () => {
  it('인증된 상태를 반환한다', async () => {
    mockSendMessage.mockResolvedValue({ token: 'valid-token' })

    const state = await getAuthState()

    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('valid-token')
    expect(state.error).toBeNull()
  })

  it('미인증 상태를 반환한다', async () => {
    mockSendMessage.mockResolvedValue({ token: null })

    const state = await getAuthState()

    expect(state.isAuthenticated).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.error).toBeNull()
  })
})
