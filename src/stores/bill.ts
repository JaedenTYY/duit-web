import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/api'
import type { Bill } from '@/types'

interface BillApiResponse {
  data: Bill
}

export const useBillStore = defineStore('bill', () => {
  const bill = ref<Bill | null>(null)
  const uploading = ref(false)
  const error = ref<string | null>(null)

  async function createFromReceipt(file: File): Promise<Bill> {
    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<BillApiResponse>('/bills/from-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      bill.value = response.data.data
      return bill.value
    } catch (requestError: unknown) {
      error.value = extractError(requestError)
      throw requestError
    } finally {
      uploading.value = false
    }
  }

  function reset() {
    bill.value = null
    error.value = null
  }

  function extractError(requestError: unknown): string {
    if (requestError && typeof requestError === 'object' && 'response' in requestError) {
      const axiosError = requestError as {
        response?: { data?: { error?: { message?: string } } }
      }
      return axiosError.response?.data?.error?.message ?? 'Bill creation failed'
    }
    return 'Bill creation failed'
  }

  return {
    bill,
    uploading,
    error,
    createFromReceipt,
    reset
  }
})
