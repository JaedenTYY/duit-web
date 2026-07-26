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
    subtotal: 12.5,
    serviceCharge: null,
    tax: 0,
    discountAmount: null,
    total: 12.5,
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
      categoryId: 'food',
      merchantName: 'Coffee House',
      rememberMerchantCategory: true,
    })
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
