import type { AuthResponse } from '@/api/generated/model'
import { useAuthStore } from '@/stores/auth'
import {
  clearCsrfToken,
  refreshAccessToken,
  revokeRefreshSession,
} from '@/lib/authTransport'

type AnonymousReason = 'logout' | 'revoked' | 'deleted'
type Lifecycle = string | null
type RefreshOperation = { tabId: string; lifecycle: Lifecycle; operationId: string }
type SessionMessage =
  | (RefreshOperation & { type: 'refresh-intent' | 'refresh-start' | 'refresh-failed' })
  | (RefreshOperation & { type: 'refresh-result'; session: AuthResponse })
  | { type: 'login'; tabId: string; lifecycle: string; session: AuthResponse }
  | { type: 'anonymous'; tabId: string; lifecycle: string; reason: AnonymousReason }

const CHANNEL_NAME = 'duit-auth-session'
const REFRESH_LOCK_NAME = 'duit-auth-refresh'
const LIFECYCLE_KEY = 'duit-auth-lifecycle'
const ELECTION_WINDOW_MS = 50
const REMOTE_REFRESH_TIMEOUT_MS = 12_000
const tabId = crypto.randomUUID()
const channel = typeof BroadcastChannel === 'undefined'
  ? null
  : new BroadcastChannel(CHANNEL_NAME)

let lifecycle: Lifecycle = localStorage.getItem(LIFECYCLE_KEY)
let refreshPromise: Promise<AuthResponse> | null = null
let bootstrapPromise: Promise<void> | null = null
let election: Map<string, RefreshOperation> | null = null
let networkRefresh: RefreshOperation | null = null
let remoteRefresh: {
  operation: RefreshOperation
  promise: Promise<AuthResponse>
  finish: (result: AuthResponse | Error) => void
} | null = null

class ObsoleteRefresh extends Error {
  constructor() {
    super('Session changed while refresh was in progress')
  }
}

channel?.addEventListener('message', (event: MessageEvent<SessionMessage>) => {
  const message = event.data
  if (!message || message.tabId === tabId ||
      message.lifecycle !== localStorage.getItem(LIFECYCLE_KEY)) return

  if (message.type === 'login') {
    if (typeof message.lifecycle !== 'string' || !message.lifecycle.startsWith('login:')) return
    if (lifecycle === message.lifecycle && useAuthStore().isAuthenticated) return
    changeLifecycle(message.lifecycle)
    applySession(message.session)
    return
  }

  if (message.type === 'anonymous') {
    if (typeof message.lifecycle !== 'string' || lifecycle === message.lifecycle ||
        !message.lifecycle.startsWith(message.reason + ':')) return
    changeLifecycle(message.lifecycle)
    finishAnonymous(message.reason)
    if (message.reason === 'deleted') redirectToPublicEntry()
    else void redirectToLoginIfProtected(message.reason === 'logout' ? 'logout' : 'session-expired')
    return
  }

  if (!isCurrentSessionLifecycle(message.lifecycle) || isTerminalLifecycle() || !message.operationId) return
  if (message.type === 'refresh-intent') {
    if (networkRefresh) post({ ...networkRefresh, type: 'refresh-start' })
    if (election && !election.has(message.tabId)) {
      election.set(message.tabId, message)
      post({ ...election.get(tabId)!, type: 'refresh-intent' })
    }
  } else if (message.type === 'refresh-start') {
    waitForRemoteRefresh(message)
  } else if (remoteRefresh && matchesOperation(remoteRefresh.operation, message)) {
    const pending = remoteRefresh
    if (message.type === 'refresh-result') {
      try {
        applySession(message.session)
        pending.finish(message.session)
      } catch (error) {
        pending.finish(error instanceof Error ? error : new Error('Invalid remote session'))
      }
    } else if (message.type === 'refresh-failed') {
      pending.finish(new Error('Refresh session is unavailable'))
      if (!refreshPromise) {
        clearCsrfToken()
        finishAnonymous('revoked')
        void redirectToLoginIfProtected('session-expired')
      }
    }
  }
})

export function getSessionLifecycle(): Lifecycle {
  return lifecycle
}

export function isCurrentSessionLifecycle(expected: Lifecycle): boolean {
  // The origin-wide marker orders transitions even when BroadcastChannel delivery is delayed.
  return expected === lifecycle && expected === localStorage.getItem(LIFECYCLE_KEY)
}

