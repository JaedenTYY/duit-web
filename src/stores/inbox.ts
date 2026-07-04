import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import { logger } from '@/utils/logger'
import type { ReceiptExtractionResponse } from '@/types'

interface ConfirmReceiptData {
  amount: number
  currency: string
  categoryId?: string
  description?: string
  occurredAt: string
  merchantName?: string
}

export const useInboxStore = defineStore('inbox', () => {
  const pendingReceipts = ref<ReceiptExtractionResponse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPendingReceipts() {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
      const response = await api.get<ReceiptExtractionResponse[]>('/receipt/pending')
      pendingReceipts.value = response.data
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to fetch pending receipts', err)
    } finally {
      loading.value = false
    }
  }

  async function confirmReceipt(
    extractionId: string, 
    data: ConfirmReceiptData,
    isBusiness: boolean, 
    businessPurpose: string | null
  ) {
    try {
      await api.post('/receipt/confirm', {
        extractionId,
        amount: data.amount,
        currency: data.currency || 'MYR',
        categoryId: data.categoryId,
        description: data.description,
        occurredAt: data.occurredAt,
        merchantName: data.merchantName,
        isBusiness,
        businessPurpose
      })
      
      // Remove from pending list
      pendingReceipts.value = pendingReceipts.value.filter(r => r.extractionId !== extractionId)
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to confirm receipt', err)
      throw err
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
    pendingReceipts,
    loading,
    error,
    fetchPendingReceipts,
    confirmReceipt
  }
})
