<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAnomalyStore } from '@/stores/anomaly'
import { storeToRefs } from 'pinia'
import gsap from 'gsap'

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
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Anomaly Engine
        </h2>
        <p class="text-slate-400 mt-1">
          Each new transaction is compared with your personal spending baseline.
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white backdrop-blur-xl border border-slate-100 rounded-[2rem] p-12 text-center"
    >
      <svg
        class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p class="text-slate-400 font-medium">
        Scanning transactions...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 text-center"
    >
      <p class="text-red-400 font-bold mb-4">
        {{ error }}
      </p>
      <button
        class="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors"
        @click="anomalyStore.fetchAnomalies"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="anomalies.length === 0"
      class="bg-white backdrop-blur-xl border border-emerald-500/10 rounded-[2rem] p-12 text-center shadow-lg shadow-emerald-500/5"
    >
      <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-4">
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        /></svg>
      </div>
      <h3 class="text-slate-900 font-bold text-lg">
        All clear!
      </h3>
      <p class="text-slate-400 mt-1">
        No unusual spending detected in your ledger.
      </p>
    </div>

    <!-- Alerts Container -->
    <div
      v-else
      class="space-y-4"
    >
      <div 
        v-for="alert in anomalies" 
        :id="`alert-${alert.id}`"
        :key="alert.id"
        class="alert-card bg-white backdrop-blur-xl border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-slate-200/50 transition-all"
        :class="alert.status !== 'pending' ? 'opacity-50 grayscale' : 'border-l-4 border-l-red-500 hover:bg-slate-50'"
      >
        <div class="flex items-start md:items-center gap-4">
          <div
            class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl"
            :class="alert.status === 'pending' ? 'bg-red-500/10 text-red-400' : 'bg-slate-100 text-slate-400'"
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
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-slate-900 font-bold">
                {{ alert.title }}
              </h3>
              <span class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                Score {{ formatScore(alert.anomalyScore) }}
              </span>
            </div>
            <p class="mt-1 font-semibold text-slate-700">
              {{ formatMoney(alert.amount, alert.currency) }} · {{ alert.merchantName }}
            </p>
            <p class="text-sm text-slate-500">
              {{ alert.categoryName }}
            </p>
            <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              {{ alert.explanation }}
            </p>
            <p class="text-slate-400 text-sm mt-1">
              Detected on {{ new Date(alert.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div
          v-if="alert.status === 'pending'"
          class="flex items-center gap-3 w-full md:w-auto"
        >
          <button
            class="flex-1 md:flex-none px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="resolvingIds.has(alert.id)"
            @click="handleResolve(alert.id, 'dismiss')"
          >
            Dismiss
          </button>
          <button
            class="flex-1 md:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="resolvingIds.has(alert.id)"
            @click="handleResolve(alert.id, 'confirm')"
          >
            Confirm anomaly
          </button>
        </div>
        <div
          v-else
          class="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-sm font-bold uppercase tracking-wider"
        >
          {{ alert.status === 'confirmed' ? 'Confirmed anomaly' : 'Dismissed' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
