import { flushPromises, mount } from '@vue/test-utils'
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

describe('LoginView validation and submission', () => {
  beforeEach(() => {
    vi.useRealTimers()
    mocks.login.mockReset()
    mocks.register.mockReset()
    mocks.replace.mockReset()
    mocks.route.name = 'login'
    mocks.route.query = {}
    mocks.cooldownActive.value = false
  })

  async function submit(email: string, password: string, fullName?: string) {
    const wrapper = mount(LoginView)
    if (fullName !== undefined) await wrapper.get('input[type="text"]').setValue(fullName)
    await wrapper.get('input[type="email"]').setValue(email)
    await wrapper.get('input[type="password"]').setValue(password)
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.get('[data-testid="auth-submit"]').attributes('disabled')).toBeUndefined()
      expect(mocks.login.mock.calls.length + mocks.register.mock.calls.length + wrapper.findAll('.auth-error').length).toBeGreaterThan(0)
    })
    await flushPromises()
    return wrapper
  }

  it('submits a valid login and keeps the safe redirect', async () => {
    mocks.route.query = { redirect: '/settings/privacy' }
    mocks.login.mockResolvedValue({})
    await submit('aina+duit@example.com', 'x')
    expect(mocks.login).toHaveBeenCalledWith({ email: 'aina+duit@example.com', password: 'x' })
    expect(mocks.replace).toHaveBeenCalledWith('/settings/privacy')
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it.each(['', 'not-an-email', '.aina@example.com', 'aina..rahman@example.com', 'aina@example'])('rejects invalid email %j with the existing message', async email => {
    const wrapper = await submit(email, 'password')
    expect(wrapper.text()).toContain('Enter a valid email address.')
    expect(wrapper.get('input[type="email"]').attributes('aria-invalid')).toBe('true')
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('requires a login password', async () => {
    const wrapper = await submit('aina@example.com', '')
    expect(wrapper.text()).toContain('Password is required.')
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('preserves registration name and password constraints', async () => {
    mocks.route.name = 'register'
    const wrapper = await submit('aina@example.com', '1234567', 'A')
    expect(wrapper.text()).toContain('Full name must be at least 2 characters.')
    expect(wrapper.text()).toContain('Password must be at least 8 characters.')
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('submits registration at the existing minimum lengths', async () => {
    mocks.route.name = 'register'
    mocks.register.mockResolvedValue({})
    await submit('aina@example.com', '12345678', 'Ai')
    expect(mocks.register).toHaveBeenCalledWith({ email: 'aina@example.com', password: '12345678', fullName: 'Ai' })
    expect(mocks.replace).toHaveBeenCalledWith('/dashboard')
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('keeps API validation failures visible without navigating', async () => {
    mocks.login.mockRejectedValue({ response: { status: 422, data: { error: {
      message: 'Validation failed', fields: { email: 'Email is not available' },
    } } } })
    const wrapper = await submit('aina@example.com', 'password')
    expect(wrapper.get('[role="alert"]').text()).toContain('Validation failed')
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})
