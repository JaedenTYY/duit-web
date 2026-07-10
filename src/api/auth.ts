import api from '@/lib/api'
import type { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  fullName: string
}

export interface AuthSession {
  token: string
  user: User
  expiresAt: string
}

interface AuthApiResponse {
  data: AuthSession
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await api.post<AuthApiResponse>('/auth/login', credentials)
  return response.data.data
}

export async function register(credentials: RegisterCredentials): Promise<AuthSession> {
  const response = await api.post<AuthApiResponse>('/auth/register', credentials)
  return response.data.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
