import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { useReceiptStore } from './receipt'
import {
  confirmExtraction,
  uploadReceipt,
} from '@/api/generated/receipt-controller/receipt-controller'
import type {
  ConfirmExtractionRequest,
  ReceiptExtractionResponse,
  TransactionResponse,
} from '@/api/generated/model'

vi.mock('@/api/generated/receipt-controller/receipt-controller', () => ({
  confirmExtraction: vi.fn(),
  uploadReceipt: vi.fn(),
}))

describe('receipt store generated contract behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty transient upload and confirmation state', () => {
    const store = useReceiptStore()

    expect(store.uploading).toBe(false)
    expect(store.confirming).toBe(false)
    expect(store.extraction).toBeNull()
    expect(store.error).toBeNull()
  })

  it('uploads a supported image through the generated contract and preserves duplicate warnings', async () => {
    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' })
    const extraction = generatedReceiptExtraction({ duplicateImageWarning: true })
    vi.mocked(uploadReceipt).mockResolvedValue({ data: extraction, meta: meta() })
    const store = useReceiptStore()

    await expect(store.uploadReceipt(file)).resolves.toEqual(extraction)

    expect(uploadReceipt).toHaveBeenCalledWith({ file })
    expect(store.extraction).toEqual(extraction)
    expect(store.extraction?.duplicateImageWarning).toBe(true)
  })

  it('blocks unsupported files before the generated upload call', async () => {
    const store = useReceiptStore()

    await expect(
      store.uploadReceipt(new File(['pdf'], 'receipt.pdf', { type: 'application/pdf' }))
    ).rejects.toThrow('Use a JPEG, PNG, or WebP receipt image')

    expect(uploadReceipt).not.toHaveBeenCalled()
    expect(store.error).toContain('JPEG, PNG, or WebP')
  })

  it('confirms with the exact generated payload clears extraction and returns the transaction response', async () => {
    const extraction = generatedReceiptExtraction()
    const transaction = generatedTransaction()
    const payload: ConfirmExtractionRequest = {
      extractionId: extraction.extractionId,
      amount: '12.3400',
      currency: 'MYR',
      occurredAt: '2026-08-11T00:00:00.000Z',
      fxRate: undefined,
      rememberMerchantCategory: false,
    }
    vi.mocked(uploadReceipt).mockResolvedValue({ data: extraction, meta: meta() })
    vi.mocked(confirmExtraction).mockResolvedValue({ data: transaction, meta: meta() })
    const store = useReceiptStore()
    await store.uploadReceipt(new File(['receipt'], 'receipt.webp', { type: 'image/webp' }))

    await expect(store.confirmExtraction(payload)).resolves.toEqual(transaction)

    expect(confirmExtraction).toHaveBeenCalledWith(payload)
    expect(store.extraction).toBeNull()
  })

  it('keeps review state and exposes API error text when confirmation fails', async () => {
    const extraction = generatedReceiptExtraction()
    vi.mocked(uploadReceipt).mockResolvedValue({ data: extraction, meta: meta() })
    vi.mocked(confirmExtraction).mockRejectedValue(apiError('ERR_RECEIPT_001', 'Receipt was already confirmed'))
    const store = useReceiptStore()
    await store.uploadReceipt(new File(['receipt'], 'receipt.png', { type: 'image/png' }))

    await expect(store.confirmExtraction({
      extractionId: extraction.extractionId,
      amount: '12.3400',
      currency: 'MYR',
      occurredAt: '2026-08-11T00:00:00.000Z',
      rememberMerchantCategory: false,
    })).rejects.toMatchObject({ response: { status: 422 } })

    expect(store.extraction).toEqual(extraction)
    expect(store.error).toBe('Receipt was already confirmed')
  })

  it('reset clears receipt state and authoritative receipt money is string-owned', async () => {
    vi.mocked(uploadReceipt).mockResolvedValue({ data: generatedReceiptExtraction(), meta: meta() })
    const store = useReceiptStore()
    await store.uploadReceipt(new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' }))

    store.reset()

    expect(store.uploading).toBe(false)
    expect(store.confirming).toBe(false)
    expect(store.extraction).toBeNull()
    expect(store.error).toBeNull()
    expectTypeOf<ConfirmExtractionRequest['amount']>().toEqualTypeOf<string>()
    expectTypeOf<ConfirmExtractionRequest['fxRate']>().toEqualTypeOf<string | undefined>()
  })
})

function generatedReceiptExtraction(overrides: Partial<ReceiptExtractionResponse> = {}): ReceiptExtractionResponse {
  return {
    extractionId: '11111111-1111-4111-8111-111111111111',
    rawOcrText: 'Receipt text',
    confidence: 'high',
    duplicateImageWarning: false,
    extractedData: {
      merchantName: 'Coffee House',
      currency: 'MYR',
      lineItems: [{
        name: 'Coffee',
        qty: '1.0000',
        unitPrice: '12.3400',
        lineTotal: '12.3400',
      }],
      total: '12.3400',
      paymentMethod: 'card',
      confidence: 'high',
      fieldsNeedingReview: [],
    },
    ...overrides,
  }
}

function generatedTransaction(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    userId: '33333333-3333-4333-8333-333333333333',
    amount: '12.3400',
    currency: 'MYR',
    amountMyr: '12.3400',
    fxRate: '1.000000',
    source: 'receipt',
    occurredAt: '2026-08-11T00:00:00.000Z',
    createdAt: '2026-08-11T00:00:01.000Z',
    version: 0,
    ...overrides,
  }
}

function meta() {
  return { timestamp: '2026-08-11T00:00:00.000Z', requestId: REQUEST_ID }
}

function apiError(code: string, message: string) {
  return {
    response: {
      status: 422,
      data: { error: { code, message, requestId: REQUEST_ID } },
      headers: {},
    },
  }
}

const REQUEST_ID = '44444444-4444-4444-8444-444444444444'
