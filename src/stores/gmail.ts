import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EmailExtraction, GmailStatus, GmailSyncResult } from '@/types'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

export const useGmailStore = defineStore('gmail', () => {
  const status = ref<GmailStatus | null>(null)
  const extractions = ref<EmailExtraction[]>([])
  const lastSync = ref<GmailSyncResult | null>(null)
  const loading = ref(false)
  const connecting = ref(false)
  const syncing = ref(false)
  const actionIds = ref<Set<string>>(new Set())
  const error = ref<string | null>(null)

  async function initialise() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<{ data: GmailStatus }>('/gmail/status')
      status.value = response.data.data
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
      const response = await api.post<{
        data: { connected: boolean; authorizationUrl: string | null }
      }>('/gmail/connect')
      if (response.data.data.authorizationUrl) {
        window.location.assign(response.data.data.authorizationUrl)
        return
      }
      await initialise()
    } catch (err: unknown) {
      handleError('Failed to connect Gmail', err)
    } finally {
      connecting.value = false
    }
  }

  async function disconnect() {
    error.value = null
    try {
      await api.delete('/gmail/disconnect')
      status.value = status.value
        ? { ...status.value, connected: false, providerEmail: null, connectedAt: null, scopes: [] }
        : null
      extractions.value = []
      lastSync.value = null
    } catch (err: unknown) {
      handleError('Failed to disconnect Gmail', err)
    }
  }

  async function sync() {
    syncing.value = true
    error.value = null
    try {
      const response = await api.post<{ data: GmailSyncResult }>('/gmail/sync')
      lastSync.value = response.data.data
      await fetchExtractions()
    } catch (err: unknown) {
      handleError('Failed to sync eReceipts', err)
    } finally {
      syncing.value = false
    }
  }

  async function fetchExtractions() {
    const response = await api.get<{ data: EmailExtraction[] }>('/gmail/extractions', {
      params: { status: 'pending' },
    })
    extractions.value = response.data.data
  }

  async function confirm(extractionId: string, categoryId?: string) {
    if (actionIds.value.has(extractionId)) return
    actionIds.value.add(extractionId)
    error.value = null
    try {
      await api.post(`/gmail/extractions/${extractionId}/confirm`, { categoryId })
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
      await api.patch(`/gmail/extractions/${extractionId}/skip`)
      extractions.value = extractions.value.filter((item) => item.id !== extractionId)
    } catch (err: unknown) {
      handleError('Failed to skip eReceipt', err)
    } finally {
      actionIds.value.delete(extractionId)
    }
  }

  function handleError(message: string, err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } }
      error.value = axiosError.response?.data?.error?.message ?? message
    } else {
      error.value = message
    }
    logger.error(message, err)
  }

  return {
    status,
    extractions,
    lastSync,
    loading,
    connecting,
    syncing,
    actionIds,
    error,
    initialise,
    connect,
    disconnect,
    sync,
    confirm,
    skip,
  }
})
