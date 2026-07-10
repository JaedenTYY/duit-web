import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { login, logout, register } from '@/api/generated/auth-controller/auth-controller'
import type { LoginRequest, RegisterRequest } from '@/api/generated/model'
import { useAuthStore } from '@/stores/auth'

export function useLoginMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (response) => {
      if (response.data) {
        authStore.setSession(response.data.token, response.data.user)
      }
    },
  })
}

export function useRegisterMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (credentials: RegisterRequest) => register(credentials),
    onSuccess: (response) => {
      if (response.data) {
        authStore.setSession(response.data.token, response.data.user)
      }
    },
  })
}

export function useLogoutMutation() {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      authStore.clearSession()
      queryClient.clear()
    },
  })
}
