import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// chrome.storage mock with resettable store
const createStorageMock = () => {
  let store: Record<string, unknown> = {}

  const mock = {
    get: vi.fn((keys: string | string[]) => {
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: store[keys] })
      }
      const result: Record<string, unknown> = {}
      for (const key of keys) {
        result[key] = store[key]
      }
      return Promise.resolve(result)
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      store = { ...store, ...items }
      return Promise.resolve()
    }),
    remove: vi.fn((keys: string | string[]) => {
      const keyArray = typeof keys === 'string' ? [keys] : keys
      const next = { ...store }
      for (const key of keyArray) {
        delete next[key]
      }
      store = next
      return Promise.resolve()
    }),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    _reset: () => {
      store = {}
    },
  }

  return mock
}

// Global chrome API mock
const syncMock = createStorageMock()
const localMock = createStorageMock()

const chromeMock = {
  storage: {
    sync: syncMock,
    local: localMock,
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  notifications: {
    create: vi.fn(),
  },
}

vi.stubGlobal('chrome', chromeMock)

// Reset storage before each test
beforeEach(() => {
  syncMock._reset()
  localMock._reset()
})
