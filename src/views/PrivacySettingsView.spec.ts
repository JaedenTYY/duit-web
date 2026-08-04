import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PrivacySettingsView from './PrivacySettingsView.vue'

const mocks = vi.hoisted(() => ({
  downloadPersonalData: vi.fn(),
  deleteAccount: vi.fn(),
  completeAccountDeletion: vi.fn(),
  gmailInitialise: vi.fn(),
  gmailDisconnect: vi.fn(),
  cooldownStart: vi.fn(),
}))

vi.mock('@/lib/privacyTransport', () => ({
  ACCOUNT_DELETION_PHRASE: 'DELETE MY ACCOUNT',
  downloadPersonalData: mocks.downloadPersonalData,
  deleteAccount: mocks.deleteAccount,
}))
vi.mock('@/lib/sessionCoordinator', () => ({
  completeAccountDeletion: mocks.completeAccountDeletion,
}))
vi.mock('@/composables/useRetryAfterCooldown', () => ({
  useRetryAfterCooldown: () => ({
    active: { value: false },
    remainingSeconds: { value: 0 },
    accessibleMessage: { value: '' },
    start: mocks.cooldownStart,
    clear: vi.fn(),
  }),
}))
vi.mock('@/stores/gmail', () => ({
  useGmailStore: () => ({
    status: { connected: true },
    disconnecting: false,
    error: null,
    errorRequestId: null,
    initialise: mocks.gmailInitialise,
    disconnect: mocks.gmailDisconnect,
  }),
}))

describe('PrivacySettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.downloadPersonalData.mockResolvedValue('duit-personal-data.zip')
    mocks.deleteAccount.mockResolvedValue(undefined)
    mocks.gmailDisconnect.mockResolvedValue(true)
  })

  it('requires a password, downloads once, and clears the password field', async () => {
    const wrapper = mount(PrivacySettingsView)
    const password = wrapper.get<HTMLInputElement>('[data-testid="privacy-export-password"]')
    const submit = wrapper.get<HTMLButtonElement>('[data-testid="privacy-export-submit"]')

    expect(submit.attributes('disabled')).toBeDefined()
    await password.setValue('current-password')
    await wrapper.findAll('form')[0]!.trigger('submit')
    await flushPromises()

    expect(mocks.downloadPersonalData).toHaveBeenCalledTimes(1)
    expect(mocks.downloadPersonalData).toHaveBeenCalledWith('current-password')
    expect(password.element.value).toBe('')
    expect(wrapper.text()).toContain('did not store the archive')
  })

  it('blocks account deletion until password exact phrase and acknowledgement are present', async () => {
    const wrapper = mount(PrivacySettingsView)
    const password = wrapper.get<HTMLInputElement>('[data-testid="delete-account-password"]')
    const phrase = wrapper.get<HTMLInputElement>('[data-testid="delete-account-phrase"]')
    const acknowledgement = wrapper.get<HTMLInputElement>('[data-testid="delete-account-acknowledgement"]')
    const submit = wrapper.get<HTMLButtonElement>('[data-testid="delete-account-submit"]')

    await password.setValue('current-password')
    await phrase.setValue('delete my account')
    await acknowledgement.setValue(true)
    expect(submit.attributes('disabled')).toBeDefined()

    await phrase.setValue('DELETE MY ACCOUNT')
    expect(submit.attributes('disabled')).toBeUndefined()
    await wrapper.findAll('form')[1]!.trigger('submit')
    await flushPromises()

    expect(mocks.deleteAccount).toHaveBeenCalledWith('current-password', 'DELETE MY ACCOUNT')
    expect(mocks.completeAccountDeletion).toHaveBeenCalledTimes(1)
    expect(password.element.value).toBe('')
  })

  it('requires explicit confirmation before deleting Gmail extraction records', async () => {
    const wrapper = mount(PrivacySettingsView)
    const destructiveMode = wrapper.get<HTMLInputElement>('input[type="radio"][value="delete"]')
    const disconnect = wrapper.get<HTMLButtonElement>('[data-testid="gmail-disconnect-submit"]')

    await destructiveMode.setValue(true)
    expect(disconnect.attributes('disabled')).toBeDefined()
    const confirmation = wrapper.get<HTMLInputElement>('input[type="checkbox"]:not([data-testid])')
    await confirmation.setValue(true)
    expect(disconnect.attributes('disabled')).toBeUndefined()
    await disconnect.trigger('click')
    await flushPromises()

    expect(mocks.gmailDisconnect).toHaveBeenCalledWith(true)
  })

  it('shows the correlated request reference and starts the export 429 cooldown', async () => {
    mocks.downloadPersonalData.mockRejectedValue({
      response: {
        status: 429,
        headers: { 'retry-after': '30' },
        data: {
          error: {
            code: 'ERR_RATE_LIMIT_429',
            message: 'Too many requests.',
            requestId: 'f64651f2-c852-4dd7-869a-c20a5a434534',
          },
        },
      },
    })
    const wrapper = mount(PrivacySettingsView)
    await wrapper.get('[data-testid="privacy-export-password"]').setValue('password')
    await wrapper.findAll('form')[0]!.trigger('submit')
    await flushPromises()

    expect(mocks.cooldownStart).toHaveBeenCalledWith(30)
    expect(wrapper.text()).toContain('f64651f2-c852-4dd7-869a-c20a5a434534')
    expect(wrapper.text()).toContain('Too many requests.')
  })
})
