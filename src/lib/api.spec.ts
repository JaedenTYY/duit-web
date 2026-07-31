import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'
import { logger } from '@/utils/logger'
import api, { processApiFailure } from './api'

const coordinatorMock = vi.hoisted(() => ({
  propagateRevocation: vi.fn(),
  refreshSessionSingleFlight: vi.fn(),
}))
const routerMock = vi.hoisted(() => ({
  currentRoute: {
    value: {
      fullPath: '/dashboard',
      meta: {},
      name: 'dashboard',
    },
  },
  replace: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/sessionCoordinator', () => coordinatorMock)
vi.mock('@/router', () => ({ default: routerMock }))

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
    vi.clearAllMocks()
    coordinatorMock.refreshSessionSingleFlight.mockReset()
    coordinatorMock.propagateRevocation.mockReset()
    vi.stubGlobal('localStorage', createMemoryStorage())
    localStorage.clear()
    setActivePinia(createPinia())
    coordinatorMock.propagateRevocation.mockImplementation(() => {
      useAuthStore().finishAnonymous('revoked')
    })
    routerMock.replace.mockResolvedValue(undefined)
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

  it('refreshes one controlled authentication failure and safely replays a GET', async () => {
    const store = useAuthStore()
    store.setSession('expired-access', USER, '2026-07-27T01:00:00.000Z')
    coordinatorMock.refreshSessionSingleFlight.mockImplementation(async () => {
      const session = {
        token: 'successor-access',
        user: USER,
        expiresAt: '2026-07-27T02:00:00.000Z',
      }
      useAuthStore().setSession(session.token, session.user, session.expiresAt)
      return session
    })
    let attempts = 0
    const seenAuthorization: unknown[] = []

    const response = await api.get('/transactions', {
      adapter: async (config) => {
        attempts += 1
        seenAuthorization.push(config.headers.Authorization)
        if (attempts === 1) {
          return Promise.reject(controlledUnauthorized(config))
        }
        return {
          config,
          data: { data: [] },
          headers: {},
          status: 200,
          statusText: 'OK',
        }
      },
    })

    expect(response.status).toBe(200)
    expect(attempts).toBe(2)
    expect(coordinatorMock.refreshSessionSingleFlight).toHaveBeenCalledTimes(1)
    expect(seenAuthorization).toEqual([
      'Bearer expired-access',
      'Bearer successor-access',
    ])
  })

  it('never automatically replays a multipart body after refreshing', async () => {
    const store = useAuthStore()
    store.setSession('expired-access', USER, '2026-07-27T01:00:00.000Z')
    coordinatorMock.refreshSessionSingleFlight.mockImplementation(async () => {
      const session = {
        token: 'successor-access',
        user: USER,
        expiresAt: '2026-07-27T02:00:00.000Z',
      }
      useAuthStore().setSession(session.token, session.user, session.expiresAt)
      return session
    })
    let attempts = 0
    const body = new FormData()
    body.append('file', new Blob(['receipt']), 'receipt.txt')

    await expect(
      api.post('/receipt/upload', body, {
        adapter: async (config) => {
          attempts += 1
          return Promise.reject(controlledUnauthorized(config))
        },
      })
    ).rejects.toBeTruthy()

    expect(attempts).toBe(1)
    expect(coordinatorMock.refreshSessionSingleFlight).toHaveBeenCalledTimes(1)
    expect(store.token).toBe('successor-access')
  })

  it('does not refresh public guest requests', async () => {
    await expect(
      api.get('/guest/bills/opaque-share-token', {
        adapter: async (config) => Promise.reject(controlledUnauthorized(config)),
      })
    ).rejects.toBeTruthy()

    expect(coordinatorMock.refreshSessionSingleFlight).not.toHaveBeenCalled()
  })

  it('refuses to attach credentials to an arbitrary absolute origin', async () => {
    const adapter = vi.fn()

    await expect(
      api.get('https://attacker.example/collect', { adapter })
    ).rejects.toThrow('untrusted origin')

    expect(adapter).not.toHaveBeenCalled()
  })
})

function controlledUnauthorized(config: unknown) {
  return {
    config,
    response: {
      status: 401,
      data: {
        error: {
          code: 'ERR_AUTH_001',
          message: 'Authentication is required',
          requestId: 'f64651f2-c852-4dd7-869a-c20a5a434534',
        },
      },
      headers: {},
    },
  }
}

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
