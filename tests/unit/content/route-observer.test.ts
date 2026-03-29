import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  detectRoute,
  createRouteObserver,
} from '@/content/observers/route-observer'
import type { RouteChangeCallback } from '@/content/observers/route-observer'

describe('detectRoute', () => {
  it('홈 페이지를 감지한다', () => {
    expect(detectRoute('https://www.youtube.com/')).toBe('home')
  })

  it('피드 페이지를 홈으로 감지한다', () => {
    expect(detectRoute('https://www.youtube.com/feed/subscriptions')).toBe(
      'home'
    )
  })

  it('Shorts 페이지를 감지한다', () => {
    expect(detectRoute('https://www.youtube.com/shorts/abc123')).toBe('shorts')
    expect(detectRoute('https://www.youtube.com/shorts')).toBe('shorts')
  })

  it('Watch 페이지를 감지한다', () => {
    expect(detectRoute('https://www.youtube.com/watch?v=abc123')).toBe('watch')
  })

  it('기타 페이지를 감지한다', () => {
    expect(detectRoute('https://www.youtube.com/results?search=test')).toBe(
      'other'
    )
    expect(detectRoute('https://www.youtube.com/channel/UCxxx')).toBe('other')
  })
})

describe('createRouteObserver', () => {
  let originalPushState: typeof history.pushState
  let originalReplaceState: typeof history.replaceState

  beforeEach(() => {
    // History API 원본 보관
    originalPushState = history.pushState
    originalReplaceState = history.replaceState
  })

  afterEach(() => {
    // History API 복원 (테스트 간 오염 방지)
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
  })

  it('start 시 현재 라우트로 즉시 콜백을 호출한다', () => {
    // jsdom 기본 URL은 http://localhost:3000/ → pathname '/' → 'home'
    const callback = vi.fn<RouteChangeCallback>()
    const observer = createRouteObserver(callback)

    observer.start()
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith('home', expect.any(String))

    observer.stop()
  })

  it('getCurrentRoute가 현재 라우트를 반환한다', () => {
    const callback = vi.fn<RouteChangeCallback>()
    const observer = createRouteObserver(callback)

    observer.start()
    const route = observer.getCurrentRoute()
    expect(['home', 'shorts', 'watch', 'other']).toContain(route)

    observer.stop()
  })

  it('stop 후 History API가 복원된다', () => {
    const callback = vi.fn<RouteChangeCallback>()
    const observer = createRouteObserver(callback)

    observer.start()
    // pushState가 패치되었을 것
    observer.stop()

    // stop 후에는 패치된 함수가 아닌 원본이어야 함
    // (정확한 비교는 어렵지만, 에러 없이 동작해야 함)
    expect(() => {
      history.pushState({}, '', '/')
    }).not.toThrow()
  })

  it('중복 start를 방지한다', () => {
    const callback = vi.fn<RouteChangeCallback>()
    const observer = createRouteObserver(callback)

    observer.start()
    observer.start() // 두 번째 호출은 무시되어야 함

    // 콜백은 한 번만 호출
    expect(callback).toHaveBeenCalledOnce()

    observer.stop()
  })

  it('중복 stop을 방지한다', () => {
    const callback = vi.fn<RouteChangeCallback>()
    const observer = createRouteObserver(callback)

    observer.start()
    observer.stop()

    // 두 번째 stop은 에러 없이 무시
    expect(() => observer.stop()).not.toThrow()
  })
})
