import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Transaction, Category, MonthlySummary } from '@/types'
import { logger } from '@/utils/logger'
import { extractApiFailure } from '@/lib/apiError'
import { listCategories } from '@/api/generated/category-controller/category-controller'
import {
  createTransaction as createTransactionContract,
  deleteTransaction as deleteTransactionContract,
  getMonthlySummary as getMonthlySummaryContract,
  getTransaction as getTransactionContract,
  listTransactions as listTransactionsContract,
  updateTransaction as updateTransactionContract,
} from '@/api/generated/transaction-controller/transaction-controller'
import type {
  CreateTransactionRequest,
  ListTransactionsParams,
  UpdateTransactionRequest,
} from '@/api/generated/model'
import { currentReportingYearMonth } from '@/utils/localDateTime'
import {
  captureUserScopeEpoch,
  isCurrentUserScope,
  isUserScopeStaleError,
  throwIfUserScopeStale,
  UserScopeStaleError,
} from '@/stores/resetUserScopedState'

export type CreateTransactionPayload = CreateTransactionRequest
export type UpdateTransactionPayload = UpdateTransactionRequest

export class TransactionStaleConflictError extends Error {
  constructor(readonly current: Transaction | null) {
    super('This transaction changed while you were editing it. Review the latest values before saving again.')
    this.name = 'TransactionStaleConflictError'
  }
}

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const categories = ref<Category[]>([])
  const monthlySummary = ref<MonthlySummary | null>(null)
  const monthlySummaryStatus = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const monthlySummaryError = ref<string | null>(null)
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const nextCursor = ref<string | null>(null)
  const nextCursorId = ref<string | null>(null)
  const hasMore = ref(false)
  let fetchGeneration = 0
  let summaryGeneration = 0

  async function fetchTransactions(reset = false) {
    if (loading.value && !reset) return
    const scope = captureUserScopeEpoch()
    const generation = reset ? ++fetchGeneration : fetchGeneration
    
    loading.value = true
    error.value = null
    
    try {
      const params: ListTransactionsParams = { limit: 20 }
      if (!reset && nextCursor.value && nextCursorId.value) {
        params.cursor = nextCursor.value
        params.cursorId = nextCursorId.value
      }

      const response = await listTransactionsContract(params)
      const data = response.data
      if (!isCurrentUserScope(scope) || generation !== fetchGeneration) return

      if (reset) {
        transactions.value = mergeTransactionCache([], data.transactions)
      } else {
        transactions.value = mergeTransactionCache(transactions.value, data.transactions)
      }

      nextCursor.value = data.nextCursor ?? null
      nextCursorId.value = data.nextCursorId ?? null
      hasMore.value = data.hasMore
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope) || generation !== fetchGeneration) return
      error.value = _extractError(err)
      logger.error('Failed to fetch transactions', err)
    } finally {
      if (isCurrentUserScope(scope) && generation === fetchGeneration) loading.value = false
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) return
    const scope = captureUserScopeEpoch()

    try {
      const response = await listCategories()
      if (!isCurrentUserScope(scope)) return
      categories.value = response.data
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      logger.error('Failed to fetch categories', err)
    }
  }

  async function fetchMonthlySummary(year: number, month: number) {
    const scope = captureUserScopeEpoch()
    const generation = ++summaryGeneration
    logger.log('fetchMonthlySummary called with:', { year, month })
    monthlySummaryStatus.value = 'loading'
    monthlySummaryError.value = null
    try {
      const response = await getMonthlySummaryContract({ year, month: String(month) })
      if (!isCurrentUserScope(scope) || generation !== summaryGeneration) return
      logger.log('fetchMonthlySummary success:', response.data)
      monthlySummary.value = response.data
      monthlySummaryStatus.value = 'loaded'
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope) || generation !== summaryGeneration) return
      monthlySummaryStatus.value = 'error'
      monthlySummaryError.value = _extractError(err)
      logger.error('Failed to fetch monthly summary', err)
      // Attempt to log more detail if it's an axios error
      if (err && typeof err === 'object' && 'isAxiosError' in err) {
        const axiosError = err as any
        logger.error('Axios Error Details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            params: axiosError.config?.params
          }
        })
      }
    }
  }

  async function refreshCurrentMonthSummary(): Promise<void> {
    const { year, month } = currentReportingYearMonth()
    await fetchMonthlySummary(year, month)
  }

  async function reconcileAfterFinancialMutation(options: { refreshTransactions?: boolean } = {}): Promise<void> {
    const scope = captureUserScopeEpoch()
    const tasks: Promise<void>[] = [refreshCurrentMonthSummary()]
    if (options.refreshTransactions) {
      tasks.push(fetchTransactions(true))
    }
    await Promise.all(tasks)
    throwIfUserScopeStale(scope)
  }

  async function createTransaction(
    payload: CreateTransactionPayload,
    operationKey: string,
  ): Promise<Transaction> {
    const scope = captureUserScopeEpoch()
    submitting.value = true
    error.value = null
    try {
      const response = await createTransactionContract(payload, { 'Idempotency-Key': operationKey })
      throwIfUserScopeStale(scope)
      const newTransaction = response.data
      recordCreatedTransaction(newTransaction)
      await reconcileAfterFinancialMutation()
      throwIfUserScopeStale(scope)
      return newTransaction
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = _extractError(err)
      throw err
    } finally {
      if (isCurrentUserScope(scope)) submitting.value = false
    }
  }

  async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
    const scope = captureUserScopeEpoch()
    submitting.value = true
    error.value = null
    try {
      const response = await updateTransactionContract(id, payload)
      throwIfUserScopeStale(scope)
      const updatedTransaction = response.data
      replaceTransaction(updatedTransaction)
      await reconcileAfterFinancialMutation()
      throwIfUserScopeStale(scope)
      return updatedTransaction
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = _extractError(err)
      if (extractApiFailure(err).code === 'ERR_TX_STALE_409') {
        throw new TransactionStaleConflictError(await fetchTransaction(id))
      }
      throw err
    } finally {
      if (isCurrentUserScope(scope)) submitting.value = false
    }
  }

  async function deleteTransaction(id: string, expectedVersion: number): Promise<void> {
    const scope = captureUserScopeEpoch()
    submitting.value = true
    error.value = null
    try {
      await deleteTransactionContract(id, { expectedVersion })
      throwIfUserScopeStale(scope)
      transactions.value = transactions.value.filter(t => t.id !== id)
      await reconcileAfterFinancialMutation()
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = _extractError(err)
      if (extractApiFailure(err).code === 'ERR_TX_STALE_409') {
        throw new TransactionStaleConflictError(await fetchTransaction(id))
      }
      throw err
    } finally {
      if (isCurrentUserScope(scope)) submitting.value = false
    }
  }

  async function fetchTransaction(id: string): Promise<Transaction | null> {
    const scope = captureUserScopeEpoch()
    try {
      const response = await getTransactionContract(id)
      throwIfUserScopeStale(scope)
      const current = response.data
      recordCreatedTransaction(current)
      return current
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      if (extractApiFailure(err).status === 404) {
        transactions.value = transactions.value.filter(transaction => transaction.id !== id)
        return null
      }
      throw err
    }
  }

  function reset() {
    fetchGeneration += 1
    summaryGeneration += 1
    transactions.value = []
    categories.value = []
    monthlySummary.value = null
    monthlySummaryStatus.value = 'idle'
    monthlySummaryError.value = null
    loading.value = false
    submitting.value = false
    error.value = null
    nextCursor.value = null
    nextCursorId.value = null
    hasMore.value = false
  }

  function recordCreatedTransaction(transaction: Transaction) {
    transactions.value = mergeTransactionCache(transactions.value, [transaction])
  }

  function replaceTransaction(transaction: Transaction) {
    transactions.value = mergeTransactionCache(transactions.value, [transaction])
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
    }
    return 'An unexpected error occurred'
  }

  return {
    transactions,
    categories,
    monthlySummary,
    monthlySummaryStatus,
    monthlySummaryError,
    loading,
    submitting,
    error,
    nextCursor,
    nextCursorId,
    hasMore,
    fetchTransactions,
    fetchCategories,
    fetchMonthlySummary,
    refreshCurrentMonthSummary,
    reconcileAfterFinancialMutation,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    recordCreatedTransaction,
    reset,
  }
})

function mergeTransactionCache(
  existing: readonly Transaction[],
  incoming: readonly Transaction[],
): Transaction[] {
  const byId = new Map<string, Transaction>()

  for (const transaction of [...existing, ...incoming]) {
    const current = byId.get(transaction.id)
    if (!current || transaction.version >= current.version) {
      byId.set(transaction.id, transaction)
    }
  }

  return [...byId.values()].sort(compareTransactionOrder)
}

function compareTransactionOrder(left: Transaction, right: Transaction) {
  const occurredAt = instantSortKey(right.occurredAt).localeCompare(instantSortKey(left.occurredAt))
  if (occurredAt !== 0) return occurredAt
  return right.id.localeCompare(left.id)
}

function instantSortKey(value: string): string {
  const normalized = value.replace(/\+00:00$/, 'Z')
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/.exec(normalized)
  if (!match) return normalized
  return `${match[1]}.${(match[2] ?? '').padEnd(9, '0')}Z`
}
