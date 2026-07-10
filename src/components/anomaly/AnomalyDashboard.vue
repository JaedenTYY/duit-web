<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAnomalyStore } from '@/stores/anomaly'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'

const anomalyStore = useAnomalyStore()
const { anomalies, loading, resolvingIds, error } = storeToRefs(anomalyStore)

onMounted(() => {
  anomalyStore.fetchAnomalies()

  // GSAP Entry Animation
  const ctx = gsap.context(() => {
    gsap.from('.alert-card', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.2
    })
  })
  onUnmounted(() => ctx.revert())
})

const handleResolve = async (id: string, action: 'confirm' | 'dismiss') => {
  await anomalyStore.resolveAnomaly(id, action)
}

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`
}
</script>

<template>
  <div class="w-full">
    <div class="mb-6">
      <div>
        <h2 class="text-xl font-black text-slate-950 tracking-tight flex items-center gap-3">
          Anomaly alerts
        </h2>
        <p class="mt-1 text-sm font-medium text-slate-500">
          Each new transaction is compared with your personal spending baseline.
        </p>
      </div>
    </div>

    <LoadingSkeleton
      v-if="loading"
      :rows="2"
      variant="list"
    />

    <ErrorBanner
      v-else-if="error"
      :message="error"
      action-label="Try again"
      @action="anomalyStore.fetchAnomalies"
    />

    <EmptyState
      v-else-if="anomalies.length === 0"
      title="All clear"
      message="No unusual spending detected in your ledger."
      tone="emerald"
    />

    <!-- Alerts Container -->
    <div
      v-else
      class="space-y-4"
    >
      <div 
        v-for="alert in anomalies" 
        :id="`alert-${alert.id}`"
        :key="alert.id"
        class="alert-card rounded-[1.75rem] border bg-white p-5 shadow-sm transition-all sm:p-6"
        :class="alert.status !== 'pending' ? 'border-slate-200 opacity-70' : 'border-amber-200 shadow-amber-100/60'"
      >
        <div class="flex flex-col gap-5">
          <div class="flex items-start gap-4">
          <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              :class="alert.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'"
          >
            <svg
              v-if="alert.status === 'pending'"
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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
              d="M5 13l4 4L19 7"
            /></svg>
          </div>
            <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
                <h3 class="min-w-0 truncate text-base font-black text-slate-950">
                {{ alert.title }}
              </h3>
                <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                  Risk {{ formatScore(alert.anomalyScore) }}
              </span>
            </div>
              <p class="mt-1 truncate font-bold text-slate-800">
              {{ formatMoney(alert.amount, alert.currency) }} · {{ alert.merchantName }}
            </p>
              <p class="text-sm font-medium text-slate-500">
              {{ alert.categoryName }}
            </p>
              <p class="mt-3 text-sm font-medium leading-6 text-slate-600">
              {{ alert.explanation }}
            </p>
              <p class="mt-2 text-xs font-semibold text-slate-400">
              Detected on {{ new Date(alert.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div
          v-if="alert.status === 'pending'"
            class="grid grid-cols-2 gap-3"
        >
          <button
              class="min-h-11 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="resolvingIds.has(alert.id)"
            @click="handleResolve(alert.id, 'dismiss')"
          >
            Dismiss
          </button>
          <button
              class="min-h-11 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="resolvingIds.has(alert.id)"
            @click="handleResolve(alert.id, 'confirm')"
          >
            Confirm anomaly
          </button>
        </div>
        <div
          v-else
            class="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black uppercase tracking-wider text-slate-500"
        >
          {{ alert.status === 'confirmed' ? 'Confirmed anomaly' : 'Dismissed' }}
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
