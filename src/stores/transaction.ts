import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, Category, MonthlySummary } from '@/types'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

export interface CreateTransactionPayload {
  amount: number
  currency: string
  categoryId?: string
  description?: string
  occurredAt: string
  fxRate?: number
}

interface TransactionResponse {
  data: Transaction
}

interface TransactionPageResponse {
  data: {
    transactions: Transaction[]
    nextCursor: string | null
    nextCursorId: string | null
    hasMore: boolean
  }
}

interface CategoriesResponse {
  data: Category[]
}

interface MonthlySummaryResponse {
  data: MonthlySummary
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

  const totalSpend = computed(() => parseFloat(monthlySummary.value?.totalSpend ?? '0'))

  async function fetchTransactions(reset = false) {
    if (loading.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const params: Record<string, string | number> = { limit: 20 }
      if (!reset && nextCursor.value && nextCursorId.value) {
        params.cursor = nextCursor.value
        params.cursorId = nextCursorId.value
      }

      const response = await api.get<TransactionPageResponse>('/transactions', { params })
      const data = response.data.data

      if (reset) {
        transactions.value = data.transactions
      } else {
        transactions.value = [...transactions.value, ...data.transactions]
      }

      nextCursor.value = data.nextCursor
      nextCursorId.value = data.nextCursorId
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
      const response = await api.get<CategoriesResponse>('/categories')
      categories.value = response.data.data
    } catch (err: unknown) {
      logger.error('Failed to fetch categories', err)
    }
  }

  async function fetchMonthlySummary(year: number, month: number) {
    try {
      const response = await api.get<MonthlySummaryResponse>('/transactions/summary/monthly', {
        params: { year, month }
      })
      monthlySummary.value = response.data.data
    } catch (err: unknown) {
      logger.error('Failed to fetch monthly summary', err)
    }
  }

  async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
    submitting.value = true
    error.value = null
    try {
      const response = await api.post<TransactionResponse>('/transactions', payload)
      const newTransaction = response.data.data
      transactions.value = [newTransaction, ...transactions.value]
      return newTransaction
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function deleteTransaction(id: string): Promise<void> {
    submitting.value = true
    error.value = null
    try {
      await api.delete(`/transactions/${id}`)
      transactions.value = transactions.value.filter(t => t.id !== id)
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      submitting.value = false
    }
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
    totalSpend,
    fetchTransactions,
    fetchCategories,
    fetchMonthlySummary,
    createTransaction,
    deleteTransaction,
    reset,
  }
})
