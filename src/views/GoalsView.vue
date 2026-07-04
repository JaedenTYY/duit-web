<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGoalStore } from '@/stores/goal'
import { formatCurrency } from '@/utils/currency'
import { gsap } from 'gsap'
import CalendarDialog from '@/components/shared/CalendarDialog.vue'

const goalStore = useGoalStore()
const isModalOpen = ref(false)
const listContainer = ref<HTMLElement | null>(null)

// Calendar State
const showStartCalendar = ref(false)
const showEndCalendar = ref(false)

// New Goal Form State
const type = ref<'BUDGET' | 'SAVING'>('BUDGET')
const name = ref('')
const targetAmount = ref<number | ''>('')
const categoryId = ref('')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref('')

onMounted(async () => {
  await goalStore.fetchGoals()
  animateList()
})

function animateList() {
  if (listContainer.value && goalStore.goals.length > 0) {
    const ctx = gsap.context(() => {
      gsap.from(listContainer.value?.children || [], {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      })
    }, listContainer.value)
    return () => ctx.revert()
  }
}

const submitGoal = async () => {
  if (!name.value || !targetAmount.value || !startDate.value) return

  try {
    await goalStore.createGoal({
      type: type.value,
      name: name.value,
      targetAmount: Number(targetAmount.value),
      currency: 'MYR',
      categoryId: categoryId.value || undefined,
      startDate: startDate.value,
      endDate: endDate.value || undefined
    })
    
    // Reset form
    name.value = ''
    targetAmount.value = ''
    categoryId.value = ''
    endDate.value = ''
    isModalOpen.value = false
    
    setTimeout(animateList, 50)
  } catch (err) {
    // Error handled by store
  }
}

const deleteGoal = async (id: string) => {
  if (confirm('Delete this goal?')) {
    await goalStore.deleteGoal(id)
  }
}

const formatDate = (isoString: string) => {
  if (!isoString) return 'Select Date'
  return new Date(isoString).toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="relative min-h-[85vh] pb-32">
    <!-- Header -->
    <header class="mb-12 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold text-slate-900 tracking-tight">
          Goals
        </h1>
        <p class="text-slate-500 font-medium mt-1">
          Track your budgets and savings
        </p>
      </div>
      <button 
        class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
        @click="isModalOpen = true"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        /></svg>
        New Goal
      </button>
    </header>

    <!-- Error State -->
    <div
      v-if="goalStore.error"
      class="mb-8 p-5 bg-red-50 border border-red-100 rounded-[1.5rem] text-red-600 text-sm font-semibold flex items-center gap-3"
    >
      <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {{ goalStore.error }}
    </div>

    <!-- Loading -->
    <div
      v-if="goalStore.loading && goalStore.goals.length === 0"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-48 bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-pulse"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!goalStore.loading && goalStore.goals.length === 0"
      class="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center shadow-sm"
    >
      <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 text-blue-500">
        🎯
      </div>
      <h3 class="text-xl font-bold text-slate-900 tracking-tight mb-2">
        No Goals Set
      </h3>
      <p class="text-slate-500 text-base font-medium max-w-sm mx-auto mb-8 leading-relaxed">
        Set a monthly budget to control spending, or create a savings goal for something special.
      </p>
      <button 
        class="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
        @click="isModalOpen = true"
      >
        Create your first goal
      </button>
    </div>

    <!-- Goals Grid -->
    <div
      v-else
      ref="listContainer"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div 
        v-for="goal in goalStore.goals" 
        :key="goal.id"
        class="relative bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
      >
        <div class="flex items-start justify-between mb-8">
          <div class="flex items-center gap-4">
            <div 
              class="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              :class="goal.type === 'BUDGET' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'"
            >
              <svg
                v-if="goal.type === 'BUDGET'"
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              /></svg>
              <svg
                v-else
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              /></svg>
            </div>
            <div>
              <h3 class="text-slate-900 font-bold text-lg">
                {{ goal.name }}
              </h3>
              <p class="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {{ goal.type }}
              </p>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors p-2 -mr-2 -mt-2"
            @click="deleteGoal(goal.id)"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            /></svg>
          </button>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <div>
              <p class="text-slate-500 text-sm mb-1">
                {{ goal.type === 'BUDGET' ? 'Spent' : 'Saved' }}
              </p>
              <p class="text-2xl font-bold text-slate-900">
                {{ formatCurrency(goal.currentAmount, goal.currency) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-slate-500 text-sm mb-1">
                Target
              </p>
              <p class="text-lg font-bold text-slate-700">
                {{ formatCurrency(goal.targetAmount, goal.currency) }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
            <div 
              class="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
              :class="[
                goal.type === 'BUDGET' 
                  ? (goal.percentage > 90 ? 'bg-red-500' : 'bg-indigo-500') 
                  : 'bg-emerald-500'
              ]"
              :style="{ width: `${Math.min(goal.percentage, 100)}%` }"
            />
          </div>
          
          <div class="flex justify-between text-xs font-bold text-slate-500">
            <span :class="goal.type === 'BUDGET' && goal.percentage > 90 ? 'text-red-500' : ''">{{ goal.percentage.toFixed(1) }}%</span>
            <span v-if="goal.endDate">{{ new Date(goal.endDate).toLocaleDateString() }}</span>
            <span v-else>Ongoing</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Goal Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        @click="isModalOpen = false"
      />
      
      <div class="relative bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
            New Goal
          </h2>
          <button
            class="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors"
            @click="isModalOpen = false"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg>
          </button>
        </div>

        <form
          class="space-y-6"
          @submit.prevent="submitGoal"
        >
          <!-- Goal Type Toggle -->
          <div class="flex bg-slate-50 rounded-2xl p-1 border border-slate-100">
            <button 
              type="button"
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              :class="type === 'BUDGET' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'"
              @click="type = 'BUDGET'"
            >
              Budget
            </button>
            <button 
              type="button"
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              :class="type === 'SAVING' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'"
              @click="type = 'SAVING'"
            >
              Saving
            </button>
          </div>

          <div>
            <label class="block text-slate-500 text-sm font-bold mb-2">Goal Name</label>
            <input 
              v-model="name"
              type="text" 
              class="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300"
              placeholder="e.g. Food Budget"
              required
            >
          </div>

          <div>
            <label class="block text-slate-500 text-sm font-bold mb-2">Target Amount (MYR)</label>
            <input 
              v-model="targetAmount"
              type="number" 
              step="0.01"
              class="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300"
              placeholder="0.00"
              required
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-500 text-sm font-bold mb-2">Start Date</label>
              <button 
                type="button"
                class="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-left focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                :class="startDate ? 'text-slate-900 font-medium' : 'text-slate-300'"
                @click="showStartCalendar = true"
              >
                {{ formatDate(startDate) }}
              </button>
            </div>
            <div>
              <label class="block text-slate-500 text-sm font-bold mb-2">End Date (Optional)</label>
              <button 
                type="button"
                class="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-left focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                :class="endDate ? 'text-slate-900 font-medium' : 'text-slate-300'"
                @click="showEndCalendar = true"
              >
                {{ formatDate(endDate) }}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            :disabled="goalStore.submitting"
          >
            {{ goalStore.submitting ? 'Creating...' : 'Create Goal' }}
          </button>
        </form>
      </div>
    </div>
    
    <!-- Calendars -->
    <CalendarDialog 
      v-model="startDate" 
      :is-open="showStartCalendar" 
      @close="showStartCalendar = false" 
    />
    
    <CalendarDialog 
      v-model="endDate" 
      :is-open="showEndCalendar" 
      @close="showEndCalendar = false" 
    />
  </div>
</template>
