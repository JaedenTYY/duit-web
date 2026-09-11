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
import {
  captureUserScopeEpoch,
  isCurrentUserScope,
  isUserScopeStaleError,
  UserScopeStaleError,
  throwIfUserScopeStale,
} from '@/stores/resetUserScopedState'

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
  const refreshError = ref<string | null>(null)

  async function uploadStatement(file: File) {
    const scope = captureUserScopeEpoch()
    uploading.value = true
    error.value = null
    refreshError.value = null
    result.value = null
    try {
      const response = await uploadStatementContract({ file })
      throwIfUserScopeStale(scope)
      upload.value = response.data
      return upload.value
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = extractError(err)
      logger.error('Failed to upload bank statement', err)
      throw err
    } finally {
      if (isCurrentUserScope(scope)) uploading.value = false
    }
  }

  async function confirmRows(rows: ConfirmRow[]) {
    if (!upload.value) return
    const scope = captureUserScopeEpoch()
    const uploadId = upload.value.id
    confirming.value = true
    error.value = null
    refreshError.value = null
    try {
      const response = await confirmStatementUpload(uploadId, {
        rows: rows.map(row => ({
          ...row,
          rememberMerchantCategory: false,
        })),
      })
      throwIfUserScopeStale(scope)
      result.value = response.data
      try {
        const refreshed = await getStatementUpload(uploadId)
        throwIfUserScopeStale(scope)
        upload.value = refreshed.data
      } catch (refreshFailure: unknown) {
        if (isUserScopeStaleError(refreshFailure)) throw refreshFailure
        if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
        refreshError.value = 'Import succeeded, but Duit could not refresh the statement draft. Open Transactions to verify the imported rows.'
        logger.error('Failed to refresh statement upload after import', refreshFailure)
      }
    } catch (err: unknown) {
      if (isUserScopeStaleError(err)) throw err
      if (!isCurrentUserScope(scope)) throw new UserScopeStaleError()
      error.value = extractError(err)
      logger.error('Failed to import statement rows', err)
      throw err
    } finally {
      if (isCurrentUserScope(scope)) confirming.value = false
    }
  }

  async function discardUpload() {
    const scope = captureUserScopeEpoch()
    if (upload.value?.status === 'pending') {
      const uploadId = upload.value.id
      await deleteStatementUpload(uploadId)
      throwIfUserScopeStale(scope)
    }
    reset()
  }

  function reset() {
    upload.value = null
    result.value = null
    uploading.value = false
    confirming.value = false
    error.value = null
    refreshError.value = null
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
    refreshError,
    uploadStatement,
    confirmRows,
    discardUpload,
    reset,
  }
})
