import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginView from './LoginView.vue'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  replace: vi.fn(),
  push: vi.fn(),
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
  useRoute: () => ({ name: 'login', query: {} }),
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}))

vi.mock('@/composables/useRetryAfterCooldown', () => ({
  useRetryAfterCooldown: () => ({
    active: { value: true },
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
