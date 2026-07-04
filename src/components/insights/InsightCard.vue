<script setup lang="ts">
import type { Insight, InsightFinding } from '@/types'

defineProps<{
  insight: Insight
}>()

function getSeverityColor(severity: InsightFinding['severity']) {
  switch (severity) {
    case 'positive': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'neutral': return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'warning': return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'critical': return 'text-red-700 bg-red-50 border-red-200'
    default: return 'text-slate-700 bg-slate-50 border-slate-200'
  }
}

function getDirectionIcon(direction: InsightFinding['direction']) {
  switch (direction) {
    case 'up': return '↑'
    case 'down': return '↓'
    case 'stable': return '→'
    default: return '•'
  }
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-3xl border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xl shadow-slate-200/50 transition-all hover:bg-white">
    <div class="flex items-start justify-between mb-6">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">
          {{ new Date(insight.periodStart).toLocaleDateString() }} - {{ new Date(insight.periodEnd).toLocaleDateString() }}
        </span>
        <h2 class="text-2xl font-bold text-slate-900 tracking-tight">
          {{ insight.content.headline }}
        </h2>
      </div>
    </div>

    <p class="text-slate-600 text-lg leading-relaxed mb-8">
      {{ insight.content.summary }}
    </p>

    <div class="space-y-4 mb-8">
      <div 
        v-for="(finding, idx) in insight.content.findings" 
        :key="idx"
        class="flex items-start gap-4 p-4 rounded-2xl border"
        :class="getSeverityColor(finding.severity)"
      >
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 font-bold text-lg shrink-0 shadow-sm">
          {{ getDirectionIcon(finding.direction) }}
        </div>
        <div>
          <div class="flex items-center flex-wrap gap-2 mb-1">
            <span class="font-bold text-slate-900">{{ finding.category }}</span>
            <span class="text-sm font-semibold px-2 py-0.5 rounded-full bg-white/50 border border-current/10">
              {{ finding.changePct }}%
            </span>
          </div>
          <p class="text-sm text-slate-700 leading-relaxed">
            {{ finding.commentary }}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
      <h4 class="text-blue-700 font-bold mb-2 flex items-center gap-2">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 10V3L4 14h7v7l9-11h-7z"
        /></svg>
        Recommendation
      </h4>
      <p class="text-slate-600">
        {{ insight.content.recommendation }}
      </p>
    </div>

    <p class="text-emerald-600 text-sm font-medium italic text-center">
      "{{ insight.content.positiveNote }}"
    </p>
  </div>
</template>
