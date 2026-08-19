import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AnomalyAlert } from '@/types'
import { logger } from '@/utils/logger'
import {
  list1 as listAnomalies,
  resolve as resolveAnomalyContract,
} from '@/api/generated/anomaly-controller/anomaly-controller'

export const useAnomalyStore = defineStore('anomaly', () => {
  const anomalies = ref<AnomalyAlert[]>([])
  const loading = ref(false)
  const resolvingIds = ref<Set<string>>(new Set())
  const error = ref<string | null>(null)

  async function fetchAnomalies() {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
      const response = await listAnomalies()
      anomalies.value = response.data
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to fetch anomalies', err)
    } finally {
      loading.value = false
    }
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
    }
    return 'An unexpected error occurred'
  }

  async function resolveAnomaly(alertId: string, action: 'confirm' | 'dismiss') {
    if (resolvingIds.value.has(alertId)) return
    resolvingIds.value.add(alertId)
    error.value = null

    try {
      const status = action === 'confirm' ? 'confirmed' : 'dismissed'
      const response = await resolveAnomalyContract(alertId, { status })
      const index = anomalies.value.findIndex(a => a.id === alertId)
      if (index !== -1) {
        anomalies.value[index] = response.data
      }
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error(`Failed to ${action} anomaly`, err)
      throw err
    } finally {
      resolvingIds.value.delete(alertId)
    }
  }

  return {
    anomalies,
    loading,
    resolvingIds,
    error,
    fetchAnomalies,
    resolveAnomaly
  }
})
