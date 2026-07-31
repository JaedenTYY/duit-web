import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { login, register } from '@/api/generated/auth-controller/auth-controller'
import type { LoginRequest, RegisterRequest } from '@/api/generated/model'
import {
  establishSession,
  logoutSession,
} from '@/lib/sessionCoordinator'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (response) => {
      if (response.data) {
        establishSession(response.data)
      }
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (credentials: RegisterRequest) => register(credentials),
    onSuccess: (response) => {
      if (response.data) {
        establishSession(response.data)
      }
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      queryClient.clear()
    },
  })
}
