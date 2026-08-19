import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Insight } from '@/types'
import { logger } from '@/utils/logger'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'
import {
  generate as generateInsight,
  list as listInsights,
} from '@/api/generated/insight-controller/insight-controller'

export const useInsightStore = defineStore('insight', () => {
  const insights = ref<Insight[]>([])
  const loading = ref(false)
  const generating = ref(false)
  const error = ref<string | null>(null)

  async function fetchInsights() {
    if (loading.value) return
    loading.value = true
    error.value = null

    try {
      const response = await listInsights()
      insights.value = response.data as Insight[]
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to fetch insights', err)
    } finally {
      loading.value = false
    }
  }

  async function generateWeeklyInsight() {
    if (generating.value) return
    generating.value = true
    error.value = null

    try {
      const response = await generateInsight()
      const generated = response.data as Insight
      insights.value = [
        generated,
        ...insights.value.filter((insight) => insight.id !== generated.id),
      ]
    } catch (err: unknown) {
      error.value = _extractError(err)
      logger.error('Failed to generate weekly insight', err)
    } finally {
      generating.value = false
    }
  }

  function _extractError(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      return apiFailureMessage(extractApiFailure(err))
    }
    return 'An unexpected error occurred'
  }

  return {
    insights,
    loading,
    generating,
    error,
    fetchInsights,
    generateWeeklyInsight,
  }
})
