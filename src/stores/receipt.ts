import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReceiptExtractionResponse, Transaction } from '@/types'
import api from '@/lib/api'
import { uploadReceipt as uploadReceiptContract } from '@/api/generated/receipt-controller/receipt-controller'
import { normalizeReceiptUploadError, validateReceiptImageFile } from '@/utils/receiptFile'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'

export interface ConfirmExtractionPayload {
  extractionId: string
  amount: string
  currency: string
  categoryId?: string
  description?: string
  occurredAt: string
  fxRate?: string
  merchantName?: string
  rememberMerchantCategory?: boolean
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

      const response = await uploadReceiptContract({ file })
      const data = response.data as ReceiptExtractionResponse
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
    if (err && typeof err === 'object' && 'response' in err) {
      const failure = extractApiFailure(err)
      return apiFailureMessage(
        { ...failure, message: normalizeReceiptUploadError(failure.message) }
      )
    }
    if (err instanceof Error) {
      return normalizeReceiptUploadError(err.message)
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
