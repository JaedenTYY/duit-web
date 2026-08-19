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
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const nextCursor = ref<string | null>(null)
  const nextCursorId = ref<string | null>(null)
  const hasMore = ref(false)
  const selectedCategoryId = ref<string>('')

  async function fetchTransactions(reset = false) {
    if (loading.value) return
    
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

      if (reset) {
        transactions.value = data.transactions as Transaction[]
      } else {
        transactions.value = [...transactions.value, ...(data.transactions as Transaction[])]
      }

      nextCursor.value = data.nextCursor ?? null
      nextCursorId.value = data.nextCursorId ?? null
      hasMore.value = data.hasMore
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to fetch transactions', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) return

    try {
      const response = await listCategories()
      categories.value = response.data as Category[]
    } catch (err: unknown) {
      logger.error('Failed to fetch categories', err)
    }
  }

  async function fetchMonthlySummary(year: number, month: number) {
    logger.log('fetchMonthlySummary called with:', { year, month })
    try {
      const response = await getMonthlySummaryContract({ year, month: String(month) })
      logger.log('fetchMonthlySummary success:', response.data)
      monthlySummary.value = response.data as MonthlySummary
    } catch (err: unknown) {
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

  async function createTransaction(
    payload: CreateTransactionPayload,
    operationKey: string,
  ): Promise<Transaction> {
    submitting.value = true
    error.value = null
    try {
      const response = await createTransactionContract(payload, { 'Idempotency-Key': operationKey })
      const newTransaction = response.data as Transaction
      recordCreatedTransaction(newTransaction)
      return newTransaction
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
    submitting.value = true
    error.value = null
    try {
      const response = await updateTransactionContract(id, payload)
      const updatedTransaction = response.data as Transaction
      replaceTransaction(updatedTransaction)
      return updatedTransaction
    } catch (err: unknown) {
      error.value = _extractError(err)
      if (extractApiFailure(err).code === 'ERR_TX_STALE_409') {
        throw new TransactionStaleConflictError(await fetchTransaction(id))
      }
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function deleteTransaction(id: string, expectedVersion: number): Promise<void> {
    submitting.value = true
    error.value = null
    try {
      await deleteTransactionContract(id, { expectedVersion })
      transactions.value = transactions.value.filter(t => t.id !== id)
    } catch (err: unknown) {
      error.value = _extractError(err)
      if (extractApiFailure(err).code === 'ERR_TX_STALE_409') {
        throw new TransactionStaleConflictError(await fetchTransaction(id))
      }
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function fetchTransaction(id: string): Promise<Transaction | null> {
    try {
      const response = await getTransactionContract(id)
      const current = response.data as Transaction
      recordCreatedTransaction(current)
      return current
    } catch (err: unknown) {
      if (extractApiFailure(err).status === 404) {
        transactions.value = transactions.value.filter(transaction => transaction.id !== id)
        return null
      }
      throw err
    }
  }

  function setCategoryFilter(categoryId: string) {
    selectedCategoryId.value = categoryId
    nextCursor.value = null
    nextCursorId.value = null
    hasMore.value = false
  }

  function reset() {
    transactions.value = []
    categories.value = []
    monthlySummary.value = null
    loading.value = false
    submitting.value = false
    error.value = null
    nextCursor.value = null
    nextCursorId.value = null
    hasMore.value = false
    selectedCategoryId.value = ''
  }

  function recordCreatedTransaction(transaction: Transaction) {
    const withoutDuplicate = transactions.value.filter(existing => existing.id !== transaction.id)
    transactions.value = [transaction, ...withoutDuplicate]
  }

  function replaceTransaction(transaction: Transaction) {
    const index = transactions.value.findIndex(existing => existing.id === transaction.id)
    if (index === -1) {
      recordCreatedTransaction(transaction)
      return
    }
    transactions.value[index] = transaction
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
    loading,
    submitting,
    error,
    nextCursor,
    nextCursorId,
    hasMore,
    selectedCategoryId,
    fetchTransactions,
    fetchCategories,
    fetchMonthlySummary,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    recordCreatedTransaction,
    setCategoryFilter,
    reset,
  }
})
