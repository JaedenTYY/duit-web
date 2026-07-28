import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { logger } from '@/utils/logger'
import { CONFIG } from '@/config'
import { extractApiFailure } from '@/lib/apiError'

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token ?? localStorage.getItem(CONFIG.TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export function processApiFailure(error: unknown): void {
  const authStore = useAuthStore()
  const failure = extractApiFailure(error)
  const request = isRecord(error) && isRecord(error.config) ? error.config : null
  const method = typeof request?.method === 'string' ? request.method.toUpperCase() : 'UNKNOWN'

  logger.error(
    `[API ERROR] ${method} request | Status: ${failure.status ?? 'unavailable'} | Reference ID: ${failure.requestId ?? 'unavailable'}`
  )

  if (failure.status === 401) {
    const hadSession = Boolean(
      authStore.token || localStorage.getItem(CONFIG.TOKEN_KEY)
    )
    authStore.clearSession(hadSession ? 'expired' : 'invalid')

    const currentRoute = router.currentRoute.value
    const isPublicRoute = Boolean(currentRoute.meta.hideNav) ||
      currentRoute.name === 'landing' ||
      currentRoute.name === 'login' ||
      currentRoute.name === 'register' ||
      currentRoute.name === 'guest-bill-split'
    if (hadSession && !isPublicRoute) {
      void router.replace({
        name: 'login',
        query: {
          reason: 'session-expired',
          redirect: currentRoute.fullPath,
        },
      })
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    processApiFailure(error)
    return Promise.reject(error)
  }
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export default api
