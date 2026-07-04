import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

export interface TaxCategorySummary {
  categoryName: string
  categoryIcon: string | null
  totalAmount: string
  transactionCount: number
}

export interface TaxSummaryResponse {
  year: number
  totalBusinessExpenses: string
  totalPersonalExpenses: string
  businessDeductionsByCategory: TaxCategorySummary[]
  recentBusinessTransactions: any[]
}

export const useTaxStore = defineStore('tax', () => {
  const summary = ref<TaxSummaryResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTaxSummary(year: number) {
    loading.value = true
    error.value = null

    try {
      const response = await api.get<TaxSummaryResponse>(`/tax/summary?year=${year}`)
      summary.value = response.data
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to fetch tax summary', err)
    } finally {
      loading.value = false
    }
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
    }
    return 'An unexpected error occurred'
  }

  return {
    summary,
    loading,
    error,
    fetchTaxSummary
  }
})
