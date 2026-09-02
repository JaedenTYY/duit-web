import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from './LoginView.vue'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
  route: { name: 'login', query: {} as Record<string, unknown> },
  cooldownActive: { value: true },
}))

vi.mock('@/composables/useAuthMutations', () => ({
  useLoginMutation: () => ({
    isPending: { value: false },
    mutateAsync: mocks.login,
  }),
  useRegisterMutation: () => ({
    isPending: { value: false },
    mutateAsync: mocks.register,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({
    replace: mocks.replace,
    push: mocks.push,
    resolve: (target: string) => {
      const path = target.split(/[?#]/)[0]
      const knownRoutes: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/settings/privacy': 'privacy-settings',
        '/login': 'login',
        '/register': 'register',
      }
      return {
        fullPath: target,
        name: knownRoutes[path] ?? 'not-found',
        matched: knownRoutes[path] ? [{}] : [{}],
      }
    },
  }),
}))

vi.mock('@/composables/useRetryAfterCooldown', () => ({
  useRetryAfterCooldown: () => ({
    active: mocks.cooldownActive,
    remainingSeconds: { value: 2 },
    accessibleMessage: { value: 'Please wait 2 seconds before trying again.' },
    start: vi.fn(),
    clear: vi.fn(),
  }),
}))

describe('LoginView rate-limit cooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T08:00:00.000Z'))
    mocks.login.mockReset()
    mocks.register.mockReset()
    mocks.replace.mockReset()
    mocks.route.name = 'login'
    mocks.route.query = {}
    mocks.cooldownActive.value = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables login during cooldown and exposes an accessible countdown', () => {
    const wrapper = mount(LoginView)

    expect(wrapper.get('[data-testid="auth-submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[role="status"]').text()).toContain('2 seconds')
  })

})
