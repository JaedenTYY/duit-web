<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useInsightStore } from '@/stores/insight'
import InsightCard from '@/components/insights/InsightCard.vue'
import AnomalyDashboard from '@/components/anomaly/AnomalyDashboard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'

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
    <header class="mb-8 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-blue-50 p-5 sm:p-7">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-4">
          <FriendlyAvatar
            tone="emerald"
            size="md"
          />
          <div class="min-w-0">
            <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              AI financial coach
            </p>
            <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Understand what changed this week
            </h1>
            <p class="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Duit compares recent spending with your previous week and turns the signal into concise recommendations.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="store.generating"
          @click="store.generateWeeklyInsight"
        >
          {{ store.generating ? 'Generating...' : 'Generate Insight' }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <!-- Insights Column -->
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-black text-slate-950">
            Spending patterns
          </h2>
          <p class="mt-1 text-sm font-medium text-slate-500">
            Weekly summaries and recommendation cards.
          </p>
        </div>

        <ErrorBanner :message="store.error" />

        <LoadingSkeleton
          v-if="store.loading && store.insights.length === 0"
          :rows="2"
          variant="list"
        />

        <EmptyState
          v-else-if="!store.loading && store.insights.length === 0"
          title="No weekly insight yet"
          message="Generate an insight to compare your latest seven days with the previous week."
          action-label="Generate Insight"
          tone="emerald"
          @action="store.generateWeeklyInsight"
        />

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
