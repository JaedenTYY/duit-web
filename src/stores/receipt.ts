import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ReceiptExtractionResponse, Transaction } from '@/types'
import {
  confirmExtraction as confirmExtractionContract,
  uploadReceipt as uploadReceiptContract,
} from '@/api/generated/receipt-controller/receipt-controller'
import type { ConfirmExtractionRequest } from '@/api/generated/model'
import { normalizeReceiptUploadError, validateReceiptImageFile } from '@/utils/receiptFile'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'
import {
  captureUserScopeEpoch,
  isCurrentUserScope,
  isUserScopeStaleError,
  UserScopeStaleError,
  throwIfUserScopeStale,
} from '@/stores/resetUserScopedState'

export type ConfirmExtractionPayload = ConfirmExtractionRequest

export const useReceiptStore = defineStore('receipt', () => {
  const uploading = ref(false)
  const confirming = ref(false)
  const extraction = ref<ReceiptExtractionResponse | null>(null)
  const error = ref<string | null>(null)

  async function uploadReceipt(file: File): Promise<ReceiptExtractionResponse> {
    const scope = captureUserScopeEpoch()
    uploading.value = true
    error.value = null
    try {
      const validationError = validateReceiptImageFile(file)
      if (validationError) {
        throw new Error(validationError)
      }

      const response = await uploadReceiptContract({ file })
      throwIfUserScopeStale(scope)
      const data = response.data
      extraction.value = data
      return data
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = _extractError(err)
      throw err
    } finally {
      if (isCurrentUserScope(scope)) uploading.value = false
    }
  }

  async function confirmExtraction(payload: ConfirmExtractionPayload): Promise<Transaction> {
    const scope = captureUserScopeEpoch()
    confirming.value = true
    error.value = null
    try {
      const response = await confirmExtractionContract(payload)
      throwIfUserScopeStale(scope)
      extraction.value = null
      return response.data
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = _extractError(err)
      throw err
    } finally {
      if (isCurrentUserScope(scope)) confirming.value = false
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
