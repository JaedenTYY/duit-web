import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/auth'
import router, { authenticationGuard } from './index'

vi.mock('@/lib/sessionCoordinator', () => ({
  ensureSessionBootstrapped: vi.fn(async () => undefined),
  refreshSessionSingleFlight: vi.fn(async () => {
    throw new Error('Refresh unavailable')
  }),
}))

const USER: User = {
  id: '5e51fe8c-306d-463c-9c76-dd5368bfa5ab',
  email: 'user@example.test',
  fullName: 'Example User',
  preferredCurrency: 'MYR',
  createdAt: '2026-07-27T00:00:00.000Z',
}

describe('authenticationGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-27T00:00:00.000Z'))
    vi.stubGlobal('localStorage', createMemoryStorage())
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useAuthStore().$dispose()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not treat an expired in-memory token as authenticated', async () => {
    const store = useAuthStore()
    store.setSession(
      'access-token',
      USER,
      '2026-07-27T00:01:00.000Z'
    )
    vi.setSystemTime(new Date('2026-07-27T00:01:01.000Z'))
    const next = vi.fn()

    await authenticationGuard(
      route('/dashboard', 'dashboard', {}),
      route('/', 'landing', { hideNav: true }),
      next
    )

    expect(next).toHaveBeenCalledWith({
      name: 'login',
      query: {
        reason: 'session-expired',
        redirect: '/dashboard',
      },
    })
    expect(store.isAuthenticated).toBe(false)
  })

  it('protects privacy settings while allowing a valid in-memory session', async () => {
    const anonymousNext = vi.fn()
    await authenticationGuard(
      route('/settings/privacy', 'privacy-settings', {}),
      route('/', 'landing', { hideNav: true }),
      anonymousNext
    )
    expect(anonymousNext).toHaveBeenCalledWith({ name: 'landing' })

    useAuthStore().setSession('access-token', USER, '2026-07-27T00:15:00.000Z')
    const authenticatedNext = vi.fn()
    await authenticationGuard(
      route('/settings/privacy', 'privacy-settings', {}),
      route('/settings', 'settings', {}),
      authenticatedNext
    )
    expect(authenticatedNext).toHaveBeenCalledWith()
  })

  it('resolves unknown paths to a real not-found recovery route', () => {
    const resolved = router.resolve('/missing/deep/path')

    expect(resolved.name).toBe('not-found')
    expect(resolved.matched).toHaveLength(1)
  })
})

function route(
  fullPath: string,
  name: string,
  meta: Record<string, unknown>
): RouteLocationNormalized {
  return {
    fullPath,
    hash: '',
    matched: [],
    meta,
    name,
    params: {},
    path: fullPath,
    query: {},
    redirectedFrom: undefined,
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
