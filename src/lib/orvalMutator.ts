import type { AxiosRequestConfig } from 'axios'
import api from '@/lib/api'

export function orvalMutator<T>(config: AxiosRequestConfig): Promise<T> {
  return api.request<T>(config).then((response) => response.data)
}
