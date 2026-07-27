import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/types'
import { useTransactionStore } from '@/stores/transaction'
import { CONFIG } from '@/config'

export const SESSION_EXPIRY_SAFETY_SKEW_MS = 5_000
export const MAX_TIMER_DELAY_MS = 2_147_483_647

export type SessionClearReason = 'manual' | 'expired' | 'invalid'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  const expiresAt = ref<string | null>(null)
  const sessionExpired = ref(false)
  let expiryTimer: ReturnType<typeof setTimeout> | null = null

  const isAuthenticated = computed(() => {
    const expiryMs = parseExpiry(expiresAt.value)
    return Boolean(
      token.value &&
      user.value &&
      expiryMs !== null &&
      !isExpired(expiryMs)
    )
  })

  function logout(): void {
    clearSession('manual')
  }

  function restoreSession(): void {
    const storedToken = localStorage.getItem(CONFIG.TOKEN_KEY)
    const storedUser = localStorage.getItem(CONFIG.USER_KEY)
    const storedExpiry = localStorage.getItem(CONFIG.EXPIRY_KEY)
    const expiryMs = parseExpiry(storedExpiry)

    if (!storedToken || !storedUser || expiryMs === null || isExpired(expiryMs)) {
      clearSession(expiryMs !== null && isExpired(expiryMs) ? 'expired' : 'invalid')
      return
    }

    try {
      token.value = storedToken
      user.value = JSON.parse(storedUser) as User
      expiresAt.value = new Date(expiryMs).toISOString()
      sessionExpired.value = false
      scheduleExpiry(expiryMs)
    } catch {
      clearSession('invalid')
    }
  }

  function setSession(newToken: string, newUser: User, serverExpiresAt: string): void {
    const expiryMs = parseExpiry(serverExpiresAt)
    if (!newToken || expiryMs === null || isExpired(expiryMs)) {
      clearSession(expiryMs !== null ? 'expired' : 'invalid')
      throw new Error('Server returned an invalid session expiry')
    }

    clearExpiryTimer()
    const normalizedExpiry = new Date(expiryMs).toISOString()
    token.value = newToken
    user.value = newUser
    expiresAt.value = normalizedExpiry
    sessionExpired.value = false
    localStorage.setItem(CONFIG.TOKEN_KEY, newToken)
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(newUser))
    localStorage.setItem(CONFIG.EXPIRY_KEY, normalizedExpiry)
    scheduleExpiry(expiryMs)
  }

  function ensureValidSession(): boolean {
    const expiryMs = parseExpiry(expiresAt.value)
    if (!token.value || !user.value || expiryMs === null) {
      if (token.value || user.value || expiresAt.value) clearSession('invalid')
      return false
    }
    if (isExpired(expiryMs)) {
      clearSession('expired')
      return false
    }
    return true
  }

  function clearSession(reason: SessionClearReason = 'manual'): void {
    clearExpiryTimer()
    token.value = null
    user.value = null
    expiresAt.value = null
    sessionExpired.value = reason === 'expired'
    localStorage.removeItem(CONFIG.TOKEN_KEY)
    localStorage.removeItem(CONFIG.USER_KEY)
    localStorage.removeItem(CONFIG.EXPIRY_KEY)
    useTransactionStore().reset()
  }

  function scheduleExpiry(expiryMs: number): void {
    clearExpiryTimer()
    const remainingMs = expiryMs - Date.now() - SESSION_EXPIRY_SAFETY_SKEW_MS
    if (remainingMs <= 0) {
      clearSession('expired')
      return
    }

    expiryTimer = setTimeout(() => {
      expiryTimer = null
      if (isExpired(expiryMs)) {
        clearSession('expired')
      } else {
        scheduleExpiry(expiryMs)
      }
    }, Math.min(remainingMs, MAX_TIMER_DELAY_MS))
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
    isAuthenticated,
    logout,
    restoreSession,
    setSession,
    ensureValidSession,
    clearSession,
  }
})

function parseExpiry(value: string | null): number | null {
  if (!value?.trim()) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function isExpired(expiryMs: number): boolean {
  return expiryMs <= Date.now() + SESSION_EXPIRY_SAFETY_SKEW_MS
}
