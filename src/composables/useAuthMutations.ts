import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { login, logout, register, type LoginCredentials, type RegisterCredentials } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

export function useLoginMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: ({ token, user }) => {
      authStore.setSession(token, user)
    },
  })
}

export function useRegisterMutation() {
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
    onSuccess: ({ token, user }) => {
      authStore.setSession(token, user)
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
