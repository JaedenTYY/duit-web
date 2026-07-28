import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONFIG } from '@/config'
import type { User } from '@/types'
import {
  SESSION_EXPIRY_SAFETY_SKEW_MS,
  useAuthStore,
} from './auth'

const NOW = new Date('2026-07-27T00:00:00.000Z')
const USER: User = {
  id: '5e51fe8c-306d-463c-9c76-dd5368bfa5ab',
  email: 'user@example.test',
  fullName: 'Example User',
  preferredCurrency: 'MYR',
  createdAt: NOW.toISOString(),
}

describe('auth session expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
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

  it('stores the server-issued expiresAt with the session', () => {
    const store = useAuthStore()
    const expiresAt = new Date(NOW.getTime() + 60_000).toISOString()

    store.setSession('access-token', USER, expiresAt)

    expect(store.expiresAt).toBe(expiresAt)
    expect(localStorage.getItem(CONFIG.EXPIRY_KEY)).toBe(expiresAt)
    expect(store.isAuthenticated).toBe(true)
  })

  it('does not restore an already expired session', () => {
    persistSession(new Date(NOW.getTime() - 1).toISOString())

    const store = useAuthStore()
    store.restoreSession()

    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionExpired).toBe(true)
    expectSessionStorageCleared()
  })

  it('restores a session with a valid future server expiry', () => {
    const expiresAt = new Date(NOW.getTime() + 60_000).toISOString()
    persistSession(expiresAt)

    const store = useAuthStore()
    store.restoreSession()

    expect(store.token).toBe('access-token')
    expect(store.user).toEqual(USER)
    expect(store.expiresAt).toBe(expiresAt)
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears a session whose expiry is malformed', () => {
    persistSession('not-an-instant')

    const store = useAuthStore()
    store.restoreSession()

    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionExpired).toBe(false)
    expectSessionStorageCleared()
  })

  it('automatically clears the session at the safety-adjusted expiry', () => {
    const store = useAuthStore()
    const expiresAt = new Date(NOW.getTime() + 60_000).toISOString()
    store.setSession('access-token', USER, expiresAt)

    vi.advanceTimersByTime(60_000 - SESSION_EXPIRY_SAFETY_SKEW_MS)

    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionExpired).toBe(true)
    expectSessionStorageCleared()
  })

  it('replaces the previous expiry timer when a new session is set', () => {
    const store = useAuthStore()
    const firstExpiry = new Date(NOW.getTime() + 60_000).toISOString()
    const secondExpiry = new Date(NOW.getTime() + 120_000).toISOString()

    store.setSession('first-token', USER, firstExpiry)
    store.setSession('second-token', USER, secondExpiry)
    vi.advanceTimersByTime(60_000)

    expect(store.token).toBe('second-token')
    expect(store.expiresAt).toBe(secondExpiry)
    expect(store.isAuthenticated).toBe(true)

    vi.advanceTimersByTime(60_000 - SESSION_EXPIRY_SAFETY_SKEW_MS)
    expect(store.isAuthenticated).toBe(false)
  })

  it('re-checks expiry when the tab becomes visible', () => {
    const store = useAuthStore()
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

    expect(store.isAuthenticated).toBe(false)
    expect(store.sessionExpired).toBe(true)
  })
})

function persistSession(expiresAt: string): void {
  localStorage.setItem(CONFIG.TOKEN_KEY, 'access-token')
  localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(USER))
  localStorage.setItem(CONFIG.EXPIRY_KEY, expiresAt)
}

function expectSessionStorageCleared(): void {
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
