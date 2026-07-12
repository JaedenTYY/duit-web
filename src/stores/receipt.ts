import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReceiptExtractionResponse, Transaction } from '@/types'
import api from '@/lib/api'
import { normalizeReceiptUploadError, validateReceiptImageFile } from '@/utils/receiptFile'

export interface ConfirmExtractionPayload {
  extractionId: string
  amount: number
  currency: string
  categoryId?: string
  description?: string
  occurredAt: string
  fxRate?: number
  merchantName?: string
}

interface ExtractionApiResponse {
  data: ReceiptExtractionResponse
}

interface TransactionApiResponse {
  data: Transaction
}

export const useReceiptStore = defineStore('receipt', () => {
  const uploading = ref(false)
  const confirming = ref(false)
  const extraction = ref<ReceiptExtractionResponse | null>(null)
  const error = ref<string | null>(null)

  async function uploadReceipt(file: File): Promise<ReceiptExtractionResponse> {
    uploading.value = true
    error.value = null
    try {
      const validationError = validateReceiptImageFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<ExtractionApiResponse>('/receipt/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      const data = response.data.data
      extraction.value = data
      return data
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      uploading.value = false
    }
  }

  async function confirmExtraction(payload: ConfirmExtractionPayload): Promise<Transaction> {
    confirming.value = true
    error.value = null
    try {
      const response = await api.post<TransactionApiResponse>('/receipt/confirm', payload)
      extraction.value = null
      return response.data.data
    } catch (err: unknown) {
      error.value = _extractError(err)
      throw err
    } finally {
      confirming.value = false
    }
  }

  function reset() {
    uploading.value = false
    confirming.value = false
    extraction.value = null
    error.value = null
  }

  function _extractError(err: unknown): string {
    if (err instanceof Error) {
      return normalizeReceiptUploadError(err.message)
    }

    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return normalizeReceiptUploadError(axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred during scanning')
    }
    return 'An unexpected error occurred'
  }

  return {
    uploading,
    confirming,
    extraction,
    error,
    uploadReceipt,
    confirmExtraction,
    reset,
  }
})
