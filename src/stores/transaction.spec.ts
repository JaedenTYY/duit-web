import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTransactionStore } from './transaction'
import {
  createTransaction,
  deleteTransaction,
  getMonthlySummary,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '@/api/generated/transaction-controller/transaction-controller'
import type { TransactionPageResponse, TransactionResponse } from '@/api/generated/model'

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

const transaction = generatedTransaction({
  id: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
  occurredAt: '2026-08-11T00:00:00Z',
  version: 3,
})

describe('transaction mutation integrity', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('sends the caller-owned operation key without changing the exact payload', async () => {
    vi.mocked(createTransaction).mockResolvedValue({ data: transaction, meta: meta() })
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
      data: { ...transaction, version: 4 },
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
      data: { ...transaction, version: 4 },
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

  it('keeps stale-conflict refetches in backend order instead of moving old rows to the head', async () => {
    const newer = generatedTransaction({
      id: '33333333-3333-4333-8333-333333333333',
      occurredAt: '2026-08-12T00:00:00Z',
      version: 1,
    })
    const older = generatedTransaction({
      id: transaction.id,
      occurredAt: '2026-08-01T00:00:00Z',
      version: 1,
    })
    vi.mocked(updateTransaction).mockRejectedValue(staleConflict())
    vi.mocked(getTransaction).mockResolvedValue({
      data: { ...older, version: 2 },
      meta: meta(),
    })
    const store = useTransactionStore()
    store.recordCreatedTransaction(newer)
    store.recordCreatedTransaction(older)

    await expect(store.updateTransaction(older.id, { expectedVersion: 1 }))
      .rejects.toMatchObject({ name: 'TransactionStaleConflictError' })

    expect(store.transactions.map((item) => item.id)).toEqual([newer.id, older.id])
    expect(store.transactions[1]).toMatchObject({ id: older.id, version: 2 })
  })

  it('submits expectedVersion on delete and accepts an already-gone 204', async () => {
    vi.mocked(deleteTransaction).mockResolvedValue(undefined)
    const store = useTransactionStore()

    await store.deleteTransaction(transaction.id, transaction.version)

    expect(deleteTransaction).toHaveBeenCalledWith(transaction.id, { expectedVersion: 3 })
  })

  it('recordCreatedTransaction deduplicates the same ID and keeps the newest known version', () => {
    const store = useTransactionStore()
    store.recordCreatedTransaction(transaction)
    store.recordCreatedTransaction({ ...transaction, version: 4 })

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]).toMatchObject({ id: transaction.id, version: 4 })
  })

  it('places a backdated created transaction by occurredAt instead of blindly at index zero', () => {
    const newer = generatedTransaction({
      id: '33333333-3333-4333-8333-333333333333',
      occurredAt: '2026-08-12T00:00:00Z',
    })
    const backdated = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-07-01T00:00:00Z',
    })
    const store = useTransactionStore()

    store.recordCreatedTransaction(newer)
    store.recordCreatedTransaction(backdated)

    expect(store.transactions.map((item) => item.id)).toEqual([newer.id, backdated.id])
  })

  it('orders transactions with the same occurredAt by id descending', () => {
    const occurredAt = '2026-08-11T00:00:00.123456789Z'
    const lowerId = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt,
    })
    const higherId = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000002',
      occurredAt,
    })
    const store = useTransactionStore()

    store.recordCreatedTransaction(lowerId)
    store.recordCreatedTransaction(higherId)

    expect(store.transactions.map((item) => item.id)).toEqual([higherId.id, lowerId.id])
  })

  it('repositions an updated transaction when occurredAt changes', async () => {
    const existing = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-08-01T00:00:00Z',
      version: 1,
    })
    const other = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000002',
      occurredAt: '2026-08-10T00:00:00Z',
      version: 1,
    })
    const moved = { ...existing, occurredAt: '2026-08-12T00:00:00Z', version: 2 }
    vi.mocked(updateTransaction).mockResolvedValue({ data: moved, meta: meta() })
    const store = useTransactionStore()
    store.recordCreatedTransaction(existing)
    store.recordCreatedTransaction(other)

    await store.updateTransaction(existing.id, { occurredAt: moved.occurredAt, expectedVersion: 1 })

    expect(store.transactions.map((item) => item.id)).toEqual([existing.id, other.id])
  })

  it('deduplicates a locally inserted older transaction when a later cursor page returns it', async () => {
    const firstPage = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000003',
      occurredAt: '2026-08-20T00:00:00Z',
    })
    const locallyInserted = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000002',
      occurredAt: '2026-08-01T00:00:00Z',
      version: 1,
    })
    const nextPageSibling = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-07-31T00:00:00Z',
    })
    vi.mocked(listTransactions)
      .mockResolvedValueOnce({ data: page([firstPage], '2026-08-10T00:00:00Z', firstPage.id), meta: meta() })
      .mockResolvedValueOnce({
        data: page([{ ...locallyInserted, version: 2 }, nextPageSibling], null, null),
        meta: meta(),
      })
    const store = useTransactionStore()

    await store.fetchTransactions(true)
    store.recordCreatedTransaction(locallyInserted)
    await store.fetchTransactions(false)

    expect(listTransactions).toHaveBeenNthCalledWith(2, {
      limit: 20,
      cursor: '2026-08-10T00:00:00Z',
      cursorId: firstPage.id,
    })
    expect(store.transactions.filter((item) => item.id === locallyInserted.id)).toHaveLength(1)
    expect(store.transactions.find((item) => item.id === locallyInserted.id)?.version).toBe(2)
  })

  it('reconciles repeated page entries without duplicate IDs', async () => {
    const repeated = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-08-11T00:00:00Z',
      version: 1,
    })
    vi.mocked(listTransactions).mockResolvedValueOnce({
      data: page([repeated, { ...repeated, version: 2 }]),
      meta: meta(),
    })
    const store = useTransactionStore()

    await store.fetchTransactions(true)

    expect(store.transactions).toHaveLength(1)
    expect(store.transactions[0]).toMatchObject({ id: repeated.id, version: 2 })
  })

  it('reset=true replaces the first-page cache and reconciles only that page', async () => {
    const staleLocal = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-08-11T00:00:00Z',
    })
    const firstPage = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000002',
      occurredAt: '2026-08-12T00:00:00Z',
    })
    vi.mocked(listTransactions).mockResolvedValueOnce({
      data: page([firstPage, { ...firstPage, version: firstPage.version + 1 }]),
      meta: meta(),
    })
    const store = useTransactionStore()
    store.recordCreatedTransaction(staleLocal)

    await store.fetchTransactions(true)

    expect(store.transactions.map((item) => item.id)).toEqual([firstPage.id])
    expect(store.transactions[0]?.version).toBe(firstPage.version + 1)
  })

  it('lets an authoritative reconciliation fetch supersede an older in-flight transaction fetch', async () => {
    const staleBeforeImport = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000001',
      occurredAt: '2026-08-10T00:00:00Z',
    })
    const imported = generatedTransaction({
      id: '00000000-0000-4000-8000-000000000002',
      occurredAt: '2026-08-12T00:00:00Z',
      source: 'statement',
    })
    const oldFetch = createDeferred<{ data: TransactionPageResponse; meta: ReturnType<typeof meta> }>()
    vi.mocked(listTransactions)
      .mockReturnValueOnce(oldFetch.promise)
      .mockResolvedValueOnce({
        data: page([imported], '2026-08-12T00:00:00Z', imported.id),
        meta: meta(),
      })
    vi.mocked(getMonthlySummary).mockResolvedValue({
      data: {
        totalSpend: '12.3400',
        currency: 'MYR',
        transactionCount: 1,
        byCategory: [],
      },
      meta: meta(),
    })
    const store = useTransactionStore()

    const oldRequest = store.fetchTransactions(true)
    expect(store.loading).toBe(true)
    await store.reconcileAfterFinancialMutation({ refreshTransactions: true })

    expect(listTransactions).toHaveBeenCalledTimes(2)
    expect(store.transactions.map((item) => item.id)).toEqual([imported.id])
    expect(store.nextCursor).toBe('2026-08-12T00:00:00Z')
    expect(store.nextCursorId).toBe(imported.id)

    oldFetch.resolve({ data: page([staleBeforeImport], '2026-08-10T00:00:00Z', staleBeforeImport.id), meta: meta() })
    await oldRequest

    expect(store.transactions.map((item) => item.id)).toEqual([imported.id])
    expect(store.nextCursor).toBe('2026-08-12T00:00:00Z')
    expect(store.nextCursorId).toBe(imported.id)
  })

  it('ignores an older monthly summary response after a newer summary request wins', async () => {
    const oldSummary = createDeferred<{
      data: {
        totalSpend: string
        currency: 'MYR'
        transactionCount: number
        byCategory: never[]
      }
      meta: ReturnType<typeof meta>
    }>()
    vi.mocked(getMonthlySummary)
      .mockReturnValueOnce(oldSummary.promise)
      .mockResolvedValueOnce({
        data: {
          totalSpend: '22.0000',
          currency: 'MYR',
          transactionCount: 2,
          byCategory: [],
        },
        meta: meta(),
      })
    const store = useTransactionStore()

    const older = store.fetchMonthlySummary(2026, 7)
    await store.fetchMonthlySummary(2026, 8)
    oldSummary.resolve({
      data: {
        totalSpend: '11.0000',
        currency: 'MYR',
        transactionCount: 1,
        byCategory: [],
      },
      meta: meta(),
    })
    await older

    expect(store.monthlySummary).toMatchObject({
      totalSpend: '22.0000',
      transactionCount: 2,
    })
    expect(store.monthlySummaryStatus).toBe('loaded')
  })
})

function meta() {
  return {
    timestamp: '2026-08-11T00:00:00Z',
    requestId: 'request-id',
  }
}

function generatedTransaction(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: '22222222-2222-4222-8222-222222222222',
    amount: '12.3400',
    currency: 'MYR',
    amountMyr: '12.3400',
    fxRate: '1.000000',
    source: 'manual',
    occurredAt: '2026-08-11T00:00:00Z',
    version: 3,
    createdAt: '2026-08-11T00:00:00Z',
    ...overrides,
  }
}

function page(
  transactions: TransactionResponse[],
  nextCursor: string | null = null,
  nextCursorId: string | null = null,
): TransactionPageResponse {
  return {
    transactions,
    hasMore: Boolean(nextCursor && nextCursorId),
    nextCursor: nextCursor ?? undefined,
    nextCursorId: nextCursorId ?? undefined,
  }
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

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}