export function configureSessionLifecycle(): void {
  useAuthStore().configureRefresh(async () => {
    try {
      await refreshSessionSingleFlight()
    } catch (error) {
      if (!(error instanceof ObsoleteRefresh)) throw error
    }
  })
}

export function initializeSession(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise
  const store = useAuthStore()
  store.beginBootstrap()
  bootstrapPromise = refreshSessionSingleFlight()
    .then(() => undefined)
    .catch(() => {
      if (store.bootstrapStatus === 'loading') store.finishAnonymous('invalid')
    })
  return bootstrapPromise
}

export async function ensureSessionBootstrapped(): Promise<void> {
  if (!bootstrapPromise) initializeSession()
  await bootstrapPromise
}

export function establishSession(session: AuthResponse): void {
  const next = startLifecycle('login')
  applySession(session)
  post({ type: 'login', tabId, lifecycle: next, session })
}

export function refreshSessionSingleFlight(): Promise<AuthResponse> {
  if (!isCurrentSessionLifecycle(lifecycle) || isTerminalLifecycle()) {
    return Promise.reject(new ObsoleteRefresh())
  }
  if (refreshPromise) return refreshPromise

  const operation = { tabId, lifecycle, operationId: crypto.randomUUID() }
  const store = useAuthStore()
  const hadSession = Boolean(store.token || store.user)
  const promise = coordinateRefresh(operation)
    .then((session) => {
      assertCurrentRefresh(operation)
      return session
    })
    .catch((error: unknown) => {
      assertCurrentRefresh(operation)
      if (!(error instanceof ObsoleteRefresh)) {
        clearCsrfToken()
        store.finishAnonymous('invalid')
        if (hadSession) void redirectToLoginIfProtected('session-expired')
      }
      throw error
    })
    .finally(() => {
      if (refreshPromise === promise) refreshPromise = null
    })
  refreshPromise = promise
  return promise
}

export async function logoutSession(): Promise<{ revoked: boolean }> {
  // Capture the current CSRF headers before clearing the cache for the next session.
  const next = publishLifecycle('logout')
  const revocation = revokeRefreshSession(() => {
    if (!isCurrentSessionLifecycle(next)) throw new ObsoleteRefresh()
  })
  changeLifecycle(next)
  finishAnonymous('logout')
  post({ type: 'anonymous', tabId, lifecycle: next, reason: 'logout' })

  let revoked = true
  try {
    await revocation
  } catch {
    revoked = false
  }
  void redirectToLoginIfProtected(revoked ? 'logout' : 'logout-local', next)
  return { revoked }
}

export function propagateRevocation(): void {
  if (!isCurrentSessionLifecycle(lifecycle) || isTerminalLifecycle()) return
  endSession('revoked')
  void redirectToLoginIfProtected('session-expired')
}

export function propagateAccountDeletion(): void {
  endSession('deleted')
}

export function completeAccountDeletion(): void {
  propagateAccountDeletion()
  redirectToPublicEntry()
}

export function closeSessionCoordination(): void {
  channel?.close()
}

if (import.meta.hot) {
  import.meta.hot.dispose(closeSessionCoordination)
}

function endSession(reason: AnonymousReason): void {
  const next = startLifecycle(reason)
  finishAnonymous(reason)
  post({ type: 'anonymous', tabId, lifecycle: next, reason })
}

function startLifecycle(kind: 'login' | AnonymousReason): string {
  const next = publishLifecycle(kind)
  changeLifecycle(next)
  return next
}

function publishLifecycle(kind: 'login' | AnonymousReason): string {
  const next = kind + ':' + crypto.randomUUID()
  localStorage.setItem(LIFECYCLE_KEY, next)
  return next
}

function changeLifecycle(next: string): void {
  lifecycle = next
  refreshPromise = null
  election = null
  networkRefresh = null
  remoteRefresh?.finish(new ObsoleteRefresh())
  clearCsrfToken()
}

function isTerminalLifecycle(): boolean {
  return lifecycle !== null && !lifecycle.startsWith('login:')
}

function finishAnonymous(reason: AnonymousReason): void {
  useAuthStore().finishAnonymous(reason === 'logout' ? 'manual' : reason)
}

