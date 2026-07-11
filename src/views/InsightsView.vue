<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useInsightStore } from '@/stores/insight'
import InsightCard from '@/components/insights/InsightCard.vue'
import AnomalyDashboard from '@/components/anomaly/AnomalyDashboard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import QuestCard from '@/components/shared/QuestCard.vue'

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
    <PageHeader
      class="mb-6"
      eyebrow="Weekly coach"
      title="Beat this week’s money challenge"
      description="Generate an insight, inspect anomalies, and turn spending changes into one practical next move."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="store.generating"
          @click="store.generateWeeklyInsight"
        >
          {{ store.generating ? 'Thinking...' : 'Earn +60 XP' }}
        </button>
      </template>
    </PageHeader>

    <section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <QuestCard
        title="Find the pattern"
        description="Generate the weekly insight and learn what changed in your spending."
        reward="+60 XP"
        icon="🧠"
        tone="mint"
        action-label="Generate"
        @click="store.generateWeeklyInsight"
      />
      <QuestCard
        title="Resolve alerts"
        description="Check unusual spending and keep your financial feed clean."
        reward="+30 XP"
        icon="🚦"
        tone="coral"
        action-label="Review"
      />
      <QuestCard
        title="Scan more proof"
        description="Add receipts so the coach has better evidence for next week."
        reward="+50 XP"
        icon="📸"
        tone="sky"
        to="/inbox"
        action-label="Scan"
      />
    </section>

    <div class="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <!-- Insights Column -->
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-black text-slate-950">
            Coach notes
          </h2>
          <p class="mt-1 text-sm font-semibold text-slate-500">
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
