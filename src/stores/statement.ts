import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StatementImportResult, StatementUpload } from '@/types'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

interface ConfirmRow {
  rowId: string
  categoryId?: string
}

export const useStatementStore = defineStore('statement', () => {
  const upload = ref<StatementUpload | null>(null)
  const result = ref<StatementImportResult | null>(null)
  const uploading = ref(false)
  const confirming = ref(false)
  const error = ref<string | null>(null)

  async function uploadStatement(file: File) {
    uploading.value = true
    error.value = null
    result.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post<{ data: StatementUpload }>('/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      upload.value = response.data.data
      return upload.value
    } catch (err: unknown) {
      error.value = extractError(err)
      logger.error('Failed to upload bank statement', err)
      throw err
    } finally {
      uploading.value = false
    }
  }

  async function confirmRows(rows: ConfirmRow[]) {
    if (!upload.value) return
    confirming.value = true
    error.value = null
    try {
      const response = await api.post<{ data: StatementImportResult }>(
        `/statements/${upload.value.id}/confirm`,
        { rows },
      )
      result.value = response.data.data
      const refreshed = await api.get<{ data: StatementUpload }>(`/statements/${upload.value.id}`)
      upload.value = refreshed.data.data
    } catch (err: unknown) {
      error.value = extractError(err)
      logger.error('Failed to import statement rows', err)
      throw err
    } finally {
      confirming.value = false
    }
  }

  async function discardUpload() {
    if (upload.value?.status === 'pending') {
      await api.delete(`/statements/${upload.value.id}`)
    }
    reset()
  }

  function reset() {
    upload.value = null
    result.value = null
    uploading.value = false
    confirming.value = false
    error.value = null
  }

  function extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosError.response?.data?.error?.message ?? 'Statement import failed'
    }
    return 'Statement import failed'
  }

  return {
    upload,
    result,
    uploading,
    confirming,
    error,
    uploadStatement,
    confirmRows,
    discardUpload,
    reset,
  }
})
