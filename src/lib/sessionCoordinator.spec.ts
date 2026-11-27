import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthResponse } from '@/api/generated/model'

const transportMock = vi.hoisted(() => ({
  clearCsrfToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  revokeRefreshSession: vi.fn(),
}))
const routerMock = vi.hoisted(() => ({
  replace: vi.fn(async () => undefined),
  currentRoute: {
    value: {
      name: 'settings',
      fullPath: '/settings',
      meta: {},
    },
  },
}))

vi.mock('@/lib/authTransport', () => transportMock)
vi.mock('@/router', () => ({ default: routerMock }))

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
    routerMock.replace.mockResolvedValue(undefined)
    routerMock.currentRoute.value = {
      name: 'settings',
      fullPath: '/settings',
      meta: {},
    }
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

  it('invalidates pending refresh at the start of logout', async () => {
    const refreshResponse = deferred<AuthResponse>()
    const revocation = deferred<void>()
    transportMock.refreshAccessToken.mockReturnValue(refreshResponse.promise)
    transportMock.revokeRefreshSession.mockReturnValue(revocation.promise)
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    coordinator.establishSession(SESSION)

    const refresh = coordinator.refreshSessionSingleFlight().catch(() => null)
    const logout = coordinator.logoutSession()
    refreshResponse.resolve({ ...SESSION, token: 'obsolete-token' })
    await refresh
    const tokenWhileRevocationPending = useAuthStore().token
    revocation.resolve()
    await logout

    expect(tokenWhileRevocationPending).toBeNull()
  })

  it('does not restore a locally revoked session', async () => {
    const response = deferred<AuthResponse>()
    transportMock.refreshAccessToken.mockReturnValue(response.promise)
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const refresh = coordinator.refreshSessionSingleFlight().catch(() => null)

    coordinator.propagateRevocation()
    response.resolve(SESSION)
    await refresh

    expect(useAuthStore().token).toBeNull()
  })

  it.each(['resolved', 'rejected'] as const)(
    'does not clear the new login when an old refresh is %s',
    async (outcome) => {
      const response = deferred<AuthResponse>()
      transportMock.refreshAccessToken.mockReturnValue(response.promise)
      const coordinator = await import('./sessionCoordinator')
      const { useAuthStore } = await import('@/stores/auth')
      const refresh = coordinator.refreshSessionSingleFlight().catch(() => null)
      coordinator.establishSession({ ...SESSION, token: 'new-login-token' })
      transportMock.clearCsrfToken.mockClear()
      FakeBroadcastChannel.messages.length = 0

      if (outcome === 'resolved') response.resolve(SESSION)
      else response.reject(new Error('refresh rejected'))
      await refresh

      expect(useAuthStore().token).toBe('new-login-token')
      expect(transportMock.clearCsrfToken).not.toHaveBeenCalled()
      expect(FakeBroadcastChannel.messages).toEqual([])
      expect(routerMock.replace).not.toHaveBeenCalled()
    }
  )

  it.each(['Web Lock', 'election'] as const)('does not start refresh after revocation while waiting for %s', async (mode) => {
    const release = deferred<void>()
    vi.stubGlobal('navigator', mode === 'Web Lock' ? {
      locks: {
        request: async (_name: string, callback: () => Promise<AuthResponse>) => {
          await release.promise
          return callback()
        },
      },
    } : {})
    const coordinator = await import('./sessionCoordinator')
    const refresh = coordinator.refreshSessionSingleFlight().catch(() => null)
    coordinator.propagateRevocation()

    release.resolve()
    await vi.advanceTimersByTimeAsync(50)
    await refresh

    expect(transportMock.refreshAccessToken).not.toHaveBeenCalled()
  })

  it('keeps a remote refresh waiter through the preceding operation timeout', async () => {
    vi.stubGlobal('navigator', {})
    const coordinator = await import('./sessionCoordinator')
    remoteStart('peer-1')
    const first = coordinator.refreshSessionSingleFlight()
    remoteResult('peer-1')
    await first

    await vi.advanceTimersByTimeAsync(6_000)
    remoteStart('peer-2')
    const second = coordinator.refreshSessionSingleFlight().catch(() => null)
    await vi.advanceTimersByTimeAsync(6_000)
    remoteResult('peer-2')
    await vi.advanceTimersByTimeAsync(6_000)

    await expect(second).resolves.toEqual(SESSION)
  })

  it('ignores delayed refresh and session messages from before cross-tab logout', async () => {
    const response = deferred<AuthResponse>()
    transportMock.refreshAccessToken.mockReturnValue(response.promise)
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const refresh = coordinator.refreshSessionSingleFlight().catch(() => null)

    remoteStart('other-tab')
    terminalMessage('logout')
    remoteResult('other-tab')
    response.resolve(SESSION)
    await refresh

    expect(useAuthStore().token).toBeNull()
  })

  it('accepts a new cross-tab login and ignores delayed messages from the preceding lifecycle', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    remoteStart('refresh-peer')
    terminalMessage('logout')

    const next = { ...SESSION, token: 'new-peer-login' }
    localStorage.setItem('duit-auth-lifecycle', 'login:next')
    FakeBroadcastChannel.emitExternal({
      type: 'login', tabId: 'login-peer', lifecycle: 'login:next', session: next,
    })
    FakeBroadcastChannel.emitExternal({
      type: 'anonymous', tabId: 'terminal-tab', lifecycle: 'logout:remote-transition', reason: 'logout',
    })
    remoteResult('refresh-peer')
    remoteResult('uncorrelated-peer', 'login:next')

    expect(store.token).toBe(next.token)
    expect(coordinator.getSessionLifecycle()).toBe('login:next')
    expect(routerMock.replace).not.toHaveBeenCalled()
  })

  it('does not let an obsolete promise detach a newer single-flight refresh', async () => {
    const oldResponse = deferred<AuthResponse>()
    const newResponse = deferred<AuthResponse>()
    transportMock.refreshAccessToken
      .mockReturnValueOnce(oldResponse.promise)
      .mockReturnValueOnce(newResponse.promise)
    const coordinator = await import('./sessionCoordinator')
    const oldRefresh = coordinator.refreshSessionSingleFlight().catch(() => null)
    coordinator.establishSession({ ...SESSION, token: 'new-login' })
    const newRefresh = coordinator.refreshSessionSingleFlight()

    oldResponse.resolve(SESSION)
    await oldRefresh
    const concurrent = coordinator.refreshSessionSingleFlight()
    newResponse.resolve({ ...SESSION, token: 'new-refresh' })

    expect(concurrent).toBe(newRefresh)
    await expect(concurrent).resolves.toMatchObject({ token: 'new-refresh' })
    expect(transportMock.refreshAccessToken).toHaveBeenCalledTimes(2)
  })

  it('clears session state when refresh fails without looping', async () => {
    transportMock.refreshAccessToken.mockRejectedValue(new Error('unavailable'))
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    useAuthStore().setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    await expect(coordinator.refreshSessionSingleFlight()).rejects.toThrow('unavailable')

    expect(transportMock.refreshAccessToken).toHaveBeenCalledTimes(1)
    expect(useAuthStore().bootstrapStatus).toBe('anonymous')
    expect(transportMock.clearCsrfToken).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith({
        name: 'login',
        query: {
          reason: 'session-expired',
          redirect: '/settings',
        },
      })
    })
  })

  it('clears a peer session only for the matching refresh failure and leaves the login marker intact', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    coordinator.establishSession(SESSION)
    const lifecycle = coordinator.getSessionLifecycle()
    remoteStart('refresh-peer', lifecycle)

    FakeBroadcastChannel.emitExternal({
      type: 'refresh-failed', tabId: 'older-peer', lifecycle, operationId: 'older-peer',
    })
    expect(useAuthStore().token).toBe(SESSION.token)
    FakeBroadcastChannel.emitExternal({
      type: 'refresh-failed', tabId: 'refresh-peer', lifecycle, operationId: 'refresh-peer',
    })

    expect(useAuthStore().token).toBeNull()
    expect(localStorage.getItem('duit-auth-lifecycle')).toBe(lifecycle)
  })

  it('propagates logout without persisting either token', async () => {
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    await expect(coordinator.logoutSession()).resolves.toEqual({ revoked: true })

    expect(transportMock.revokeRefreshSession).toHaveBeenCalledTimes(1)
    expect(store.token).toBeNull()
    expect(FakeBroadcastChannel.messages).toContainEqual(
      expect.objectContaining({ type: 'anonymous', reason: 'logout' })
    )
  })

  it('terminates local UI session even when logout revoke fails', async () => {
    transportMock.revokeRefreshSession.mockRejectedValueOnce(new Error('revoke failed'))
    const coordinator = await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')
    const store = useAuthStore()
    store.setSession(SESSION.token, SESSION.user, SESSION.expiresAt)

    await expect(coordinator.logoutSession()).resolves.toEqual({ revoked: false })

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith({
        name: 'login',
        query: {
          reason: 'logout-local',
          redirect: '/settings',
        },
      })
    })
  })

  it('accepts a successful refresh from another tab in memory only', async () => {
    await import('./sessionCoordinator')
    const { useAuthStore } = await import('@/stores/auth')

    remoteStart('other-tab')
    remoteResult('other-tab')

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

    terminalMessage('revoked')

    expect(store.token).toBeNull()
    expect(store.sessionExpired).toBe(true)
    expect(transportMock.clearCsrfToken).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledTimes(1)
    })
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

    terminalMessage('deleted')
    remoteStart('stale-refresh-tab')
    remoteResult('stale-refresh-tab')

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

    terminalMessage('deleted')
    resolveRefresh(SESSION)

    await expect(refresh).rejects.toThrow('Session changed while refresh was in progress')
    expect(useAuthStore().token).toBeNull()
  })
})

function terminalMessage(reason: 'logout' | 'revoked' | 'deleted') {
  const lifecycle = reason + ':remote-transition'
  localStorage.setItem('duit-auth-lifecycle', lifecycle)
  FakeBroadcastChannel.emitExternal({ type: 'anonymous', tabId: 'terminal-tab', lifecycle, reason })
}

function remoteStart(tabId: string, lifecycle: string | null = null) {
  FakeBroadcastChannel.emitExternal({ type: 'refresh-start', tabId, lifecycle, operationId: tabId })
}

function remoteResult(tabId: string, lifecycle: string | null = null) {
  FakeBroadcastChannel.emitExternal({
    type: 'refresh-result', tabId, lifecycle, operationId: tabId, session: SESSION,
  })
}

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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}
