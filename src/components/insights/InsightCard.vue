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

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

function comparisonLabel(percentage: number, direction: Insight['content']['spendingTrend']['direction']) {
  if (direction === 'NEW') return 'New baseline'
  if (percentage === 0) return 'No change'
  return `${Math.abs(percentage).toFixed(1)}% ${percentage > 0 ? 'higher' : 'lower'}`
}

function recommendations(insight: Insight) {
  return insight.content.recommendations.length
    ? insight.content.recommendations
    : [insight.content.recommendation]
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
      <span
        class="rounded-full px-3 py-1 text-xs font-bold"
        :class="{
          'bg-emerald-50 text-emerald-700': insight.content.riskLevel === 'LOW',
          'bg-amber-50 text-amber-700': insight.content.riskLevel === 'MEDIUM',
          'bg-red-50 text-red-700': insight.content.riskLevel === 'HIGH',
        }"
      >
        {{ insight.content.riskLevel }} RISK
      </span>
    </div>

    <p class="text-slate-600 text-lg leading-relaxed mb-8">
      {{ insight.content.summary }}
    </p>

    <div class="grid grid-cols-2 gap-3 mb-8">
      <div class="rounded-2xl bg-slate-900 p-4 text-white">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Last 7 days
        </p>
        <p class="mt-2 text-2xl font-bold">
          {{ formatMoney(insight.content.totalSpent, insight.content.currency) }}
        </p>
      </div>
      <div class="rounded-2xl bg-slate-50 p-4">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          vs previous week
        </p>
        <p class="mt-2 text-lg font-bold text-slate-900">
          {{ comparisonLabel(insight.content.comparisonPercentage, insight.content.spendingTrend.direction) }}
        </p>
      </div>
    </div>

    <div
      v-if="insight.content.topCategories.length"
      class="mb-8"
    >
      <h3 class="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
        Category breakdown
      </h3>
      <div class="space-y-4">
        <div
          v-for="category in insight.content.topCategories"
          :key="category.categoryName"
        >
          <div class="mb-1.5 flex items-center justify-between text-sm">
            <span class="font-semibold text-slate-700">{{ category.categoryName }}</span>
            <span class="text-slate-500">
              {{ formatMoney(category.amount, insight.content.currency) }} · {{ category.percentage.toFixed(1) }}%
            </span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-blue-500"
              :style="{ width: `${Math.min(category.percentage, 100)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

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
        Recommendations
      </h4>
      <ul class="space-y-2 text-slate-600">
        <li
          v-for="recommendation in recommendations(insight)"
          :key="recommendation"
          class="flex gap-2"
        >
          <span aria-hidden="true">•</span>
          <span>{{ recommendation }}</span>
        </li>
      </ul>
    </div>

    <p class="text-emerald-600 text-sm font-medium italic text-center">
      "{{ insight.content.positiveNote }}"
    </p>
    <p class="mt-4 text-center text-xs text-slate-400">
      Generated {{ new Date(insight.generatedAt).toLocaleString() }}
    </p>
  </div>
</template>
