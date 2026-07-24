import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { logger } from '@/utils/logger'
import { CONFIG } from '@/config'

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const authStore = useAuthStore()
    
    if (error.response) {
      const { status, data } = error.response
      const { method, url } = error.config
      
      logger.error(`[API ERROR] ${method?.toUpperCase()} ${url} | Status: ${status}`, data)

      if (status === 401) {
        authStore.clearSession()
        router.push('/login')
      }
    } else if (error.request) {
      logger.error('[API ERROR] No response received:', error.request)
    } else {
      logger.error('[API ERROR] Request setup failed:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api
