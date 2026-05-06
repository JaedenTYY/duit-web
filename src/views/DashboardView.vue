<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import { formatCurrency } from '@/utils/currency'
import { useDashboardAnimations } from '@/composables/animations/useDashboardAnimations'

const authStore = useAuthStore()
const store = useTransactionStore()
const { animateStatsIn, animateSpendCounter } = useDashboardAnimations()

const statsCards = ref<HTMLElement[]>([])
const spendCounterEl = ref<HTMLElement | null>(null)

const now = new Date()
const month = now.getMonth() + 1
const year = now.getFullYear()

onMounted(async () => {
  await Promise.all([
    store.fetchMonthlySummary(year, month),
    store.fetchTransactions(true)
  ])

  if (statsCards.value.length > 0) {
    animateStatsIn(statsCards.value)
  }

  if (spendCounterEl.value) {
    animateSpendCounter(spendCounterEl.value, 0, store.totalSpend)
  }
})

const greeting = computed(() => {
  const hour = now.getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
})

const firstName = computed(() => {
  return authStore.user?.fullName?.split(' ')[0] ?? 'there'
})

const monthName = computed(() => {
  return now.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
})

const topCategory = computed(() => {
  return store.monthlySummary?.byCategory?.[0] ?? null
})

const recentTransaction = computed(() => {
  return store.transactions[0] ?? null
})

const categoriesToShow = computed(() => {
  return store.monthlySummary?.byCategory?.slice(0, 5) ?? []
})

const addToStats = (el: any) => {
  if (el && !statsCards.value.includes(el)) statsCards.value.push(el)
}
</script>

<template>
  <div class="space-y-12">
    <!-- Header -->
    <header class="flex flex-col gap-2">
      <h1 class="text-4xl md:text-5xl font-bold text-white tracking-tight">
        Good {{ greeting }}, <span class="text-blue-500">{{ firstName }}</span>
      </h1>
      <p class="text-slate-400 text-lg font-medium">Here's your summary for {{ monthName }}</p>
    </header>

    <!-- Main Stats Card -->
    <div :ref="addToStats" class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div class="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <span class="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Monthly Spend</span>
          <p ref="spendCounterEl" class="text-6xl font-extrabold text-white tracking-tighter mt-2">RM 0.00</p>
        </div>
        <div class="flex gap-4">
          <router-link to="/transactions" class="bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5">
            View History
          </router-link>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Matrix -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div :ref="addToStats" class="premium-card p-8 flex items-center gap-6">
        <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl border border-blue-500/20">
          {{ topCategory?.categoryIcon || '📊' }}
        </div>
        <div>
          <span class="text-slate-500 text-xs font-bold uppercase tracking-widest">Top Spending</span>
          <p class="text-white text-2xl font-bold tracking-tight">{{ topCategory?.categoryName || 'No Data' }}</p>
          <p class="text-slate-400 font-medium">{{ topCategory ? formatCurrency(topCategory.total, 'MYR') : 'Awaiting signals' }}</p>
        </div>
      </div>

      <div :ref="addToStats" class="premium-card p-8 flex items-center gap-6">
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl border border-indigo-500/20 text-indigo-400">
          {{ recentTransaction?.categoryIcon || '💸' }}
        </div>
        <div class="min-w-0">
          <span class="text-slate-500 text-xs font-bold uppercase tracking-widest">Recent Activity</span>
          <p class="text-white text-2xl font-bold tracking-tight truncate">{{ recentTransaction?.description || 'Idle' }}</p>
          <p class="text-slate-400 font-medium">{{ recentTransaction ? formatCurrency(recentTransaction.amount, recentTransaction.currency) : 'No transactions' }}</p>
        </div>
      </div>
    </div>

    <!-- Analysis Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <!-- Category Breakdown -->
      <section class="lg:col-span-3 premium-card p-10">
        <h3 class="text-white text-xl font-bold tracking-tight mb-10 flex items-center gap-3">
          <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
          Category Allocation
        </h3>
        
        <div v-if="categoriesToShow.length > 0" class="space-y-8">
          <div v-for="cat in categoriesToShow" :key="cat.categoryId || cat.categoryName" class="group">
            <div class="flex justify-between items-end mb-3">
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ cat.categoryIcon }}</span>
                <span class="text-sm font-bold text-slate-300 uppercase tracking-widest">{{ cat.categoryName }}</span>
              </div>
              <span class="text-base font-bold text-white">{{ formatCurrency(cat.total, 'MYR') }}</span>
            </div>
            <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
              <div 
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :style="{ width: `${cat.percentage}%`, backgroundColor: cat.categoryColor || '#3b82f6' }"
              ></div>
            </div>
          </div>
        </div>
        <div v-else class="py-20 text-center opacity-30">
          <p class="text-sm font-bold uppercase tracking-widest">No spending data detected</p>
        </div>
      </section>

      <!-- Insights / CTA -->
      <section class="lg:col-span-2 space-y-6">
        <div class="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <div class="relative z-10">
            <h4 class="text-2xl font-bold tracking-tight mb-3">Smart Insights</h4>
            <p class="text-blue-50 leading-relaxed font-medium opacity-90">
              Analyzing your cashflow. We'll notify you when we find ways to optimize your spending.
            </p>
          </div>
        </div>

        <div class="premium-card p-10 flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4">🚀</div>
          <h4 class="text-white font-bold mb-2">New Goal?</h4>
          <p class="text-slate-400 text-sm mb-6">Set a budget for next month and track your progress here.</p>
          <button class="w-full py-4 border border-white/10 rounded-2xl font-bold text-white hover:bg-white/5 transition-all">
            Coming Soon
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.premium-card {
  @apply bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-xl shadow-black/10;
}
</style>
