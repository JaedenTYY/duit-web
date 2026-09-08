import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Insight } from '@/types'
import { logger } from '@/utils/logger'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'
import {
  generate as generateInsight,
  list as listInsights,
} from '@/api/generated/insight-controller/insight-controller'
import { captureUserScopeEpoch, isCurrentUserScope } from '@/stores/resetUserScopedState'

export const useInsightStore = defineStore('insight', () => {
  const insights = ref<Insight[]>([])
  const loading = ref(false)
  const generating = ref(false)
  const error = ref<string | null>(null)

  async function fetchInsights() {
    if (loading.value) return
    const scope = captureUserScopeEpoch()
    loading.value = true
    error.value = null

    try {
      const response = await listInsights()
      if (!isCurrentUserScope(scope)) return
      insights.value = response.data
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = _extractError(err)
      logger.error('Failed to fetch insights', err)
    } finally {
      if (isCurrentUserScope(scope)) loading.value = false
    }
  }

  async function generateWeeklyInsight() {
    if (generating.value) return
    const scope = captureUserScopeEpoch()
    generating.value = true
    error.value = null

    try {
      const response = await generateInsight()
      if (!isCurrentUserScope(scope)) return
      const generated = response.data
      insights.value = [
        generated,
        ...insights.value.filter((insight) => insight.id !== generated.id),
      ]
    } catch (err: unknown) {
      if (!isCurrentUserScope(scope)) return
      error.value = _extractError(err)
      logger.error('Failed to generate weekly insight', err)
    } finally {
      if (isCurrentUserScope(scope)) generating.value = false
    }
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      return apiFailureMessage(extractApiFailure(err))
    }
    return 'An unexpected error occurred'
  }

  function reset() {
    insights.value = []
    loading.value = false
    generating.value = false
    error.value = null
  }

  return {
    insights,
    loading,
    generating,
    error,
    fetchInsights,
    generateWeeklyInsight,
    reset,
  }
})
