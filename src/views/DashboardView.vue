<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { TooltipItem } from 'chart.js'
import { useTransactionStore } from '@/stores/transaction'
import { formatCurrency } from '@/utils/currency'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import HabitSummaryCard from '@/components/shared/HabitSummaryCard.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import FeatureActionCard from '@/components/shared/FeatureActionCard.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useTransactionStore()

const now = new Date()
const month = now.getMonth() + 1
const year = now.getFullYear()

onMounted(async () => {
  await Promise.all([
    store.fetchMonthlySummary(year, month),
    store.fetchTransactions(true)
  ])
})

const monthName = computed(() => now.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }))
const categoriesToShow = computed(() => store.monthlySummary?.byCategory?.slice(0, 5) ?? [])
const topCategory = computed(() => store.monthlySummary?.byCategory?.[0] ?? null)
const recentTransactions = computed(() => store.transactions.slice(0, 4))
const completedTasks = computed(() => {
  let count = 0
  if (store.transactions.length > 0) count += 1
  if (categoriesToShow.value.length > 0) count += 1
  if (store.monthlySummary) count += 1
  return count
})

const chartData = computed(() => {
  if (!categoriesToShow.value.length) {
    return {
      labels: ['No data'],
      datasets: [{ backgroundColor: ['#e2e8f0'], data: [1], borderWidth: 0 }]
    }
  }

  return {
    labels: categoriesToShow.value.map(category => category.categoryName),
    datasets: [
      {
        backgroundColor: categoriesToShow.value.map(category => category.categoryColor || '#10b981'),
        data: categoriesToShow.value.map(category => parseFloat(category.total)),
        borderWidth: 0,
        hoverOffset: 8,
        borderRadius: 6
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '76%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context: TooltipItem<'doughnut'>) => ` RM ${Number(context.parsed).toFixed(2)}`
      }
    }
  }
}
</script>

<template>
  <div class="space-y-4 pb-8 sm:space-y-6 sm:pb-10">
    <header class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
        <p class="text-xs font-black uppercase text-emerald-600">
          {{ monthName }}
        </p>
        <h1 class="mt-3 max-w-3xl text-3xl font-black text-slate-950 sm:text-5xl">
          Your money, clearly organized.
        </h1>
        <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500 sm:mt-4 sm:text-base sm:leading-7">
          Start with the most common tasks: scan receipts, review transactions, split shared bills, and check weekly insights.
        </p>
        <div class="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
          <RouterLink
            to="/inbox"
            class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
          >
            Import a receipt
          </RouterLink>
          <RouterLink
            to="/insights"
            class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            View insights
          </RouterLink>
        </div>
      </section>

      <HabitSummaryCard
        :completion="(completedTasks / 3) * 100"
        :completed-tasks="completedTasks"
        :total-tasks="3"
        :streak-days="4"
        title="Weekly habits"
        subtitle="Complete the three core actions to keep your records accurate."
      />
    </header>

    <ErrorBanner :message="store.error" />

    <LoadingSkeleton
      v-if="store.loading && (!store.monthlySummary || store.transactions.length === 0)"
      :rows="4"
    />

    <template v-else>
      <section class="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-4">
        <FeatureActionCard
          title="Scan a receipt"
          description="Upload a receipt image and let Duit turn it into structured spending."
          status="Most used"
          icon="📸"
          tone="mint"
          to="/inbox"
          action-label="Scan"
        />
        <FeatureActionCard
          title="Split a bill"
          description="Create a shared bill from a receipt and let everyone claim their items."
          status="Group spending"
          icon="🤝"
          tone="amber"
          to="/split-bill"
          action-label="Split"
        />
        <FeatureActionCard
          title="Check weekly insights"
          description="Generate your weekly insight and learn what changed in your spending."
          status="Review"
          icon="🧠"
          tone="sky"
          to="/insights"
          action-label="Review"
        />
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
          <p class="text-xs font-black uppercase text-slate-400">
            Monthly spend
          </p>
          <p class="mt-2 text-3xl font-black text-slate-950 sm:mt-3 sm:text-4xl">
            {{ formatCurrency(store.monthlySummary?.totalSpend || '0', 'MYR') }}
          </p>
          <p class="mt-2 text-sm font-semibold text-slate-500">
            Top category: {{ topCategory?.categoryName || 'not enough data yet' }}
          </p>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-emerald-50 p-4">
              <p class="text-xs font-black uppercase text-emerald-700">
                Transactions
              </p>
              <p class="mt-1 text-2xl font-black text-slate-950">
                {{ store.transactions.length }}
              </p>
            </div>
            <div class="rounded-2xl bg-rose-50 p-4">
              <p class="text-xs font-black uppercase text-rose-700">
                Categories
              </p>
              <p class="mt-1 text-2xl font-black text-slate-950">
                {{ categoriesToShow.length }}
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
          <div class="mb-5 flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-black uppercase text-emerald-600">
                Spending map
              </p>
              <h2 class="mt-1 text-2xl font-black text-slate-950">
                Category ring
              </h2>
            </div>
            <RouterLink
              to="/transactions"
              class="text-sm font-black text-emerald-600 hover:text-emerald-700"
            >
              Details
            </RouterLink>
          </div>

          <div
            v-if="categoriesToShow.length"
            class="grid gap-4 md:grid-cols-[14rem_1fr] md:items-center md:gap-6"
          >
            <div class="relative mx-auto h-48 w-48 sm:h-56 sm:w-56">
              <Doughnut
                :data="chartData"
                :options="chartOptions"
              />
              <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-xs font-black uppercase text-slate-400">Total</span>
                <span class="mt-1 text-lg font-black text-slate-950">{{ formatCurrency(store.monthlySummary?.totalSpend || '0', 'MYR') }}</span>
              </div>
            </div>

            <div class="space-y-3">
              <div
                v-for="category in categoriesToShow"
                :key="category.categoryId || category.categoryName"
                class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg"
                    :style="{ backgroundColor: `${category.categoryColor || '#10b981'}18`, color: category.categoryColor || '#10b981' }"
                  >
                    {{ category.categoryIcon || '•' }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black text-slate-950">
                      {{ category.categoryName }}
                    </p>
                    <p class="text-xs font-semibold text-slate-500">
                      {{ category.percentage.toFixed(1) }}%
                    </p>
                  </div>
                </div>
                <span class="shrink-0 text-sm font-black text-slate-950">{{ formatCurrency(category.total, 'MYR') }}</span>
              </div>
            </div>
          </div>

          <EmptyState
            v-else
            title="No spending map yet"
            message="Scan a receipt or import spending to unlock your category ring."
            action-label="Open import"
            tone="emerald"
            @action="$router.push('/inbox')"
          />
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase text-amber-600">
              Activity feed
            </p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">
              Recent transactions
            </h2>
          </div>
          <RouterLink
            to="/transactions"
            class="text-sm font-black text-emerald-600 hover:text-emerald-700"
          >
            View all
          </RouterLink>
        </div>

        <div
          v-if="recentTransactions.length"
          class="grid gap-3 md:grid-cols-2"
        >
          <div
            v-for="transaction in recentTransactions"
            :key="transaction.id"
            class="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"
          >
            <div class="min-w-0">
              <p class="truncate font-black text-slate-950">
                {{ transaction.merchantName || transaction.description || 'Transaction' }}
              </p>
              <p class="truncate text-xs font-semibold text-slate-500">
                {{ transaction.categoryName || 'General' }} · {{ new Date(transaction.occurredAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-black text-slate-950">
              {{ formatCurrency(transaction.amount, transaction.currency) }}
            </p>
          </div>
        </div>
        <p
          v-else
          class="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500"
        >
          Your first receipt scan will appear here.
        </p>
      </section>
    </template>
  </div>
</template>
