import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import api from '@/lib/api'
import type { Bill, GuestBill, GuestBillSummary } from '@/types'
import { useBillStore } from './bill'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const SHARE_TOKEN = 'share-token'
const JOIN_KEY = '11111111-1111-4111-8111-111111111111'
const PARTICIPANT_TOKEN = 'participant-token'

const guestSummary: GuestBillSummary = {
  displayName: 'Guest',
  currency: 'MYR',
  subtotalShare: '0.0000',
  taxShare: '0.0000',
  serviceChargeShare: '0.0000',
  totalOwed: '0.0000',
  lineAdjustmentShare: '0.0000',
  totalAdjustmentShare: '0.0000',
  allocationVersion: 7,
  unallocatedSubtotal: '10.0000',
  unallocatedTax: '0.0000',
  unallocatedServiceCharge: '0.0000',
  unallocatedTotal: '10.0000',
  isPaid: false,
  paidAt: null,
  paidAmount: null,
  paidAllocationVersion: null,
  paymentQrProfile: null,
  selectedItems: [],
}

const ownerBill: Bill = {
  id: 'bill-id',
  merchantName: 'Merchant',
  shareToken: SHARE_TOKEN,
  status: 'active',
  currency: 'MYR',
  subtotal: '10.0000',
  taxAmount: '0.0000',
  serviceCharge: '0.0000',
  totalAmount: '10.0000',
  allocationVersion: 4,
  lineAdjustment: '0.0000',
  totalAdjustment: '0.0000',
  unallocatedSubtotal: '10.0000',
  unallocatedTax: '0.0000',
  unallocatedServiceCharge: '0.0000',
  unallocatedTotal: '10.0000',
  expiresAt: '2027-01-01T00:00:00Z',
  paymentQrProfile: null,
  items: [],
  participants: [],
}

const guestBill: GuestBill = {
  merchantName: 'Merchant',
  status: 'active',
  currency: 'MYR',
  subtotal: '10.0000',
  taxAmount: '0.0000',
  serviceCharge: '0.0000',
  totalAmount: '10.0000',
  allocationVersion: 7,
  lineAdjustment: '0.0000',
  totalAdjustment: '0.0000',
  unallocatedSubtotal: '10.0000',
  unallocatedTax: '0.0000',
  unallocatedServiceCharge: '0.0000',
  unallocatedTotal: '10.0000',
  expiresAt: '2027-01-01T00:00:00Z',
  paymentQrProfile: null,
  items: [],
}

describe('bill split mutation integrity', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => JOIN_KEY) })
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('reuses one guest join operation key after a transport failure', async () => {
    vi.mocked(api.post)
      .mockRejectedValueOnce(new Error('network lost'))
      .mockResolvedValueOnce({
        data: {
          data: {
            participantToken: PARTICIPANT_TOKEN,
            summary: guestSummary,
          },
        },
      })
    const store = useBillStore()

    await expect(store.joinGuestBill(SHARE_TOKEN, 'Guest')).rejects.toThrow('network lost')
    expect(localStorage.getItem(`duit_guest_join_operation_${SHARE_TOKEN}`)).toBe(JOIN_KEY)

    await store.joinGuestBill(SHARE_TOKEN, 'Guest')

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      `/guest/bills/${SHARE_TOKEN}/join`,
      { displayName: 'Guest' },
      { headers: { 'Idempotency-Key': JOIN_KEY } }
    )
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      `/guest/bills/${SHARE_TOKEN}/join`,
      { displayName: 'Guest' },
      { headers: { 'Idempotency-Key': JOIN_KEY } }
    )
    expect(localStorage.getItem(`duit_guest_join_operation_${SHARE_TOKEN}`)).toBeNull()
    expect(localStorage.getItem(`duit_guest_participant_${SHARE_TOKEN}`)).toBe(PARTICIPANT_TOKEN)
  })

  it('submits empty selection as a complete state replacement with expected allocation version', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: {
          data: {
            participantToken: PARTICIPANT_TOKEN,
            summary: guestSummary,
          },
        },
      })
      .mockResolvedValueOnce({ data: { data: guestSummary } })
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: guestBill } })
    const store = useBillStore()

    await store.joinGuestBill(SHARE_TOKEN, 'Guest')
    await store.selectGuestItems(SHARE_TOKEN, [])

    expect(api.post).toHaveBeenNthCalledWith(
      2,
      `/guest/bills/${SHARE_TOKEN}/items`,
      {
        participantToken: PARTICIPANT_TOKEN,
        itemIds: [],
        expectedAllocationVersion: 7,
      }
    )
    expect(api.get).toHaveBeenCalledWith(`/guest/bills/${SHARE_TOKEN}`)
  })

  it('sends owner mutation revisions and refetches for stale bill conflicts', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: ownerBill } })
    vi.mocked(api.post).mockRejectedValue(staleBillConflict())
    const store = useBillStore()
    await store.fetchBill(ownerBill.id)

    await expect(store.markPaid(ownerBill.id, 'participant-id', true)).rejects.toMatchObject({
      response: { status: 409 },
    })

    expect(api.post).toHaveBeenCalledWith(`/bills/${ownerBill.id}/mark-paid`, {
      participantId: 'participant-id',
      isPaid: true,
      expectedAllocationVersion: 4,
    })
    expect(api.get).toHaveBeenCalledWith(`/bills/${ownerBill.id}`)
  })
})

function staleBillConflict() {
  return {
    response: {
      status: 409,
      data: {
        error: {
          code: 'ERR_BILL_STALE_409',
          message: 'Bill changed',
        },
      },
    },
  }
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}
