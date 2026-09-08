import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONFIG } from '@/config'
import type { User } from '@/types'
import {
  SESSION_EXPIRY_SAFETY_SKEW_MS,
  useAuthStore,
} from './auth'
import { useInsightStore } from '@/stores/insight'
import { captureUserScopeEpoch } from '@/stores/resetUserScopedState'

const NOW = new Date('2026-07-27T00:00:00.000Z')
const USER: User = {
  id: '5e51fe8c-306d-463c-9c76-dd5368bfa5ab',
  email: 'user@example.test',
  fullName: 'Example User',
  preferredCurrency: 'MYR',
  createdAt: NOW.toISOString(),
}
const OTHER_USER: User = {
  ...USER,
  id: '6e51fe8c-306d-463c-9c76-dd5368bfa5ab',
  email: 'other@example.test',
}

describe('memory-only authentication state', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    vi.stubGlobal('localStorage', createMemoryStorage())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useAuthStore().$dispose()
    vi.useRealTimers()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('removes legacy persisted credentials without restoring them', () => {
    localStorage.setItem(CONFIG.TOKEN_KEY, 'legacy-token')
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(USER))
    localStorage.setItem(CONFIG.EXPIRY_KEY, '2099-07-27T00:00:00.000Z')

    const store = useAuthStore()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.expiresAt).toBeNull()
    expectLegacyStorageCleared()
  })

  it('stores token user and server expiry in memory only', () => {
    const store = useAuthStore()
    const expiresAt = new Date(NOW.getTime() + 60_000).toISOString()

    store.setSession('access-token', USER, expiresAt)

    expect(store.token).toBe('access-token')
    expect(store.user).toEqual(USER)
    expect(store.expiresAt).toBe(expiresAt)
    expect(store.isAuthenticated).toBe(true)
    expectLegacyStorageCleared()
  })

  it('rejects malformed or already expired server expiry', () => {
    const store = useAuthStore()

    expect(() => store.setSession('token', USER, 'not-an-instant')).toThrow()
    expect(store.bootstrapStatus).toBe('anonymous')
    expect(() => {
      store.setSession('token', USER, new Date(NOW.getTime() - 1).toISOString())
    }).toThrow()
    expect(store.isAuthenticated).toBe(false)
  })

  it('requests refresh at the safety-adjusted access expiry', async () => {
    const store = useAuthStore()
    const refresh = vi.fn(async () => {
      store.setSession(
        'successor',
        USER,
        new Date(NOW.getTime() + 120_000).toISOString()
      )
    })
    store.configureRefresh(refresh)
    store.setSession(
      'access-token',
      USER,
      new Date(NOW.getTime() + 60_000).toISOString()
    )

    await vi.advanceTimersByTimeAsync(60_000 - SESSION_EXPIRY_SAFETY_SKEW_MS)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(store.token).toBe('successor')
    expect(store.isAuthenticated).toBe(true)
  })

  it('setting a new session replaces the old expiry timer', async () => {
    const store = useAuthStore()
    const refresh = vi.fn(async () => undefined)
    store.configureRefresh(refresh)
    store.setSession('first', USER, new Date(NOW.getTime() + 60_000).toISOString())
    store.setSession('second', USER, new Date(NOW.getTime() + 120_000).toISOString())

    await vi.advanceTimersByTimeAsync(60_000)

    expect(refresh).not.toHaveBeenCalled()
    expect(store.token).toBe('second')
  })

  it('does not reset user-scoped feature state during a same-user token refresh', () => {
    const store = useAuthStore()
    const insights = useInsightStore()
    store.setSession('first', USER, new Date(NOW.getTime() + 60_000).toISOString())
    insights.insights = [{ id: 'insight-a', title: 'same user cache' } as never]
    const epochAfterLogin = captureUserScopeEpoch()

    store.setSession('second', USER, new Date(NOW.getTime() + 120_000).toISOString())

    expect(insights.insights).toHaveLength(1)
    expect(captureUserScopeEpoch()).toBe(epochAfterLogin)
  })

  it('resets user-scoped feature state before accepting a different user identity', () => {
    const store = useAuthStore()
    const insights = useInsightStore()
    store.setSession('first', USER, new Date(NOW.getTime() + 60_000).toISOString())
    insights.insights = [{ id: 'insight-a', title: 'USER_A_PRIVATE_INSIGHT' } as never]
    const epochAfterUserA = captureUserScopeEpoch()

    store.setSession('second', OTHER_USER, new Date(NOW.getTime() + 120_000).toISOString())

    expect(store.user?.id).toBe(OTHER_USER.id)
    expect(insights.insights).toEqual([])
    expect(captureUserScopeEpoch()).toBe(epochAfterUserA + 1)
  })

  it('rechecks expiry when the tab becomes visible', () => {
    const store = useAuthStore()
    const refresh = vi.fn(async () => undefined)
    store.configureRefresh(refresh)
    store.setSession(
      'access-token',
      USER,
      new Date(NOW.getTime() + 60_000).toISOString()
    )
    vi.setSystemTime(new Date(NOW.getTime() + 61_000))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })

    document.dispatchEvent(new Event('visibilitychange'))

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

function expectLegacyStorageCleared(): void {
  expect(localStorage.getItem(CONFIG.TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(CONFIG.USER_KEY)).toBeNull()
  expect(localStorage.getItem(CONFIG.EXPIRY_KEY)).toBeNull()
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
