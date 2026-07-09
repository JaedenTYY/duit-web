<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useInsightStore } from '@/stores/insight'
import InsightCard from '@/components/insights/InsightCard.vue'
import AnomalyDashboard from '@/components/anomaly/AnomalyDashboard.vue'

const store = useInsightStore()
const listContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await store.fetchInsights()
  animateList()
})

function animateList() {
  if (listContainer.value && store.insights.length > 0) {
    const ctx = gsap.context(() => {
      gsap.from(listContainer.value?.children || [], {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      })
    }, listContainer.value)
    return () => ctx.revert()
  }
}

watch(() => store.insights.length, (newLen, oldLen) => {
  if (newLen > 0 && oldLen === 0) {
    setTimeout(animateList, 50)
  }
})
</script>

<template>
  <div class="relative min-h-[85vh] pb-32">
    <!-- Header -->
    <header class="mb-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-4xl font-bold text-slate-900 tracking-tight">
          AI Insights
        </h1>
        <p class="text-slate-400 font-medium mt-1">
          Seven-day spending analysis compared with the previous week
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="store.generating"
        @click="store.generateWeeklyInsight"
      >
        {{ store.generating ? 'Generating…' : 'Generate Weekly Insight' }}
      </button>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Insights Column -->
      <div class="space-y-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">
          Spending Patterns
        </h2>
        <!-- Error State -->
        <div
          v-if="store.error"
          class="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-sm font-semibold flex items-center gap-3"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {{ store.error }}
        </div>

        <!-- Loading Skeleton -->
        <div
          v-if="store.loading && store.insights.length === 0"
          class="space-y-6"
        >
          <div
            v-for="i in 2"
            :key="i"
            class="h-64 bg-white rounded-[2rem] border border-slate-100 animate-pulse"
          />
        </div>

        <!-- Empty State -->
        <div
          v-else-if="!store.loading && store.insights.length === 0"
          class="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center"
        >
          <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6">
            🤖
          </div>
          <h3 class="text-xl font-bold text-slate-900 tracking-tight mb-2">
            No weekly insight yet
          </h3>
          <p class="text-slate-400 text-base font-medium max-w-sm mx-auto leading-relaxed">
            Generate an insight to compare your latest seven days with the previous week.
          </p>
        </div>

        <!-- Insights List -->
        <div
          v-else
          ref="listContainer"
          class="space-y-8"
        >
          <InsightCard 
            v-for="insight in store.insights" 
            :key="insight.id" 
            :insight="insight"
          />
        </div>
      </div>

      <!-- Anomaly Column -->
      <div class="space-y-8">
        <AnomalyDashboard />
      </div>
    </div>
  </div>
</template>
