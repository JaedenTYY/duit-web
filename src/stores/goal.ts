import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/lib/api'
import { logger } from '@/utils/logger'

export interface Goal {
  id: string
  type: 'BUDGET' | 'SAVING'
  name: string
  targetAmount: string
  currentAmount: string
  currency: string
  categoryId: string | null
  startDate: string
  endDate: string | null
  percentage: number
}

export interface CreateGoalPayload {
  type: 'BUDGET' | 'SAVING'
  name: string
  targetAmount: number
  currency: string
  categoryId?: string
  startDate: string
  endDate?: string
}

interface GoalsResponse {
  data: Goal[]
}

interface SingleGoalResponse {
  data: Goal
}

export const useGoalStore = defineStore('goal', () => {
  const goals = ref<Goal[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)

  async function fetchGoals() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<GoalsResponse>('/goals')
      goals.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch goals'
      logger.error('Fetch goals error:', err)
    } finally {
      loading.value = false
    }
  }

  async function createGoal(payload: CreateGoalPayload) {
    submitting.value = true
    error.value = null
    try {
      const response = await api.post<SingleGoalResponse>('/goals', payload)
      goals.value.push(response.data.data)
      return response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create goal'
      throw err
    } finally {
      submitting.value = false
    }
  }

  async function deleteGoal(id: string) {
    try {
      await api.delete(`/goals/${id}`)
      goals.value = goals.value.filter(g => g.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to delete goal'
      throw err
    }
  }

  return {
    goals,
    loading,
    submitting,
    error,
    fetchGoals,
    createGoal,
    deleteGoal
  }
})
