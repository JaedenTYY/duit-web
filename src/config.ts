import { resolveApiBaseUrl } from '@/lib/apiBaseUrl'

export const CONFIG = {
  TOKEN_KEY: 'duit_token',
  USER_KEY: 'duit_user',
  API_BASE_URL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD),
} as const
