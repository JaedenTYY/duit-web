import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EmailExtraction, GmailStatus, GmailSyncResult } from '@/types'
import { logger } from '@/utils/logger'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'
import { disconnectGmail } from '@/lib/privacyTransport'
import {
  confirm1 as confirmEmailExtraction,
  connect as connectGmail,
  extractions as listEmailExtractions,
  skip as skipEmailExtraction,
  status as getGmailStatus,
  sync as syncGmail,
} from '@/api/generated/gmail-controller/gmail-controller'
import {
  captureUserScopeEpoch,
  isCurrentUserScope,
} from '@/stores/resetUserScopedState'

export const useGmailStore = defineStore('gmail', () => {
  const status = ref<GmailStatus | null>(null)
  const extractions = ref<EmailExtraction[]>([])
  const lastSync = ref<GmailSyncResult | null>(null)
  const loading = ref(false)
  const connecting = ref(false)
  const syncing = ref(false)
  const disconnecting = ref(false)
  const actionIds = ref<Set<string>>(new Set())
  const error = ref<string | null>(null)
  const errorRequestId = ref<string | null>(null)

  async function initialise() {
    const scope = captureUserScopeEpoch()
    loading.value = true
    error.value = null
    try {
      const response = await getGmailStatus()
      if (!isCurrentUserScope(scope)) return
      status.value = response.data
      if (status.value.connected) await fetchExtractions()
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      handleError('Failed to load Gmail status', err)
    } finally {
      if (isCurrentUserScope(scope)) loading.value = false
    }
  }

  async function connect() {
    const scope = captureUserScopeEpoch()
    connecting.value = true
    error.value = null
    try {
      const response = await connectGmail()
      if (!isCurrentUserScope(scope)) return
      if (response.data.authorizationUrl) {
        window.location.assign(response.data.authorizationUrl)
        return
      }
      await initialise()
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      handleError('Failed to connect Gmail', err)
    } finally {
      if (isCurrentUserScope(scope)) connecting.value = false
    }
  }

  async function disconnect(deleteExtractions = false) {
    if (disconnecting.value) return false
    const scope = captureUserScopeEpoch()
    disconnecting.value = true
    error.value = null
    try {
      await disconnectGmail(deleteExtractions)
      if (!isCurrentUserScope(scope)) return false
      status.value = status.value
        ? { ...status.value, connected: false, providerEmail: undefined, connectedAt: undefined, scopes: [] }
        : null
      extractions.value = []
      lastSync.value = null
      return true
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return false
      handleError('Failed to disconnect Gmail', err)
      return false
    } finally {
      if (isCurrentUserScope(scope)) disconnecting.value = false
    }
  }

  async function sync() {
    const scope = captureUserScopeEpoch()
    syncing.value = true
    error.value = null
    try {
      const response = await syncGmail()
      if (!isCurrentUserScope(scope)) return
      lastSync.value = response.data
      await fetchExtractions()
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      handleError('Failed to sync eReceipts', err)
    } finally {
      if (isCurrentUserScope(scope)) syncing.value = false
    }
  }

  async function fetchExtractions() {
    const scope = captureUserScopeEpoch()
    const response = await listEmailExtractions({ status: 'pending' })
    if (!isCurrentUserScope(scope)) return
    extractions.value = response.data
  }

  async function confirm(extractionId: string, categoryId?: string): Promise<boolean> {
    if (actionIds.value.has(extractionId)) return false
    const scope = captureUserScopeEpoch()
    actionIds.value.add(extractionId)
    error.value = null
    try {
      await confirmEmailExtraction(extractionId, {
        categoryId,
        rememberMerchantCategory: false,
      })
      if (!isCurrentUserScope(scope)) return false
      extractions.value = extractions.value.filter((item) => item.id !== extractionId)
      return true
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return false
      handleError('Failed to confirm eReceipt', err)
      return false
    } finally {
      if (isCurrentUserScope(scope)) actionIds.value.delete(extractionId)
    }
  }

  async function skip(extractionId: string) {
    if (actionIds.value.has(extractionId)) return
    const scope = captureUserScopeEpoch()
    actionIds.value.add(extractionId)
    error.value = null
    try {
      await skipEmailExtraction(extractionId)
      if (!isCurrentUserScope(scope)) return
      extractions.value = extractions.value.filter((item) => item.id !== extractionId)
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      handleError('Failed to skip eReceipt', err)
    } finally {
      if (isCurrentUserScope(scope)) actionIds.value.delete(extractionId)
    }
  }

  function handleError(message: string, err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const failure = extractApiFailure(err)
      error.value = apiFailureMessage(failure, message)
      errorRequestId.value = failure.requestId
      logger.error(message, {
        status: failure.status,
        code: failure.code,
        requestId: failure.requestId,
      })
    } else {
      error.value = message
      errorRequestId.value = null
      logger.error(message)
    }
  }

  function reset() {
    status.value = null
    extractions.value = []
    lastSync.value = null
    loading.value = false
    connecting.value = false
    syncing.value = false
    disconnecting.value = false
    actionIds.value = new Set()
    error.value = null
    errorRequestId.value = null
  }

  return {
    status,
    extractions,
    lastSync,
    loading,
    connecting,
    syncing,
    disconnecting,
    actionIds,
    error,
    errorRequestId,
    initialise,
    connect,
    disconnect,
    sync,
    confirm,
    skip,
    reset,
  }
})
