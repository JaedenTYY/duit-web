<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import { formatCurrency } from '@/utils/currency'
import { useDashboardAnimations } from '@/composables/animations/useDashboardAnimations'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import ActionTile from '@/components/shared/ActionTile.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import StatCard from '@/components/shared/StatCard.vue'

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
      datasets: [{ backgroundColor: ['#e2e8f0'], data: [1], borderWidth: 0 }]
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
  cutout: '78%',
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
          return ' RM ' + context.parsed.toFixed(2)
        }
      }
    }
  }
}

const addToStats = (el: any) => {
  if (el && !statsCards.value.includes(el)) statsCards.value.push(el)
}

function replayOnboarding() {
  window.dispatchEvent(new Event('duit:replayOnboarding'))
}
</script>

<template>
  <div class="space-y-8 pb-10">
    <header class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="flex items-start justify-between gap-5">
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            {{ monthName }}
          </p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Good {{ greeting }}, <span class="text-blue-600">{{ firstName }}</span>
          </h1>
          <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
            Let’s get your spending organised. Duit is tracking your transactions, categories, and patterns in one place.
          </p>
        </div>
        <FriendlyAvatar
          class="hidden sm:block"
          tone="blue"
          size="lg"
        />
      </div>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <router-link
          to="/inbox"
          class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98]"
        >
          Import spending
        </router-link>
        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          @click="replayOnboarding"
        >
          Show walkthrough
        </button>
      </div>
    </header>

    <ErrorBanner :message="store.error" />

    <LoadingSkeleton
      v-if="store.loading && (!store.monthlySummary || store.transactions.length === 0)"
      :rows="4"
    />

    <template v-else>
      <section
        :ref="addToStats"
        class="overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-600 to-slate-900 p-6 text-white shadow-xl shadow-blue-200 sm:p-8"
      >
        <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <span class="text-xs font-black uppercase tracking-[0.18em] text-blue-100">Total monthly spend</span>
            <p
              ref="spendCounterEl"
              class="mt-2 break-words text-4xl font-black tracking-tight sm:text-6xl"
            >
              RM 0.00
            </p>
            <p class="mt-3 text-sm font-medium leading-6 text-blue-50">
              Based on synced transactions for {{ monthName }}.
            </p>
          </div>
          <router-link
            to="/transactions"
            class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
          >
            View transactions
          </router-link>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Top spending"
          :value="topCategory?.categoryName || 'No data yet'"
          :description="topCategory ? formatCurrency(topCategory.total, 'MYR') : 'Awaiting signals'"
          tone="blue"
        >
          <template #icon>
            <span class="text-xl">{{ topCategory?.categoryIcon || '✨' }}</span>
          </template>
        </StatCard>
        <StatCard
          label="Recent activity"
          :value="recentTransaction?.merchantName || recentTransaction?.description || 'Idle'"
          :description="recentTransaction ? formatCurrency(recentTransaction.amount, recentTransaction.currency) : 'No transactions yet'"
          tone="emerald"
        >
          <template #icon>
            <span class="text-xl">{{ recentTransaction?.categoryIcon || '💳' }}</span>
          </template>
        </StatCard>
      </div>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ActionTile
          title="Add Transaction"
          description="Record spending manually when you need a quick entry."
          to="/transactions"
          tone="purple"
          action-label="Add now"
        >
          <template #icon>
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" /></svg>
          </template>
        </ActionTile>
        <ActionTile
          title="Upload Receipt"
          description="Scan a receipt and let Duit extract transaction details."
          to="/inbox"
          tone="blue"
          action-label="Scan"
        >
          <template #icon>
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          </template>
        </ActionTile>
        <ActionTile
          title="Import Statement"
          description="Review statement rows before importing selected spending."
          to="/statements"
          tone="emerald"
          action-label="Import"
        >
          <template #icon>
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 3h7l5 5v13H7V3zm7 0v6h5M10 13h6m-6 4h6" /></svg>
          </template>
        </ActionTile>
        <ActionTile
          title="Generate Insight"
          description="Ask Duit for weekly spending recommendations."
          to="/insights"
          tone="rose"
          action-label="Generate"
        >
          <template #icon>
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </template>
        </ActionTile>
      </section>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:col-span-3">
          <div class="mb-6">
            <h2 class="text-xl font-black tracking-tight text-slate-950">
              Category allocation
            </h2>
            <p class="mt-1 text-sm font-medium text-slate-500">
              Where your money is going this month.
            </p>
          </div>

          <div
            v-if="categoriesToShow.length > 0"
            class="flex flex-col items-center gap-8 md:flex-row"
          >
            <div class="relative mx-auto h-52 w-52 shrink-0 sm:h-60 sm:w-60 md:mx-0">
              <Doughnut
                :data="chartData"
                :options="chartOptions"
              />
              <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <span class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Total</span>
                <span class="mt-1 text-xl font-black text-slate-950">{{ formatCurrency(store.monthlySummary?.totalSpend || '0', 'MYR') }}</span>
              </div>
            </div>

            <div class="w-full min-w-0 flex-1 space-y-3">
              <div
                v-for="cat in categoriesToShow"
                :key="cat.categoryId || cat.categoryName"
                class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                    :style="{ backgroundColor: (cat.categoryColor || '#3b82f6') + '18', color: cat.categoryColor || '#3b82f6' }"
                  >
                    {{ cat.categoryIcon || '•' }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-black text-slate-900">
                      {{ cat.categoryName }}
                    </p>
                    <p class="text-xs font-semibold text-slate-500">
                      {{ cat.percentage.toFixed(1) }}% of spending
                    </p>
                  </div>
                </div>
                <span class="shrink-0 text-sm font-black tabular-nums text-slate-950">{{ formatCurrency(cat.total, 'MYR') }}</span>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No spending data yet"
            message="Import receipts, statements, or eReceipts and Duit will build this monthly view for you."
            action-label="Open Magic Inbox"
            tone="blue"
            @action="$router.push('/inbox')"
          />
        </section>

        <section class="space-y-6 lg:col-span-2">
          <div class="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
            <div class="flex items-start gap-4">
              <FriendlyAvatar
                tone="emerald"
                size="sm"
              />
              <div>
                <h2 class="text-xl font-black tracking-tight text-slate-950">
                  Smart insights
                </h2>
                <p class="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Duit watches for weekly changes and turns spending patterns into practical recommendations.
                </p>
                <router-link
                  to="/insights"
                  class="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Open insights
                </router-link>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h2 class="text-xl font-black tracking-tight text-slate-950">
                Recent transactions
              </h2>
              <router-link
                to="/transactions"
                class="text-sm font-black text-blue-600 hover:text-blue-700"
              >
                View all
              </router-link>
            </div>
            <div
              v-if="store.transactions.length"
              class="space-y-3"
            >
              <div
                v-for="tx in store.transactions.slice(0, 4)"
                :key="tx.id"
                class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <div class="min-w-0">
                  <p class="truncate font-black text-slate-900">
                    {{ tx.merchantName || tx.description || 'Transaction' }}
                  </p>
                  <p class="truncate text-xs font-semibold text-slate-500">
                    {{ tx.categoryName || 'General' }} · {{ new Date(tx.occurredAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) }}
                  </p>
                </div>
                <p class="shrink-0 text-sm font-black tabular-nums text-slate-950">
                  {{ formatCurrency(tx.amount, tx.currency) }}
                </p>
              </div>
            </div>
            <p
              v-else
              class="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-500"
            >
              Recent spending will appear here after your first import.
            </p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
