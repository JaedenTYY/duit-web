import axios from 'axios'
import { CONFIG } from '@/config'
import type {
  ApiResponseAuthResponse,
  ApiResponseCsrfBootstrapResponse,
  AuthResponse,
} from '@/api/generated/model'

const transport = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

let csrfToken: string | null = null
let csrfHeaderName = 'X-XSRF-TOKEN'

export async function ensureCsrfToken(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken
  const response = await transport.get<ApiResponseCsrfBootstrapResponse>('/auth/csrf')
  const token = response.data?.data?.token
  const headerName = response.data?.data?.headerName
  if (!token?.trim() || !headerName?.trim()) {
    throw new Error('CSRF bootstrap response is invalid')
  }
  csrfToken = token
  csrfHeaderName = headerName
  return token
}

export async function refreshAccessToken(requestId: string): Promise<AuthResponse> {
  const token = await ensureCsrfToken()
  const response = await transport.post<ApiResponseAuthResponse>(
    '/auth/refresh',
    undefined,
    {
      headers: {
        [csrfHeaderName]: token,
        'X-Refresh-Request-ID': requestId,
      },
    }
  )
  return response.data.data
}

export async function revokeRefreshSession(): Promise<void> {
  const token = await ensureCsrfToken()
  await transport.post(
    '/auth/logout',
    undefined,
    { headers: { [csrfHeaderName]: token } }
  )
  clearCsrfToken()
}

export function clearCsrfToken(): void {
  csrfToken = null
  csrfHeaderName = 'X-XSRF-TOKEN'
}
