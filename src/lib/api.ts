import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { logger } from '@/utils/logger'
import { CONFIG } from '@/config'
import { extractApiFailure } from '@/lib/apiError'
import {
  propagateRevocation,
  refreshSessionSingleFlight,
} from '@/lib/sessionCoordinator'

interface DuitRequestConfig extends InternalAxiosRequestConfig {
  _duitAuthRetried?: boolean
  _duitReplayable?: boolean
}

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    if (!targetsTrustedApiOrigin(config)) {
      return Promise.reject(new Error('Refusing credentialed request to an untrusted origin'))
    }
    config.withCredentials = true
    const duitConfig = config as DuitRequestConfig
    duitConfig._duitReplayable ??= hasReusableBody(duitConfig)
    const token = useAuthStore().token
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
    const hadSession = Boolean(authStore.token || authStore.user)
    propagateRevocation()

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
  async (error: AxiosError) => {
    const failure = extractApiFailure(error)
    const request = error.config as DuitRequestConfig | undefined
    if (shouldRefresh(request, failure.status, failure.code)) {
      request!._duitAuthRetried = true
      try {
        const session = await refreshSessionSingleFlight()
        if (isSafelyReplayable(request!)) {
          request!.headers.Authorization = `Bearer ${session.token}`
          return api.request(request!)
        }
      } catch {
        processApiFailure(error)
      }
    } else {
      processApiFailure(error)
    }
    return Promise.reject(error)
  }
)

function shouldRefresh(
  request: DuitRequestConfig | undefined,
  status: number | null,
  code: string | null
): boolean {
  if (!request || request._duitAuthRetried || status !== 401 || code !== 'ERR_AUTH_001') {
    return false
  }
  const path = request.url ?? ''
  return !isRefreshExcluded(path)
}

function isRefreshExcluded(path: string): boolean {
  return [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/csrf',
    '/actuator/health',
    '/guest/bills/',
  ].some((excluded) => path === excluded || path.startsWith(excluded))
}

function isSafelyReplayable(request: DuitRequestConfig): boolean {
  if (request.signal?.aborted) return false
  return request._duitReplayable ?? hasReusableBody(request)
}

function hasReusableBody(request: DuitRequestConfig): boolean {
  const method = request.method?.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true
  const body = request.data
  if (body == null || typeof body === 'string') return true
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false
  return isRecord(body) || Array.isArray(body)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function targetsTrustedApiOrigin(config: InternalAxiosRequestConfig): boolean {
  const browserOrigin = typeof window === 'undefined'
    ? 'http://localhost'
    : window.location.origin
  const trusted = new URL(CONFIG.API_BASE_URL, browserOrigin)
  const requestBase = new URL(config.baseURL ?? trusted.toString(), browserOrigin)
  const requested = new URL(config.url ?? '', requestBase)
  return requested.origin === trusted.origin
}

export default api