async function coordinateRefresh(operation: RefreshOperation): Promise<AuthResponse> {
  const store = useAuthStore()
  const versionBeforeWait = store.sessionVersion
  const locks = navigator.locks
  if (locks?.request) {
    return locks.request(REFRESH_LOCK_NAME, async () => {
      assertCurrentRefresh(operation)
      if (store.sessionVersion !== versionBeforeWait && store.isAuthenticated) {
        return currentSession()
      }
      return remoteRefresh?.promise ?? performRefresh(operation)
    })
  }

  const pending = remoteRefresh?.promise
  if (pending) return pending
  const candidates = new Map([[tabId, operation]])
  election = candidates
  post({ ...operation, type: 'refresh-intent' })
  await new Promise((resolve) => setTimeout(resolve, ELECTION_WINDOW_MS))
  assertCurrentRefresh(operation)
  if (election === candidates) election = null
  if (store.sessionVersion !== versionBeforeWait && store.isAuthenticated) {
    return currentSession()
  }
  if (remoteRefresh) return remoteRefresh.promise
  const leader = [...candidates.keys()].sort()[0]
  return leader === tabId
    ? performRefresh(operation)
    : waitForRemoteRefresh(candidates.get(leader)!)
}

async function performRefresh(operation: RefreshOperation): Promise<AuthResponse> {
  assertCurrentRefresh(operation)
  networkRefresh = operation
  post({ ...operation, type: 'refresh-start' })
  try {
    const session = await refreshAccessToken(operation.operationId, () => assertCurrentRefresh(operation))
    assertCurrentRefresh(operation)
    applySession(session)
    post({ ...operation, type: 'refresh-result', session })
    return session
  } catch (error) {
    assertCurrentRefresh(operation)
    // Report failure to peers waiting for this operation without replacing the shared login marker.
    post({ ...operation, type: 'refresh-failed' })
    throw error
  } finally {
    if (networkRefresh === operation) networkRefresh = null
  }
}

function assertCurrentRefresh(operation: RefreshOperation): void {
  if (!isCurrentSessionLifecycle(operation.lifecycle) || isTerminalLifecycle()) {
    throw new ObsoleteRefresh()
  }
}

function post(message: SessionMessage): void {
  channel?.postMessage(message)
}

function applySession(session: AuthResponse): void {
  useAuthStore().setSession(session.token, session.user, session.expiresAt)
}

function currentSession(): AuthResponse {
  const store = useAuthStore()
  if (!store.token || !store.user || !store.expiresAt) {
    throw new Error('Authenticated session is unavailable')
  }
  return { token: store.token, user: store.user, expiresAt: store.expiresAt }
}

function matchesOperation(left: RefreshOperation | undefined, right: RefreshOperation): boolean {
  return left?.lifecycle === right.lifecycle &&
    left?.tabId === right.tabId && left?.operationId === right.operationId
}

function waitForRemoteRefresh(operation: RefreshOperation): Promise<AuthResponse> {
  if (remoteRefresh && matchesOperation(remoteRefresh.operation, operation)) return remoteRefresh.promise
  remoteRefresh?.finish(new ObsoleteRefresh())

  let resolve!: (session: AuthResponse) => void
  let reject!: (error: Error) => void
  const promise = new Promise<AuthResponse>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  // A passive tab may receive a start without a caller waiting for the result.
  void promise.catch(() => undefined)
  const pending = {
    operation,
    promise,
    finish(result: AuthResponse | Error): void {
      clearTimeout(timeout)
      if (remoteRefresh === pending) remoteRefresh = null
      if (result instanceof Error) reject(result)
      else resolve(result)
    },
  }
  const timeout = setTimeout(
    () => pending.finish(new Error('Cross-tab refresh leader timed out')),
    REMOTE_REFRESH_TIMEOUT_MS,
  )
  remoteRefresh = pending
  return promise
}

function redirectToPublicEntry(): void {
  location.replace('/')
}

export async function redirectToLoginIfProtected(
  reason: 'logout' | 'logout-local' | 'session-expired',
  expected = lifecycle,
): Promise<void> {
  const { default: router } = await import('@/router')
  if (!isCurrentSessionLifecycle(expected) || useAuthStore().isAuthenticated) return
  const currentRoute = router.currentRoute.value
  const isPublicRoute = !currentRoute.name || Boolean(currentRoute.meta.hideNav) ||
    currentRoute.name === 'landing' ||
    currentRoute.name === 'login' ||
    currentRoute.name === 'register' ||
    currentRoute.name === 'guest-bill-split' ||
    currentRoute.name === 'not-found'

  if (isPublicRoute) return

  const query = reason === 'logout'
    ? undefined
    : { reason, redirect: currentRoute.fullPath }
  await router.replace({ name: 'login', query })
}
