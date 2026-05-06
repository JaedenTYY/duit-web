import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import api from '@/lib/api'
import { logger } from '@/utils/logger'
import { useTransactionStore } from '@/stores/transaction'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  fullName: string
}

interface AuthApiResponse {
  data: {
    token: string
    user: User
    expiresAt: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('duit_token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function register(credentials: RegisterCredentials): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<AuthApiResponse>('/auth/register', credentials)
      const { token: newToken, user: newUser } = response.data.data
      _setSession(newToken, newUser)
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<AuthApiResponse>('/auth/login', credentials)
      const { token: newToken, user: newUser } = response.data.data
      _setSession(newToken, newUser)
      logger.log('Login successful for', newUser.email)
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch {
      // Always clear local session even if API call fails
    } finally {
      _clearSession()
      useTransactionStore().reset()
    }
  }

  function restoreSession(): void {
    const storedToken = localStorage.getItem('duit_token')
    const storedUser = localStorage.getItem('duit_user')
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser) as User
      } catch {
        _clearSession()
      }
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  function _setSession(newToken: string, newUser: User): void {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('duit_token', newToken)
    localStorage.setItem('duit_user', JSON.stringify(newUser))
  }

  function _clearSession(): void {
    token.value = null
    user.value = null
    localStorage.removeItem('duit_token')
    localStorage.removeItem('duit_user')
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
    }
    return 'An unexpected error occurred'
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    restoreSession,
  }
})
