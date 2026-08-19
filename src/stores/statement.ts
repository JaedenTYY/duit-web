import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { StatementImportResult, StatementUpload } from '@/types'
import {
  _delete as deleteStatementUpload,
  confirm as confirmStatementUpload,
  get as getStatementUpload,
  upload as uploadStatementContract,
} from '@/api/generated/statement-controller/statement-controller'
import { logger } from '@/utils/logger'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'

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
      const response = await uploadStatementContract({ file })
      upload.value = response.data as StatementUpload
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
      const response = await confirmStatementUpload(upload.value.id, {
        rows: rows.map(row => ({
          ...row,
          rememberMerchantCategory: false,
        })),
      })
      result.value = response.data as StatementImportResult
      const refreshed = await getStatementUpload(upload.value.id)
      upload.value = refreshed.data as StatementUpload
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
      await deleteStatementUpload(upload.value.id)
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
      return apiFailureMessage(extractApiFailure(err), 'Statement import failed')
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
