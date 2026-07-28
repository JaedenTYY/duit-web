import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'
import { logger } from '@/utils/logger'
import { processApiFailure } from './api'

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

const USER: User = {
  id: '5e51fe8c-306d-463c-9c76-dd5368bfa5ab',
  email: 'user@example.test',
  fullName: 'Example User',
  preferredCurrency: 'MYR',
  createdAt: '2026-07-27T00:00:00.000Z',
}

describe('API authentication failure handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T00:00:00.000Z'))
    vi.stubGlobal('localStorage', createMemoryStorage())
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useAuthStore().$dispose()
    vi.useRealTimers()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('clears token, user, and server expiry together after a 401', () => {
    const store = useAuthStore()
    store.setSession(
      'access-token',
      USER,
      '2026-07-27T01:00:00.000Z'
    )

    processApiFailure({
      config: { method: 'get', url: '/transactions?cursor=sensitive' },
      response: {
        status: 401,
        data: {
          error: {
            message: 'Authentication is required',
            requestId: 'f64651f2-c852-4dd7-869a-c20a5a434534',
          },
        },
      },
    })

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.expiresAt).toBeNull()
    expect(store.sessionExpired).toBe(true)
    expect(logger.error).toHaveBeenCalledWith(
      expect.not.stringContaining('cursor=sensitive')
    )
  })

  it('does not clear an authenticated session after a 429', () => {
    const store = useAuthStore()
    store.setSession('access-token', USER, '2026-07-27T01:00:00.000Z')

    processApiFailure({
      config: { method: 'post' },
      response: {
        status: 429,
        data: {
          error: {
            code: 'ERR_RATE_LIMIT_429',
            message: 'Too many requests. Please try again later.',
          },
        },
        headers: { 'retry-after': '10' },
      },
    })

    expect(store.token).toBe('access-token')
    expect(store.user).toEqual(USER)
    expect(store.expiresAt).toBe('2026-07-27T01:00:00.000Z')
  })
})

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}
