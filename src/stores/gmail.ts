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
    loading.value = true
    error.value = null
    try {
      const response = await getGmailStatus()
      status.value = response.data
      if (status.value.connected) await fetchExtractions()
    } catch (err: unknown) {
      handleError('Failed to load Gmail status', err)
    } finally {
      loading.value = false
    }
  }

  async function connect() {
    connecting.value = true
    error.value = null
    try {
      const response = await connectGmail()
      if (response.data.authorizationUrl) {
        window.location.assign(response.data.authorizationUrl)
        return
      }
      await initialise()
    } catch (err: unknown) {
      handleError('Failed to connect Gmail', err)
    } finally {
      connecting.value = false
    }
  }

  async function disconnect(deleteExtractions = false) {
    if (disconnecting.value) return false
    disconnecting.value = true
    error.value = null
    try {
      await disconnectGmail(deleteExtractions)
      status.value = status.value
        ? { ...status.value, connected: false, providerEmail: undefined, connectedAt: undefined, scopes: [] }
        : null
      extractions.value = []
      lastSync.value = null
      return true
    } catch (err: unknown) {
      handleError('Failed to disconnect Gmail', err)
      return false
    } finally {
      disconnecting.value = false
    }
  }

  async function sync() {
    syncing.value = true
    error.value = null
    try {
      const response = await syncGmail()
      lastSync.value = response.data
      await fetchExtractions()
    } catch (err: unknown) {
      handleError('Failed to sync eReceipts', err)
    } finally {
      syncing.value = false
    }
  }

  async function fetchExtractions() {
    const response = await listEmailExtractions({ status: 'pending' })
    extractions.value = response.data
  }

  async function confirm(extractionId: string, categoryId?: string) {
    if (actionIds.value.has(extractionId)) return
    actionIds.value.add(extractionId)
    error.value = null
    try {
      await confirmEmailExtraction(extractionId, {
        categoryId,
        rememberMerchantCategory: false,
      })
      extractions.value = extractions.value.filter((item) => item.id !== extractionId)
    } catch (err: unknown) {
      handleError('Failed to confirm eReceipt', err)
    } finally {
      actionIds.value.delete(extractionId)
    }
  }

  async function skip(extractionId: string) {
    if (actionIds.value.has(extractionId)) return
    actionIds.value.add(extractionId)
    error.value = null
    try {
      await skipEmailExtraction(extractionId)
      extractions.value = extractions.value.filter((item) => item.id !== extractionId)
    } catch (err: unknown) {
      handleError('Failed to skip eReceipt', err)
    } finally {
      actionIds.value.delete(extractionId)
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
  }
})
