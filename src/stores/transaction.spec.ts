import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '@/types'
import { useTransactionStore } from './transaction'
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from '@/api/generated/transaction-controller/transaction-controller'
import type { TransactionResponse } from '@/api/generated/model'

vi.mock('@/api/generated/transaction-controller/transaction-controller', () => ({
  createTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  getTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  listTransactions: vi.fn(),
  getMonthlySummary: vi.fn(),
}))
vi.mock('@/api/generated/category-controller/category-controller', () => ({
  listCategories: vi.fn(),
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
    vi.mocked(createTransaction).mockResolvedValue({ data: asGeneratedTransaction(transaction), meta: meta() })
    const store = useTransactionStore()
    const payload = {
      amount: '12.3400',
      currency: 'MYR' as const,
      occurredAt: transaction.occurredAt,
    }

    await store.createTransaction(payload, '33333333-3333-4333-8333-333333333333')

    expect(createTransaction).toHaveBeenCalledWith(payload, {
      'Idempotency-Key': '33333333-3333-4333-8333-333333333333',
    })
  })

  it('submits expectedVersion on update', async () => {
    vi.mocked(updateTransaction).mockResolvedValue({
      data: asGeneratedTransaction({ ...transaction, version: 4 }),
      meta: meta(),
    })
    const store = useTransactionStore()

    await store.updateTransaction(transaction.id, {
      amount: '13.0000',
      expectedVersion: 3,
    })

    expect(updateTransaction).toHaveBeenCalledWith(transaction.id, {
      amount: '13.0000',
      expectedVersion: 3,
    })
  })

  it('refetches and rejects stale updates for explicit user review', async () => {
    vi.mocked(updateTransaction).mockRejectedValue(staleConflict())
    vi.mocked(getTransaction).mockResolvedValue({
      data: asGeneratedTransaction({ ...transaction, version: 4 }),
      meta: meta(),
    })
    const store = useTransactionStore()

    await expect(store.updateTransaction(transaction.id, {
      amount: '13.0000',
      expectedVersion: 3,
    })).rejects.toMatchObject({
      name: 'TransactionStaleConflictError',
      current: { version: 4 },
    })
    expect(getTransaction).toHaveBeenCalledWith(transaction.id)
  })

  it('submits expectedVersion on delete and accepts an already-gone 204', async () => {
    vi.mocked(deleteTransaction).mockResolvedValue(undefined)
    const store = useTransactionStore()

    await store.deleteTransaction(transaction.id, transaction.version)

    expect(deleteTransaction).toHaveBeenCalledWith(transaction.id, { expectedVersion: 3 })
  })

  it('ingests externally created transactions once at the head of the cache', () => {
    const store = useTransactionStore()
    store.recordCreatedTransaction(transaction)
    store.recordCreatedTransaction({ ...transaction, version: 4 })

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]).toMatchObject({ id: transaction.id, version: 4 })
  })
})

function meta() {
  return {
    timestamp: '2026-08-11T00:00:00Z',
    requestId: 'request-id',
  }
}

function asGeneratedTransaction(value: Transaction): TransactionResponse {
  return value as unknown as TransactionResponse
}

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
