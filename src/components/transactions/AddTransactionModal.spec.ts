import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddTransactionModal from './AddTransactionModal.vue'

const { store, merchantActions } = vi.hoisted(() => ({
  store: {
    categories: [
      { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF5733' },
      { id: 'transport', name: 'Transport', icon: '🚗', color: '#33FF57' },
    ],
    error: null as string | null,
    submitting: false,
    fetchCategories: vi.fn(),
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
  },
  merchantActions: {
    categoriseMerchant: vi.fn(),
    forgetMerchantCategoryPreference: vi.fn(),
  },
}))

vi.mock('@/stores/transaction', () => ({ useTransactionStore: () => store }))
vi.mock('@/composables/useMerchantCategorisation', () => ({
  useMerchantCategorisation: () => merchantActions,
}))
vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn() } }))

describe('AddTransactionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    merchantActions.categoriseMerchant.mockResolvedValue({ source: 'NONE' })
    merchantActions.forgetMerchantCategoryPreference.mockResolvedValue(undefined)
    store.createTransaction.mockResolvedValue({})
    store.updateTransaction.mockResolvedValue({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults the remember checkbox to false and sends its value in a create payload', async () => {
    const wrapper = mount(AddTransactionModal)
    await wrapper.get('input[placeholder="0.00"]').setValue('12.50')
    await wrapper.get('input[placeholder="e.g. Starbucks..."]').setValue('Coffee House')
    await wrapper.get('select').setValue('MYR')
    await wrapper.findAll('select')[1].setValue('food')

    const checkbox = wrapper.get('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    await checkbox.setValue(true)
    await wrapper.get('form').trigger('submit')

    expect(store.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '12.50',
        merchantName: 'Coffee House',
        categoryId: 'food',
        rememberMerchantCategory: true,
      }),
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    )
  })

  it('preserves exact strings during editing and submission', async () => {
    const wrapper = mount(AddTransactionModal, {
      props: {
        transaction: {
          id: 'transaction-1', userId: 'user-1', amount: '12.5000', currency: 'SGD',
          amountMyr: '40.0000', fxRate: '3.200000', merchantId: null,
          merchantName: null, categoryId: 'food', categoryName: 'Food & Dining',
          categoryIcon: '🍔', categoryColor: '#FF5733', description: null, source: 'manual',
          occurredAt: '2026-07-01T00:00:00Z', version: 7, createdAt: '2026-07-01T00:00:00Z',
        },
      },
    })

    expect((wrapper.get('input[name="amount"]').element as HTMLInputElement).value).toBe('12.5000')
    const decimalInputs = wrapper.findAll('input[inputmode="decimal"]')
    expect((decimalInputs[1].element as HTMLInputElement).value).toBe('3.200000')
    await wrapper.get('form').trigger('submit')

    expect(store.updateTransaction).toHaveBeenCalledWith('transaction-1', expect.objectContaining({
      amount: '12.5000',
      fxRate: '3.200000',
      occurredAt: '2026-07-01T00:00:00.000Z',
      expectedVersion: 7,
    }))
  })

  it('requires re-entry of a foreign rate after any currency round trip', async () => {
    const wrapper = mount(AddTransactionModal, {
      props: {
        transaction: {
          id: 'transaction-1', userId: 'user-1', amount: '12.5000', currency: 'SGD',
          amountMyr: '40.0000', fxRate: '3.200000', merchantId: null,
          merchantName: null, categoryId: 'food', categoryName: 'Food & Dining',
          categoryIcon: '🍔', categoryColor: '#FF5733', description: null, source: 'manual',
          occurredAt: '2026-07-01T00:00:00Z', version: 7, createdAt: '2026-07-01T00:00:00Z',
        },
      },
    })

    const currencySelect = wrapper.findAll('select')[0]
    await currencySelect.setValue('MYR')
    await currencySelect.setValue('SGD')

    const decimalInputs = wrapper.findAll('input[inputmode="decimal"]')
    expect((decimalInputs[1].element as HTMLInputElement).value).toBe('')
    await wrapper.get('form').trigger('submit')
    expect(store.updateTransaction).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('Exchange rate')
  })

  it('rejects invalid exact-decimal input without submitting', async () => {
    const wrapper = mount(AddTransactionModal)
    const input = wrapper.get('input[name="amount"]')
    for (const invalid of ['', '0', '-1', '1e2', '1,000', '1.00000', '100000000']) {
      await input.setValue(invalid)
      await wrapper.get('form').trigger('submit')
    }
    expect(store.createTransaction).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('Amount')
  })

  it('does not send merchantName during an edit and only offers remember after a category change', async () => {
    const wrapper = mount(AddTransactionModal, {
      props: {
        transaction: {
          id: 'transaction-1', userId: 'user-1', amount: '12.5000', currency: 'MYR',
          amountMyr: '12.5000', fxRate: '1.000000', merchantId: 'merchant-1',
          merchantName: 'Coffee House', categoryId: 'food', categoryName: 'Food & Dining',
          categoryIcon: '🍔', categoryColor: '#FF5733', description: null, source: 'manual',
          occurredAt: '2026-07-01T00:00:00Z', version: 7, createdAt: '2026-07-01T00:00:00Z',
        },
      },
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('input[placeholder="e.g. Starbucks..."]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Merchant name is fixed')
    await wrapper.findAll('select')[1].setValue('transport')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    await wrapper.get('form').trigger('submit')

    expect(store.updateTransaction).toHaveBeenCalledWith('transaction-1', expect.not.objectContaining({
      merchantName: expect.anything(),
    }))
    expect(store.updateTransaction).toHaveBeenCalledWith('transaction-1', expect.objectContaining({
      rememberMerchantCategory: false,
    }))
  })

  it('ignores stale merchant categorisation responses that no longer match the current merchant', async () => {
    vi.useFakeTimers()
    let resolveSlow!: (value: unknown) => void
    let resolveFast!: (value: unknown) => void
    merchantActions.categoriseMerchant.mockImplementation((merchant: string) => new Promise((resolve) => {
      if (merchant === 'Slow Merchant') resolveSlow = resolve
      if (merchant === 'Fast Merchant') resolveFast = resolve
    }))
    const wrapper = mount(AddTransactionModal)

    await wrapper.get('input[placeholder="e.g. Starbucks..."]').setValue('Slow Merchant')
    await vi.advanceTimersByTimeAsync(500)
    await wrapper.get('input[placeholder="e.g. Starbucks..."]').setValue('Fast Merchant')
    await vi.advanceTimersByTimeAsync(500)

    resolveFast({
      source: 'SYSTEM_MERCHANT',
      categoryId: 'transport',
      confidence: 'HIGH',
    })
    await flushPromises()
    expect(wrapper.find('button[aria-label="Use 🚗 Transport category"]').exists()).toBe(true)

    resolveSlow({
      source: 'SYSTEM_MERCHANT',
      categoryId: 'food',
      confidence: 'HIGH',
    })
    await flushPromises()

    expect(wrapper.find('button[aria-label="Use 🚗 Transport category"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Use 🍔 Food & Dining category"]').exists()).toBe(false)
  })

  it('provides dialog semantics, closes on Escape when idle, and restores trigger focus on unmount', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open transaction dialog'
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(AddTransactionModal, { attachTo: document.body })
    await flushPromises()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBe('transaction-dialog-title')
    expect(dialog.element.contains(document.activeElement)).toBe(true)
    const focusable = dialog.findAll('button, input, select')
      .filter((item) => item.attributes('disabled') === undefined)
    expect(document.activeElement).toBe(focusable[0].element)

    await dialog.trigger('keydown', { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(focusable[focusable.length - 1].element)
    await dialog.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(focusable[0].element)

    await dialog.trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeTruthy()

    wrapper.unmount()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('forgets through the owner-scoped endpoint and refreshes the suggestion', async () => {
    const wrapper = mount(AddTransactionModal, {
      props: {
        transaction: {
          id: 'transaction-1', userId: 'user-1', amount: '12.5000', currency: 'MYR',
          amountMyr: '12.5000', fxRate: '1.000000', merchantId: 'merchant-1',
          merchantName: 'Coffee House', categoryId: 'food', categoryName: 'Food & Dining',
          categoryIcon: '🍔', categoryColor: '#FF5733', description: null, source: 'manual',
          occurredAt: '2026-07-01T00:00:00Z', version: 7, createdAt: '2026-07-01T00:00:00Z',
        },
      },
    })
    await flushPromises()

    await (wrapper.vm as unknown as { forgetPreference: (merchantId: string) => Promise<void> })
      .forgetPreference('merchant-1')
    await flushPromises()

    expect(merchantActions.forgetMerchantCategoryPreference).toHaveBeenCalledWith('merchant-1')
    expect(merchantActions.categoriseMerchant).toHaveBeenLastCalledWith('Coffee House')
    expect(wrapper.text()).toContain('Saved merchant category forgotten.')
  })

  it('does not announce success when forgetting a saved preference fails', async () => {
    merchantActions.forgetMerchantCategoryPreference.mockRejectedValueOnce(new Error('network error'))
    const wrapper = mount(AddTransactionModal)
    await (wrapper.vm as unknown as { forgetPreference: (merchantId: string) => Promise<void> })
      .forgetPreference('merchant-1')
    await flushPromises()

    expect(merchantActions.forgetMerchantCategoryPreference).toHaveBeenCalledWith('merchant-1')
    expect(wrapper.text()).toContain('Could not forget the saved merchant category')
    expect(wrapper.text()).not.toContain('Saved merchant category forgotten.')
  })
})
