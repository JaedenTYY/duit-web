import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Insight } from '@/types'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

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
      const response = await api.get<{ data: Insight[] }>('/insights')
      insights.value = response.data.data
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
      const response = await api.post<{ data: Insight }>('/insights/generate')
      const generated = response.data.data
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
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
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
