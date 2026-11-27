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

let csrf: { token: string; headerName: string } | null = null
let csrfVersion = 0

async function loadCsrf(assertCurrent?: () => void) {
  if (csrf) return csrf
  const version = csrfVersion
  const response = await transport.get<ApiResponseCsrfBootstrapResponse>('/auth/csrf')
  const token = response.data?.data?.token
  const headerName = response.data?.data?.headerName
  if (!token?.trim() || !headerName?.trim()) {
    throw new Error('CSRF bootstrap response is invalid')
  }
  assertCurrent?.()
  const headers = { token, headerName }
  if (version === csrfVersion) csrf = headers
  return headers
}

export async function refreshAccessToken(
  requestId: string,
  assertCurrent?: () => void,
): Promise<AuthResponse> {
  const { token, headerName } = await loadCsrf(assertCurrent)
  assertCurrent?.()
  const response = await transport.post<ApiResponseAuthResponse>(
    '/auth/refresh',
    undefined,
    {
      headers: {
        [headerName]: token,
        'X-Refresh-Request-ID': requestId,
      },
    }
  )
  return response.data.data
}

export async function revokeRefreshSession(assertCurrent?: () => void): Promise<void> {
  const { token, headerName } = await loadCsrf(assertCurrent)
  assertCurrent?.()
  await transport.post(
    '/auth/logout',
    undefined,
    { headers: { [headerName]: token } }
  )
}

export async function csrfRequestHeaders(): Promise<Record<string, string>> {
  const { token, headerName } = await loadCsrf()
  return { [headerName]: token }
}

export function clearCsrfToken(): void {
  csrf = null
  csrfVersion += 1
}
