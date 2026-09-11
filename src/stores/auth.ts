import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types'
import { resetUserScopedFrontendState, type UserScopedResetReason } from '@/stores/resetUserScopedState'
import { CONFIG } from '@/config'

export const SESSION_EXPIRY_SAFETY_SKEW_MS = 5_000
export const MAX_TIMER_DELAY_MS = 2_147_483_647

export type SessionClearReason = 'manual' | 'expired' | 'invalid' | 'revoked' | 'deleted'
export type SessionBootstrapStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous'

type RefreshHandler = () => Promise<void>

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const expiresAt = ref<string | null>(null)
  const sessionExpired = ref(false)
  const bootstrapStatus = ref<SessionBootstrapStatus>('unknown')
  const sessionVersion = ref(0)
  let expiryTimer: ReturnType<typeof setTimeout> | null = null
  let refreshHandler: RefreshHandler | null = null
  let expiryRefresh: Promise<void> | null = null
  let lastAuthenticatedUserId: string | null = null

  removeLegacyPersistedSession()

  const isAuthenticated = computed(() => {
    const expiryMs = parseExpiry(expiresAt.value)
    return Boolean(
      token.value &&
      user.value &&
      expiryMs !== null &&
      !isExpired(expiryMs)
    )
  })

  function configureRefresh(handler: RefreshHandler): void {
    refreshHandler = handler
  }

  function beginBootstrap(): void {
    bootstrapStatus.value = 'loading'
  }

  function finishAnonymous(reason: SessionClearReason = 'invalid'): void {
    clearSession(reason)
    bootstrapStatus.value = 'anonymous'
  }

  function setSession(newToken: string, newUser: User, serverExpiresAt: string): void {
    const expiryMs = parseExpiry(serverExpiresAt)
    if (!newToken || expiryMs === null || isExpired(expiryMs)) {
      finishAnonymous(expiryMs !== null ? 'expired' : 'invalid')
      throw new Error('Server returned an invalid session expiry')
    }

    const currentUserId = user.value?.id ?? null
    const hasCurrentUserIdentity = Boolean(currentUserId)
    const userChanged = Boolean(currentUserId && currentUserId !== newUser.id)
    if (!hasCurrentUserIdentity || userChanged) {
      resetUserScopedFrontendState(userChanged ? 'user-switch' : 'login')
    }

    clearExpiryTimer()
    token.value = newToken
    user.value = newUser
    lastAuthenticatedUserId = newUser.id
    expiresAt.value = new Date(expiryMs).toISOString()
    sessionExpired.value = false
    bootstrapStatus.value = 'authenticated'
    sessionVersion.value += 1
    scheduleExpiry(expiryMs)
  }

  function ensureValidSession(): boolean {
    const expiryMs = parseExpiry(expiresAt.value)
    if (!token.value || !user.value || expiryMs === null) {
      if (token.value || user.value || expiresAt.value) clearSession('invalid')
      return false
    }
    if (isExpired(expiryMs)) {
      triggerExpiryRefresh()
      return false
    }
    return true
  }

  function clearSession(reason: SessionClearReason = 'manual'): void {
    const resetReason = userScopedResetReason(reason)
    clearExpiryTimer()
    token.value = null
    user.value = null
    expiresAt.value = null
    sessionExpired.value = reason === 'expired' || reason === 'revoked'
    sessionVersion.value += 1
    resetUserScopedFrontendState(resetReason)
  }

  function scheduleExpiry(expiryMs: number): void {
    clearExpiryTimer()
    const remainingMs = expiryMs - Date.now() - SESSION_EXPIRY_SAFETY_SKEW_MS
    if (remainingMs <= 0) {
      triggerExpiryRefresh()
      return
    }

    expiryTimer = setTimeout(() => {
      expiryTimer = null
      if (isExpired(expiryMs)) {
        triggerExpiryRefresh()
      } else {
        scheduleExpiry(expiryMs)
      }
    }, Math.min(remainingMs, MAX_TIMER_DELAY_MS))
  }

  function triggerExpiryRefresh(): void {
    if (expiryRefresh || !refreshHandler) {
      if (!refreshHandler) finishAnonymous('expired')
      return
    }
    expiryRefresh = refreshHandler()
      .catch(() => {
        finishAnonymous('expired')
      })
      .finally(() => {
        expiryRefresh = null
      })
  }

  function clearExpiryTimer(): void {
    if (expiryTimer !== null) {
      clearTimeout(expiryTimer)
      expiryTimer = null
    }
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      ensureValidSession()
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
  onScopeDispose(() => {
    clearExpiryTimer()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return {
    token,
    user,
    expiresAt,
    sessionExpired,
    bootstrapStatus,
    sessionVersion,
    isAuthenticated,
    configureRefresh,
    beginBootstrap,
    finishAnonymous,
    setSession,
    ensureValidSession,
    clearSession,
  }
})

function userScopedResetReason(reason: SessionClearReason): UserScopedResetReason {
  if (reason === 'manual') return 'logout'
  if (reason === 'expired' || reason === 'invalid') return 'refresh-failed'
  if (reason === 'deleted') return 'account-deleted'
  return 'revoked'
}

function parseExpiry(value: string | null): number | null {
  if (!value?.trim()) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function isExpired(expiryMs: number): boolean {
  return expiryMs <= Date.now() + SESSION_EXPIRY_SAFETY_SKEW_MS
}

function removeLegacyPersistedSession(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(CONFIG.TOKEN_KEY)
  localStorage.removeItem(CONFIG.USER_KEY)
  localStorage.removeItem(CONFIG.EXPIRY_KEY)
}
