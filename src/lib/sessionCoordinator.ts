import type { AuthResponse } from '@/api/generated/model'
import { useAuthStore } from '@/stores/auth'
import {
  clearCsrfToken,
  refreshAccessToken,
  revokeRefreshSession,
} from '@/lib/authTransport'

type SessionMessage =
  | { type: 'refresh-intent'; tabId: string }
  | { type: 'refresh-start'; tabId: string }
  | { type: 'session'; tabId: string; session: AuthResponse }
  | { type: 'anonymous'; tabId: string; reason: 'logout' | 'revoked' | 'refresh-failed' }

const CHANNEL_NAME = 'duit-auth-session'
const REFRESH_LOCK_NAME = 'duit-auth-refresh'
const ELECTION_WINDOW_MS = 50
const REMOTE_REFRESH_TIMEOUT_MS = 12_000
const tabId = crypto.randomUUID()
const channel = typeof BroadcastChannel === 'undefined'
  ? null
  : new BroadcastChannel(CHANNEL_NAME)
const candidates = new Set<string>()

let refreshPromise: Promise<AuthResponse> | null = null
let bootstrapPromise: Promise<void> | null = null
let remoteRefresh: {
  promise: Promise<AuthResponse>
  resolve: (session: AuthResponse) => void
  reject: (error: Error) => void
} | null = null

channel?.addEventListener('message', (event: MessageEvent<SessionMessage>) => {
  const message = event.data
  if (!message || message.tabId === tabId) return
  const store = useAuthStore()
  if (message.type === 'refresh-intent') {
    candidates.add(message.tabId)
  } else if (message.type === 'refresh-start') {
    ensureRemoteRefresh()
  } else if (message.type === 'session') {
    store.setSession(message.session.token, message.session.user, message.session.expiresAt)
    remoteRefresh?.resolve(message.session)
    remoteRefresh = null
  } else if (message.type === 'anonymous') {
    clearCsrfToken()
    store.finishAnonymous(message.reason === 'logout' ? 'manual' : 'revoked')
    remoteRefresh?.reject(new Error('Refresh session is unavailable'))
    remoteRefresh = null
  }
})

export function configureSessionLifecycle(): void {
  useAuthStore().configureRefresh(async () => {
    await refreshSessionSingleFlight()
  })
}

export function initializeSession(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise
  const store = useAuthStore()
  store.beginBootstrap()
  bootstrapPromise = refreshSessionSingleFlight()
    .then(() => undefined)
    .catch(() => {
      store.finishAnonymous('invalid')
    })
  return bootstrapPromise
}

export async function ensureSessionBootstrapped(): Promise<void> {
  if (!bootstrapPromise) initializeSession()
  await bootstrapPromise
}

export function establishSession(session: AuthResponse): void {
  applySession(session, true)
}

export function refreshSessionSingleFlight(): Promise<AuthResponse> {
  if (refreshPromise) return refreshPromise
  refreshPromise = coordinateRefresh()
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export async function logoutSession(): Promise<void> {
  try {
    await revokeRefreshSession()
  } finally {
    const store = useAuthStore()
    store.finishAnonymous('manual')
    channel?.postMessage({ type: 'anonymous', tabId, reason: 'logout' } satisfies SessionMessage)
  }
}

export function propagateRevocation(): void {
  clearCsrfToken()
  useAuthStore().finishAnonymous('revoked')
  channel?.postMessage({ type: 'anonymous', tabId, reason: 'revoked' } satisfies SessionMessage)
}

export function closeSessionCoordination(): void {
  channel?.close()
}

if (import.meta.hot) {
  import.meta.hot.dispose(closeSessionCoordination)
}

async function coordinateRefresh(): Promise<AuthResponse> {
  const locks = navigator.locks
  if (locks?.request) {
    const versionBeforeWait = useAuthStore().sessionVersion
    return locks.request(REFRESH_LOCK_NAME, async () => {
      const store = useAuthStore()
      if (store.sessionVersion !== versionBeforeWait && store.isAuthenticated) {
        return currentSession()
      }
      return performRefresh()
    })
  }
  return electAndRefresh()
}

async function electAndRefresh(): Promise<AuthResponse> {
  if (remoteRefresh) return withTimeout(remoteRefresh.promise)
  const versionBeforeElection = useAuthStore().sessionVersion
  candidates.clear()
  candidates.add(tabId)
  channel?.postMessage({ type: 'refresh-intent', tabId } satisfies SessionMessage)
  await delay(ELECTION_WINDOW_MS)
  const leader = [...candidates].sort()[0]
  if (leader !== tabId) {
    const store = useAuthStore()
    if (store.sessionVersion !== versionBeforeElection && store.isAuthenticated) {
      return currentSession()
    }
    return withTimeout(ensureRemoteRefresh().promise)
  }
  return performRefresh()
}

async function performRefresh(): Promise<AuthResponse> {
  channel?.postMessage({ type: 'refresh-start', tabId } satisfies SessionMessage)
  try {
    const session = await refreshAccessToken(crypto.randomUUID())
    applySession(session, true)
    return session
  } catch (error) {
    clearCsrfToken()
    useAuthStore().finishAnonymous('invalid')
    channel?.postMessage({
      type: 'anonymous',
      tabId,
      reason: 'refresh-failed',
    } satisfies SessionMessage)
    throw error
  }
}

function applySession(session: AuthResponse, broadcast: boolean): void {
  useAuthStore().setSession(session.token, session.user, session.expiresAt)
  if (broadcast) {
    channel?.postMessage({ type: 'session', tabId, session } satisfies SessionMessage)
  }
}

function currentSession(): AuthResponse {
  const store = useAuthStore()
  if (!store.token || !store.user || !store.expiresAt) {
    throw new Error('Authenticated session is unavailable')
  }
  return {
    token: store.token,
    user: store.user,
    expiresAt: store.expiresAt,
  }
}

function ensureRemoteRefresh() {
  if (remoteRefresh) return remoteRefresh
  let resolve!: (session: AuthResponse) => void
  let reject!: (error: Error) => void
  const promise = new Promise<AuthResponse>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  remoteRefresh = { promise, resolve, reject }
  return remoteRefresh
}

async function withTimeout(promise: Promise<AuthResponse>): Promise<AuthResponse> {
  return Promise.race([
    promise,
    delay(REMOTE_REFRESH_TIMEOUT_MS).then(() => {
      remoteRefresh = null
      throw new Error('Cross-tab refresh leader timed out')
    }),
  ])
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
