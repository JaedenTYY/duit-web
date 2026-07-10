import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { useTransactionStore } from '@/stores/transaction'
import { CONFIG } from '@/config'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(CONFIG.TOKEN_KEY))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function logout(): void {
    clearSession()
  }

  function restoreSession(): void {
    const storedToken = localStorage.getItem(CONFIG.TOKEN_KEY)
    const storedUser = localStorage.getItem(CONFIG.USER_KEY)
    if (storedToken && storedUser) {
      token.value = storedToken
      try {
        user.value = JSON.parse(storedUser) as User
      } catch {
        clearSession()
      }
    }
  }

  function setSession(newToken: string, newUser: User): void {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(CONFIG.TOKEN_KEY, newToken)
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(newUser))
  }

  function clearSession(): void {
    token.value = null
    user.value = null
    localStorage.removeItem(CONFIG.TOKEN_KEY)
    localStorage.removeItem(CONFIG.USER_KEY)
    useTransactionStore().reset()
  }

  return {
    token,
    user,
    isAuthenticated,
    logout,
    restoreSession,
    setSession,
    clearSession,
  }
})
