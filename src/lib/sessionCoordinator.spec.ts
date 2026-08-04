import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthResponse } from '@/api/generated/model'

const transportMock = vi.hoisted(() => ({
  clearCsrfToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  revokeRefreshSession: vi.fn(),
}))

vi.mock('@/lib/authTransport', () => transportMock)

const SESSION: AuthResponse = {
  token: 'memory-access-token',
  expiresAt: '2026-07-31T00:15:00.000Z',
  user: {
    id: '5e51fe8c-306d-463c-9c76-dd5368bfa5ab',
    email: 'user@example.test',
    fullName: 'Example User',
    preferredCurrency: 'MYR',
    createdAt: '2026-07-31T00:00:00.000Z',
  },
}

describe('session refresh coordination', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-31T00:00:00.000Z'))
    vi.clearAllMocks()
    vi.resetModules()
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', createMemoryStorage())
    vi.stubGlobal('sessionStorage', createMemoryStorage())
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    vi.stubGlobal('location', { replace: vi.fn() })
    vi.stubGlobal('navigator', {
      locks: {
        request: (_name: string, callback: () => Promise<AuthResponse>) => callback(),
      },
    })
    transportMock.refreshAccessToken.mockResolvedValue(SESSION)
    transportMock.revokeRefreshSession.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    const coordinator = await import('./sessionCoordinator')
    coordinator.closeSessionCoordination()
    FakeBroadcastChannel.reset()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('restores an authenticated in-memory session during bootstrap', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')

    await coordinator.initializeSession()

    expect(transportMock.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(useAuthStore().token).toBe(SESSION.token)
    expect(useAuthStore().bootstrapStatus).toBe('authenticated')
  })

  it('uses one in-flight refresh promise per tab', async () => {
    let resolveRefresh!: (session: AuthResponse) => void
    transportMock.refreshAccessToken.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )
    const coordinator = await import('./sessionCoordinator')

    const first = coordinator.refreshSessionSingleFlight()
    const second = coordinator.refreshSessionSingleFlight()
    resolveRefresh(SESSION)

    await expect(Promise.all([first, second])).resolves.toEqual([SESSION, SESSION])
    expect(transportMock.refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('clears session state when refresh fails without looping', async () => {
    transportMock.refreshAccessToken.mockRejectedValue(new Error('unavailable'))
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')

    await expect(coordinator.refreshSessionSingleFlight()).rejects.toThrow('unavailable')

    expect(transportMock.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(useAuthStore().bootstrapStatus).toBe('anonymous')
    expect(transportMock.clearCsrfToken).toHaveBeenCalledTimes(1)
  })

  it('propagates logout without persisting either token', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    await coordinator.logoutSession()

    expect(transportMock.revokeRefreshSession).toHaveBeenCalledTimes(1)
    expect(store.token).toBeNull()
    expect(FakeBroadcastChannel.messages).toContainEqual(
      expect.objectContaining({ type: 'anonymous', reason: 'logout' })
    )
  })

  it('accepts a successful refresh from another tab in memory only', async () => {
    await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')

    FakeBroadcastChannel.emitExternal({
      type: 'session',
      tabId: 'other-tab',
      session: SESSION,
    })

    expect(useAuthStore().token).toBe(SESSION.token)
    expect(useAuthStore().isAuthenticated).toBe(true)
    expect(localStorage.getItem('duit_token')).toBeNull()
    expect(sessionStorage.getItem('duit_token')).toBeNull()
  })

  it('propagates family revocation from another tab immediately', async () => {
    await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    FakeBroadcastChannel.emitExternal({
      type: 'anonymous',
      tabId: 'other-tab',
      reason: 'revoked',
    })

    expect(store.token).toBeNull()
    expect(store.sessionExpired).toBe(true)
    expect(transportMock.clearCsrfToken).toHaveBeenCalled()
  })

  it('broadcasts account deletion without password token or request data', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    coordinator.propagateAccountDeletion()

    expect(store.token).toBeNull()
    expect(transportMock.clearCsrfToken).toHaveBeenCalled()
    const message = FakeBroadcastChannel.messages.at(-1)
    expect(message).toEqual(expect.objectContaining({ type: 'anonymous', reason: 'deleted' }))
    expect(JSON.stringify(message)).not.toContain(SESSION.token)
    expect(JSON.stringify(message)).not.toContain('password')
  })

  it('does not let a stale tab restore a deleted account from session messages', async () => {
    await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    FakeBroadcastChannel.emitExternal({
      type: 'anonymous',
      tabId: 'deleting-tab',
      reason: 'deleted',
    })
    FakeBroadcastChannel.emitExternal({
      type: 'session',
      tabId: 'stale-refresh-tab',
      session: SESSION,
    })

    expect(store.token).toBeNull()
    expect(transportMock.clearCsrfToken).toHaveBeenCalled()
    expect(location.replace).toHaveBeenCalledWith('/')
  })

  it('discards a refresh response that completes after account deletion', async () => {
    let resolveRefresh!: (session: AuthResponse) => void
    transportMock.refreshAccessToken.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const refresh = coordinator.refreshSessionSingleFlight()

    FakeBroadcastChannel.emitExternal({
      type: 'anonymous',
      tabId: 'deleting-tab',
      reason: 'deleted',
    })
    resolveRefresh(SESSION)

    await expect(refresh).rejects.toThrow('Session changed while refresh was in progress')
    expect(useAuthStore().token).toBeNull()
  })
})

class FakeBroadcastChannel {
  static messages: unknown[] = []
  private static instances = new Set<FakeBroadcastChannel>()
  private listener: ((event: MessageEvent) => void) | null = null

  constructor(_name: string) {
    FakeBroadcastChannel.instances.add(this)
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void): void {
    this.listener = listener
  }

  postMessage(message: unknown): void {
    FakeBroadcastChannel.messages.push(message)
    for (const instance of FakeBroadcastChannel.instances) {
      if (instance !== this) {
        instance.listener?.({ data: message } as MessageEvent)
      }
    }
  }

  close(): void {
    FakeBroadcastChannel.instances.delete(this)
  }

  static reset(): void {
    FakeBroadcastChannel.instances.clear()
    FakeBroadcastChannel.messages = []
  }

  static emitExternal(message: unknown): void {
    for (const instance of FakeBroadcastChannel.instances) {
      instance.listener?.({ data: message } as MessageEvent)
    }
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
