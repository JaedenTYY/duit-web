import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/types'
import api from '@/lib/api'
import { useTransactionStore } from './transaction'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock('@/utils/logger', () => ({ logger: { log: vi.fn(), error: vi.fn() } }))

const transaction: Transaction = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  amount: '12.3400',
  currency: 'MYR',
  amountMyr: '12.3400',
  fxRate: '1.000000',
  merchantId: null,
  merchantName: null,
  categoryId: null,
  categoryName: null,
  categoryIcon: null,
  categoryColor: null,
  description: null,
  source: 'manual',
  occurredAt: '2026-08-11T00:00:00Z',
  version: 3,
  createdAt: '2026-08-11T00:00:00Z',
}

describe('transaction mutation integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sends the caller-owned operation key without changing the exact payload', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: transaction } })
    const store = useTransactionStore()
    const payload = {
      amount: '12.3400',
      currency: 'MYR',
      occurredAt: transaction.occurredAt,
    }

    await store.createTransaction(payload, '33333333-3333-4333-8333-333333333333')

    expect(api.post).toHaveBeenCalledWith('/transactions', payload, {
      headers: { 'Idempotency-Key': '33333333-3333-4333-8333-333333333333' },
    })
  })

  it('submits expectedVersion on update', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...transaction, version: 4 } } })
    const store = useTransactionStore()

    await store.updateTransaction(transaction.id, {
      amount: '13.0000',
      expectedVersion: 3,
    })

    expect(api.patch).toHaveBeenCalledWith(`/transactions/${transaction.id}`, {
      amount: '13.0000',
      expectedVersion: 3,
    })
  })

  it('refetches and rejects stale updates for explicit user review', async () => {
    vi.mocked(api.patch).mockRejectedValue(staleConflict())
    vi.mocked(api.get).mockResolvedValue({ data: { data: { ...transaction, version: 4 } } })
    const store = useTransactionStore()

    await expect(store.updateTransaction(transaction.id, {
      amount: '13.0000',
      expectedVersion: 3,
    })).rejects.toMatchObject({
      name: 'TransactionStaleConflictError',
      current: { version: 4 },
    })
    expect(api.get).toHaveBeenCalledWith(`/transactions/${transaction.id}`)
  })

  it('submits expectedVersion on delete and accepts an already-gone 204', async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 })
    const store = useTransactionStore()

    await store.deleteTransaction(transaction.id, transaction.version)

    expect(api.delete).toHaveBeenCalledWith(`/transactions/${transaction.id}`, {
      params: { expectedVersion: 3 },
    })
  })
})

function staleConflict() {
  return {
    response: {
      status: 409,
      data: {
        error: {
          code: 'ERR_TX_STALE_409',
          message: 'Transaction changed',
        },
      },
    },
  }
}
