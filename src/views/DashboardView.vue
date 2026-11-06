<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { useBillStore } from '@/stores/bill'
import { useAnomalyStore } from '@/stores/anomaly'
import { useInsightStore } from '@/stores/insight'
import { formatCurrency } from '@/utils/currency'
import { currentReportingYearMonth, REPORTING_TIME_ZONE } from '@/utils/localDateTime'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import SpendingBreakdown from '@/components/shared/SpendingBreakdown.vue'

const transactions = useTransactionStore()
const bills = useBillStore()
const anomalies = useAnomalyStore()
const insights = useInsightStore()
const { year, month } = currentReportingYearMonth()
const period = new Intl.DateTimeFormat('en-MY', { month: 'long', timeZone: REPORTING_TIME_ZONE }).format(new Date())
const spentDisplay = computed(() => transactions.monthlySummary ? formatCurrency(transactions.monthlySummary.totalSpend, transactions.monthlySummary.currency) : null)
const recent = computed(() => transactions.transactions.slice(0, 3))
const pendingAlert = computed(() => anomalies.anomalies.find(alert => alert.status === 'pending'))
const latestInsight = computed(() => insights.insights[0])
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: REPORTING_TIME_ZONE })
const initials = (merchant: string | null | undefined) => (merchant || 'Transaction').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()

onMounted(() => {
  void Promise.allSettled([
    transactions.fetchMonthlySummary(year, month),
    transactions.fetchTransactions(true),
    anomalies.fetchAnomalies(),
    insights.fetchInsights(),
  ])
})
</script>

<template>
  <div class="duit-home">
    <header class="home-period">
      <div>
        <h1>{{ period }}</h1>
        <p>Calendar month · recorded in Duit</p>
      </div>
      <RouterLink to="/insights#anomalies" class="home-icon-link" aria-label="Review unusual activity">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21h4" /></svg>
      </RouterLink>
    </header>
    <ErrorBanner :message="transactions.error" />
    <ErrorBanner :message="transactions.monthlySummaryError" />
    <LoadingSkeleton v-if="transactions.monthlySummaryStatus === 'loading' && !transactions.monthlySummary" :rows="3" />
    <template v-else>
      <div class="home-grid">
        <div>
          <section class="home-summary" aria-labelledby="home-spend-title">
            <p id="home-spend-title" class="home-eyebrow">Spent so far</p>
            <p class="home-amount"><template v-if="spentDisplay"><span>{{ spentDisplay.split(' ')[0] }}</span> {{ spentDisplay.split(' ').slice(1).join(' ') }}</template><template v-else>—</template></p>
            <p class="home-subline">{{ transactions.monthlySummary ? `${transactions.monthlySummary.transactionCount} transactions recorded this month` : 'Your spending will appear after you add an expense.' }}</p>
            <SpendingBreakdown :categories="transactions.monthlySummary?.byCategory || []" :currency="transactions.monthlySummary?.currency" />
          </section>

          <section class="home-section">
            <div class="home-section-heading"><h2>To review</h2><RouterLink v-if="pendingAlert" to="/insights#anomalies">See all →</RouterLink></div>
            <RouterLink v-if="pendingAlert" to="/insights#anomalies" class="home-attention">
              <strong>Unusual for you</strong>
              <span>{{ pendingAlert.merchantName }} · {{ formatCurrency(pendingAlert.amount, pendingAlert.currency) }}</span>
              <small>{{ pendingAlert.explanation }}</small>
              <b>Review this →</b>
            </RouterLink>
            <p v-else class="home-quiet">✓ &nbsp; All caught up. Nothing needs you right now.</p>
          </section>

          <section class="home-section">
            <div class="home-section-heading"><h2>This week</h2></div>
            <div class="home-insight">
              <p>{{ latestInsight?.content.headline || "We're still learning your spending patterns." }}</p>
              <small>{{ latestInsight?.content.summary || 'Your weekly review will appear as you record spending.' }}</small>
              <RouterLink to="/insights">Open review →</RouterLink>
            </div>
          </section>
        </div>

        <div>
          <section class="home-section">
            <div class="home-section-heading"><h2>Coming up</h2><RouterLink to="/split-bill">Open splits →</RouterLink></div>
            <RouterLink v-if="bills.bill" :to="`/split-bill/${bills.bill.id}`" class="home-group-row">
              <span class="home-avatar">{{ initials(bills.bill.merchantName) }}</span>
              <span><b>{{ bills.bill.merchantName || 'Shared bill' }}</b><small>Current split · view people and items</small></span>
              <span class="home-chevron">›</span>
            </RouterLink>
            <RouterLink v-else to="/split-bill" class="home-group-row"><span class="home-avatar">+</span><span><b>Split a shared bill</b><small>Guests can choose items without an account</small></span><span class="home-chevron">›</span></RouterLink>
          </section>

          <section class="home-section">
            <div class="home-section-heading"><h2>Recent</h2><RouterLink to="/transactions">See all →</RouterLink></div>
            <div v-if="recent.length" class="home-row-group">
              <RouterLink v-for="tx in recent" :key="tx.id" to="/transactions" class="home-group-row">
                <span class="home-avatar">{{ initials(tx.merchantName) }}</span>
                <span><b>{{ tx.merchantName || tx.description || 'Transaction' }}</b><small>{{ tx.categoryName || 'Uncategorised' }} · {{ dateLabel(tx.occurredAt) }}</small></span>
                <strong class="home-row-amount">{{ formatCurrency(tx.amount, tx.currency) }}</strong>
              </RouterLink>
            </div>
            <div v-else class="home-empty"><p>No transactions yet.</p><RouterLink to="/transactions?add=1">Add your first expense →</RouterLink></div>
          </section>
          <RouterLink to="/settings" class="home-progress-link">Your money habits start with a weekly review <span>›</span></RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>
