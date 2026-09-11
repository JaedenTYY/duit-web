import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GmailReceiptsView from './GmailReceiptsView.vue'

const { gmailStore, transactionStore } = vi.hoisted(() => ({
  gmailStore: {
    status: { connected: true, provider: 'google', providerEmail: 'user@example.test', scopes: [] },
    extractions: [
      {
        id: 'email-1',
        sender: 'receipts@example.test',
        subject: 'Receipt',
        merchantName: 'Cafe',
        amount: '12.3400',
        currency: 'MYR',
        occurredAt: '2026-08-01T00:00:00Z',
        status: 'pending',
      },
    ],
    lastSync: null,
    loading: false,
    connecting: false,
    syncing: false,
    disconnecting: false,
    actionIds: new Set<string>(),
    error: null,
    initialise: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    sync: vi.fn(),
    confirm: vi.fn(),
    skip: vi.fn(),
  },
  transactionStore: {
    categories: [{ id: 'food', name: 'Food & Dining', icon: '🍔' }],
    fetchCategories: vi.fn(),
    reconcileAfterFinancialMutation: vi.fn(),
  },
}))

vi.mock('@/stores/gmail', () => ({ useGmailStore: () => gmailStore }))
vi.mock('@/stores/transaction', () => ({ useTransactionStore: () => transactionStore }))

describe('GmailReceiptsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gmailStore.confirm.mockResolvedValue(true)
  })

  it('reconciles transaction caches after a successful eReceipt confirmation', async () => {
    const wrapper = mount(GmailReceiptsView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true, EmptyState: true } },
    })
    await flushPromises()

    const confirmButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Confirm')

    expect(confirmButton).toBeTruthy()
    await confirmButton!.trigger('click')

    expect(gmailStore.confirm).toHaveBeenCalledWith('email-1', undefined)
    expect(transactionStore.reconcileAfterFinancialMutation).toHaveBeenCalledWith({ refreshTransactions: true })
  })

  it('does not refresh financial caches when confirmation fails', async () => {
    gmailStore.confirm.mockResolvedValue(false)
    const wrapper = mount(GmailReceiptsView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true, EmptyState: true } },
    })
    await flushPromises()

    const confirmButton = wrapper.findAll('button')
      .find((button) => button.text() === 'Confirm')
    await confirmButton!.trigger('click')

    expect(transactionStore.reconcileAfterFinancialMutation).not.toHaveBeenCalled()
  })
})
