import { resolveApiBaseUrl } from '@/lib/apiBaseUrl'

export const CONFIG = {
  // Legacy keys are removal-only. Authentication must never read or write them.
  TOKEN_KEY: 'duit_token',
  USER_KEY: 'duit_user',
  EXPIRY_KEY: 'duit_expires_at',
  API_BASE_URL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD),
} as const
