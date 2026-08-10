import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReceiptExtractionResponse } from '@/types'
import ReceiptReviewStep from './ReceiptReviewStep.vue'

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
    delete: vi.fn(),
  },
}))

vi.mock('gsap', () => ({
  gsap: {
    from: vi.fn(),
  },
}))

const categories = [{ id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FF5733' }]
const extraction = {
  extractionId: 'receipt-1',
  extractedData: {
    merchantName: 'Coffee House',
    merchantCategoryHint: null,
    date: '2026-07-25T10:00:00Z',
    currency: 'MYR',
    lineItems: [],
    subtotal: '12.5000',
    serviceCharge: null,
    tax: '0.0000',
    discountAmount: null,
    total: '12.5000',
    paymentMethod: 'card',
    confidence: 'high',
    fieldsNeedingReview: [],
  },
  rawOcrText: '',
  confidence: 'high',
} satisfies ReceiptExtractionResponse

describe('ReceiptReviewStep', () => {
  beforeEach(() => {
    apiGet.mockResolvedValue({
      data: {
        data: {
          merchantName: 'Coffee House',
          source: 'NONE',
          personalised: false,
        },
      },
    })
  })

  it('defaults remember preference to false and emits true only after explicit selection', async () => {
    const wrapper = mount(ReceiptReviewStep, {
      props: { extraction, categories },
    })

    expect(wrapper.text()).not.toContain('Use this category for future transactions from this merchant')

    await wrapper.findAll('select')[1].setValue('food')
    const checkbox = wrapper.get('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toMatchObject({
      rememberMerchantCategory: false,
    })

    await checkbox.setValue(true)
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('confirm')?.[1]?.[0]).toMatchObject({
      extractionId: 'receipt-1',
      amount: '12.5000',
      categoryId: 'food',
      merchantName: 'Coffee House',
      rememberMerchantCategory: true,
    })
  })

  it('preserves exact receipt money and Instant in the confirmation payload', async () => {
    const wrapper = mount(ReceiptReviewStep, { props: { extraction, categories } })
    await wrapper.findAll('select')[1].setValue('food')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('confirm')?.[0]?.[0]).toMatchObject({
      amount: '12.5000',
      occurredAt: '2026-07-25T10:00:00.000Z',
      fxRate: undefined,
    })
  })

  it('does not emit confirmation for exponent comma zero or excess precision input', async () => {
    const wrapper = mount(ReceiptReviewStep, { props: { extraction, categories } })
    await wrapper.findAll('select')[1].setValue('food')
    const amount = wrapper.get('input[inputmode="decimal"]')

    for (const invalid of ['1e2', '1,000', '0', '-1', '1.00000', '100000000']) {
      await amount.setValue(invalid)
      await wrapper.get('form').trigger('submit')
    }

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('Amount')
  })

  it('requires an explicit rate for an extracted foreign-currency receipt', async () => {
    const wrapper = mount(ReceiptReviewStep, {
      props: {
        extraction: {
          ...extraction,
          extractedData: { ...extraction.extractedData, currency: 'SGD' },
        },
        categories,
      },
    })

    const decimalInputs = wrapper.findAll('input[inputmode="decimal"]')
    expect((decimalInputs[1].element as HTMLInputElement).value).toBe('')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toContain('Exchange rate')
  })

  it('resets the remember choice when merchant or category becomes unavailable', async () => {
    const wrapper = mount(ReceiptReviewStep, {
      props: { extraction, categories },
    })
    await wrapper.findAll('select')[1].setValue('food')
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.get('input[placeholder="e.g. Kopitiam"]').setValue('   ')

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)

    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toMatchObject({
      rememberMerchantCategory: false,
    })
  })
})
