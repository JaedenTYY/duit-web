<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import { formatCurrency } from '@/utils/currency'
import { useDashboardAnimations } from '@/composables/animations/useDashboardAnimations'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

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

const chartData = computed(() => {
  const categories = categoriesToShow.value
  if (!categories.length) {
    return {
      labels: ['No Data'],
      datasets: [{ backgroundColor: ['#1e293b'], data: [1], borderWidth: 0 }]
    }
  }
  return {
    labels: categories.map(c => c.categoryName),
    datasets: [
      {
        backgroundColor: categories.map(c => c.categoryColor || '#3b82f6'),
        data: categories.map(c => parseFloat(c.total)),
        borderWidth: 0,
        hoverOffset: 10,
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '80%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: function(context: any) {
          return ' RM ' + context.parsed.toFixed(2);
        }
      }
    }
  }
}

const addToStats = (el: any) => {
  if (el && !statsCards.value.includes(el)) statsCards.value.push(el)
}
</script>

<template>
  <div class="space-y-12 pb-10">
    <!-- Header -->
    <header class="flex flex-col gap-2">
      <h1 class="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
        Good {{ greeting }}, <span class="text-blue-500">{{ firstName }}</span>
      </h1>
      <p class="text-slate-400 text-lg font-medium">
        Here's your summary for {{ monthName }}
      </p>
    </header>

    <!-- Error State -->
    <div
      v-if="store.error"
      class="p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-sm font-semibold flex items-center gap-3"
    >
      <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {{ store.error }}
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="store.loading && (!store.monthlySummary || store.transactions.length === 0)"
      class="space-y-6"
    >
      <div class="h-48 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="h-32 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
        <div class="h-32 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
      </div>
      <div class="h-64 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />
    </div>

    <template v-else>
    <!-- Main Stats Card -->
    <div
      :ref="addToStats"
      class="relative group"
    >
      <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <div class="relative bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Monthly Spend</span>
          <p
            ref="spendCounterEl"
            class="text-6xl font-extrabold text-slate-900 tracking-tighter mt-2"
          >
            RM 0.00
          </p>
        </div>
        <div class="flex gap-4">
          <router-link
            to="/transactions"
            class="bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-slate-200/50 shadow-white/5"
          >
            Transactions
          </router-link>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Matrix -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        :ref="addToStats"
        class="premium-card p-8 flex items-center gap-6"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl border border-blue-500/20 text-blue-400">
          <template v-if="topCategory?.categoryIcon">
            {{ topCategory.categoryIcon }}
          </template>
          <svg
            v-else
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6z"
          /></svg>
        </div>
        <div>
          <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Top Spending</span>
          <p class="text-slate-900 text-2xl font-bold tracking-tight">
            {{ topCategory?.categoryName || 'No Data' }}
          </p>
          <p class="text-slate-400 font-medium">
            {{ topCategory ? formatCurrency(topCategory.total, 'MYR') : 'Awaiting signals' }}
          </p>
        </div>
      </div>

      <div
        :ref="addToStats"
        class="premium-card p-8 flex items-center gap-6"
      >
        <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl border border-indigo-500/20 text-indigo-400">
          <template v-if="recentTransaction?.categoryIcon">
            {{ recentTransaction.categoryIcon }}
          </template>
          <svg
            v-else
            class="w-8 h-8"
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
        <div class="min-w-0">
          <span class="text-slate-400 text-xs font-bold uppercase tracking-widest">Recent Activity</span>
          <p class="text-slate-900 text-2xl font-bold tracking-tight truncate">
            {{ recentTransaction?.description || 'Idle' }}
          </p>
          <p class="text-slate-400 font-medium">
            {{ recentTransaction ? formatCurrency(recentTransaction.amount, recentTransaction.currency) : 'No transactions' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Analysis Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <!-- Category Breakdown Chart -->
      <section class="lg:col-span-3 premium-card p-10 flex flex-col">
        <h3 class="text-slate-900 text-xl font-bold tracking-tight mb-8 flex items-center gap-3">
          <div class="w-1 h-6 bg-blue-500 rounded-full" />
          Category Allocation
        </h3>
        
        <div
          v-if="categoriesToShow.length > 0"
          class="flex flex-col md:flex-row items-center gap-10 flex-1"
        >
          <!-- Chart Container -->
          <div class="relative w-48 h-48 sm:w-64 sm:h-64 shrink-0 mx-auto md:mx-0">
            <Doughnut
              :data="chartData"
              :options="chartOptions"
            />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total</span>
              <span class="text-2xl font-black text-slate-900">{{ formatCurrency(store.monthlySummary?.totalSpend || '0', 'MYR') }}</span>
            </div>
          </div>
          
          <!-- Custom Legend -->
          <div class="flex-1 w-full space-y-4">
            <div
              v-for="cat in categoriesToShow"
              :key="cat.categoryId || cat.categoryName"
              class="flex items-center justify-between group cursor-default p-3 hover:bg-slate-50 rounded-2xl transition-colors -mx-3"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  :style="{ backgroundColor: (cat.categoryColor || '#3b82f6') + '20', color: cat.categoryColor || '#3b82f6' }"
                >
                  <template v-if="cat.categoryIcon">
                    {{ cat.categoryIcon }}
                  </template>
                  <svg
                    v-else
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  /></svg>
                </div>
                <div>
                  <p class="text-slate-900 font-bold">
                    {{ cat.categoryName }}
                  </p>
                  <p class="text-slate-400 text-xs font-medium">
                    {{ cat.percentage.toFixed(1) }}%
                  </p>
                </div>
              </div>
              <span class="text-slate-900 font-bold group-hover:text-blue-400 transition-colors">{{ formatCurrency(cat.total, 'MYR') }}</span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="py-20 flex-1 flex flex-col items-center justify-center opacity-30"
        >
          <div class="w-32 h-32 rounded-full border-4 border-dashed border-slate-700 mb-6" />
          <p class="text-sm font-bold uppercase tracking-widest">
            No spending data detected
          </p>
        </div>
      </section>

      <!-- Insights / CTA -->
      <section class="lg:col-span-2 space-y-6">
        <div class="bg-blue-600 rounded-[2.5rem] p-10 text-slate-900 shadow-2xl shadow-slate-200/50 shadow-blue-900/40 relative overflow-hidden group h-full md:h-auto min-h-[220px] flex flex-col justify-center">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-3xl group-hover:scale-150 transition-transform duration-700" />
          <div class="relative z-10">
            <h4 class="text-2xl font-bold tracking-tight mb-3">
              Smart Insights
            </h4>
            <p class="text-blue-50 leading-relaxed font-medium opacity-90">
              Analyzing your cashflow. We'll notify you when we find ways to optimize your spending.
            </p>
          </div>
        </div>

      </section>
    </div>
    </template>
  </div>
</template>

<style scoped>
.premium-card {
  @apply bg-white backdrop-blur-2xl border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 shadow-black/10;
}
</style>
