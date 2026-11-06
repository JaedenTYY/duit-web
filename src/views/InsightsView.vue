<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { useInsightStore } from '@/stores/insight'
import { currentReportingYearMonth } from '@/utils/localDateTime'
import { formatCurrency } from '@/utils/currency'
import PageHeader from '@/components/shared/PageHeader.vue'
import SpendingBreakdown from '@/components/shared/SpendingBreakdown.vue'
import AnomalyDashboard from '@/components/anomaly/AnomalyDashboard.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
const store = useTransactionStore()
const insightStore = useInsightStore()
const route = useRoute()
const anomalySection = ref<HTMLElement | null>(null)
const { year, month } = currentReportingYearMonth()
const period = new Date(Date.UTC(year, month - 1)).toLocaleDateString('en-MY', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const categories = computed(() => store.monthlySummary?.byCategory || [])
async function focusAlerts() {
  if (route.hash !== '#anomalies') return
  await nextTick()
  anomalySection.value?.scrollIntoView({ block: 'start' })
  anomalySection.value?.focus({ preventScroll: true })
}
onMounted(async () => { await Promise.allSettled([store.fetchMonthlySummary(year, month), insightStore.fetchInsights()]); await focusAlerts() })
watch(() => route.hash, focusAlerts)
</script>

<template><div class="insights-page"><PageHeader title="Insights" :description="`${period} · The changes worth knowing about.`" /><ErrorBanner :message="store.monthlySummaryError" /><ErrorBanner :message="insightStore.error" /><div class="insight-grid"><div><section class="insight-section"><div class="insight-heading"><h2>Your weekly review</h2><button type="button" :disabled="insightStore.generating" @click="insightStore.generateWeeklyInsight()">{{ insightStore.generating ? 'Preparing…' : 'Refresh review' }}</button></div><div v-if="insightStore.loading && !insightStore.insights.length"><LoadingSkeleton :rows="2" /></div><div v-else-if="insightStore.insights.length" class="insight-list"><details v-for="insight in insightStore.insights" :key="insight.id" class="insight-entry"><summary><span><strong>{{ insight.content.headline }}</strong><small>{{ new Date(insight.periodStart).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) }} – {{ new Date(insight.periodEnd).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) }}</small></span><span aria-hidden="true">›</span></summary><div class="insight-body"><p>{{ insight.content.summary }}</p><p v-if="insight.content.positiveNote">{{ insight.content.positiveNote }}</p><p v-if="insight.content.recommendation"><strong>Worth trying:</strong> {{ insight.content.recommendation }}</p></div></details></div><p v-else class="insight-empty">We're still learning your spending patterns. Your review will appear as activity builds.</p></section><section id="anomalies" ref="anomalySection" tabindex="-1" class="insight-section scroll-mt-6"><h2>Unusual for you</h2><p class="insight-section-copy">Review a change and tell Duit whether you expected it.</p><AnomalyDashboard /></section></div><div><section class="insight-section"><h2>By category</h2><p class="insight-section-copy">Where your spending went this month.</p><LoadingSkeleton v-if="store.monthlySummaryStatus === 'loading'" :rows="3" /><template v-else><div v-if="store.monthlySummary" class="insight-total"><span>Total recorded</span><strong>{{ formatCurrency(store.monthlySummary.totalSpend, store.monthlySummary.currency) }}</strong><small>{{ store.monthlySummary.transactionCount }} transactions</small></div><SpendingBreakdown :categories="categories" :currency="store.monthlySummary?.currency" /></template></section></div></div></div></template>
<style scoped>.insights-page{max-width:1050px;padding-bottom:60px}.insight-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:48px}.insight-section{margin-bottom:38px}.insight-section h2{margin:0 0 10px;font-size:17px}.insight-heading{display:flex;justify-content:space-between;align-items:center;gap:10px}.insight-heading button{min-height:44px;border:0;background:transparent;color:var(--accent);font-size:13px;font-weight:600}.insight-list{border-top:1px solid var(--rule)}.insight-entry{border-bottom:1px solid var(--rule)}.insight-entry summary{display:flex;justify-content:space-between;gap:15px;min-height:72px;padding:14px 0;cursor:pointer;list-style:none}.insight-entry summary::-webkit-details-marker{display:none}.insight-entry summary span:first-child{display:flex;flex-direction:column;gap:4px}.insight-entry summary strong{font-size:14px;font-weight:600;line-height:20px}.insight-entry summary small{color:var(--muted);font-size:12px}.insight-entry summary span:last-child{color:var(--accent);font-size:22px}.insight-body{padding:0 0 18px;color:var(--muted);font-size:13px;line-height:20px}.insight-body p{margin:0 0 10px}.insight-body strong{color:var(--ink)}.insight-empty,.insight-section-copy{color:var(--muted);font-size:13px;line-height:20px}.insight-empty{padding:18px 0;border-top:1px solid var(--rule)}.insight-section-copy{margin:0 0 12px}.insight-total{display:flex;flex-direction:column;gap:4px;margin-bottom:22px;padding:20px;border-radius:12px;background:var(--accent);color:#fff}.insight-total span,.insight-total small{color:#D8E9E3;font-size:12px}.insight-total strong{font-size:32px;font-weight:600;font-variant-numeric:tabular-nums}@media(max-width:800px){.insight-grid{grid-template-columns:1fr;gap:0}.insight-section{margin-bottom:32px}}</style>
