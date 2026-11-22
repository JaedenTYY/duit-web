<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { useBillStore } from '@/stores/bill'
import { useAnomalyStore } from '@/stores/anomaly'
import { useInsightStore } from '@/stores/insight'
import { formatCurrency } from '@/utils/currency'
import { toPresentationNumber } from '@/utils/financialDecimal'
import {
  currentReportingYearMonth,
  REPORTING_TIME_ZONE,
} from '@/utils/localDateTime'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import SpendingBreakdown from '@/components/shared/SpendingBreakdown.vue'
import AppIcon from '@/components/shared/AppIcon.vue'

const router = useRouter()
const transactions = useTransactionStore()
const bills = useBillStore()
const anomalies = useAnomalyStore()
const insights = useInsightStore()

const now = new Date()
const { year, month } = currentReportingYearMonth(now)
const period = new Intl.DateTimeFormat('en-MY', {
  month: 'long',
  timeZone: REPORTING_TIME_ZONE,
}).format(now)
const dayOfMonth = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  timeZone: REPORTING_TIME_ZONE,
}).format(now)
const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

const spentDisplay = computed(() => {
  const summary = transactions.monthlySummary
  return summary ? formatCurrency(summary.totalSpend, summary.currency) : null
})

const recent = computed(() => transactions.transactions.slice(0, 5))
const pendingAnomalies = computed(() =>
  anomalies.anomalies.filter((alert) => alert.status === 'pending')
)
const pendingAlert = computed(() => pendingAnomalies.value[0])
const toReviewCount = computed(
  () => pendingAnomalies.value.length + Number(Boolean(bills.bill))
)
const latestInsight = computed(() => insights.insights[0])
const weeklyComparison = computed(() => {
  const content = latestInsight.value?.content
  if (!content?.spendingTrend) return []

  const weeks = [
    { label: 'Previous week', amount: content.spendingTrend.previousTotal },
    { label: 'Reviewed week', amount: content.spendingTrend.currentTotal },
  ]
  const peak = Math.max(
    ...weeks.map(({ amount }) => toPresentationNumber(amount))
  )
  if (peak <= 0) return []

  return weeks.map(({ label, amount }) => ({
    label,
    total: formatCurrency(amount, content.currency),
    height: Math.max(0, (toPresentationNumber(amount) / peak) * 100) + '%',
  }))
})

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    timeZone: REPORTING_TIME_ZONE,
  })

const initials = (name: string | null | undefined) =>
  (name?.trim() || 'TX')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

function avatarStyle(categoryName?: string | null) {
  const category = (categoryName || '').toLowerCase()
  if (category.includes('food') || category.includes('dining'))
    return { background: '#f6e8da', color: '#8a4e17' }
  if (category.includes('grocer'))
    return { background: '#e4ede7', color: '#2f5e45' }
  if (category.includes('shop'))
    return { background: '#f2e6ea', color: '#7a3a50' }
  if (category.includes('transp') || category.includes('grab'))
    return { background: '#e3eaf2', color: '#2f527a' }
  if (category.includes('bill') || category.includes('util'))
    return { background: '#eae7f2', color: '#4f4778' }
  return {}
}

const searchInput = ref<HTMLInputElement | null>(null)
const search = ref('')
function handleKeydown(event: KeyboardEvent) {
  if (
    event.key !== '/' ||
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    !searchInput.value?.offsetWidth ||
    (event.target instanceof HTMLElement &&
      event.target.closest(
        'input, textarea, select, [contenteditable], [role="dialog"]'
      ))
  ) {
    return
  }
  event.preventDefault()
  searchInput.value.focus()
}

function handleSearchSubmit() {
  const query = search.value.trim()
  if (query) void router.push({ path: '/transactions', query: { q: query } })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  void Promise.allSettled([
    transactions.fetchMonthlySummary(year, month),
    transactions.fetchTransactions(true),
    anomalies.fetchAnomalies(),
    insights.fetchInsights(),
  ])
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="duit-home-page">
    <header class="home-header">
      <div>
        <h1>{{ period }}</h1>
        <p class="home-caption">
          Day {{ dayOfMonth }} of {{ totalDaysInMonth }} · Calendar month
        </p>
      </div>

      <div class="home-header-actions">
        <form
          class="home-search"
          role="search"
          @submit.prevent="handleSearchSubmit"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref="searchInput"
            v-model="search"
            type="search"
            aria-label="Search activity"
            aria-keyshortcuts="/"
            placeholder="Search activity  ( / )"
          />
        </form>

        <RouterLink
          to="/insights#anomalies"
          class="home-notifications"
          aria-label="Notifications"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a2 2 0 0 0 3.4 0"
            />
          </svg>
          <span v-if="pendingAlert" aria-hidden="true" />
        </RouterLink>
      </div>
    </header>

    <ErrorBanner :message="transactions.error" />
    <ErrorBanner :message="transactions.monthlySummaryError" />

    <div class="home-grid">
      <div class="home-column">
        <section class="home-spend" aria-labelledby="home-spend-title">
          <h2 id="home-spend-title" class="home-caption">Spent so far</h2>

          <LoadingSkeleton
            v-if="
              transactions.monthlySummaryStatus === 'loading' && !spentDisplay
            "
            :rows="2"
          />
          <template v-else-if="spentDisplay">
            <p class="home-amount num">
              <span>{{ spentDisplay.split(' ')[0] }}</span>
              {{ spentDisplay.split(' ').slice(1).join(' ') }}
            </p>
            <p class="home-caption">
              {{ transactions.monthlySummary?.transactionCount }} transactions
              recorded this month
            </p>
            <SpendingBreakdown
              :categories="transactions.monthlySummary?.byCategory || []"
              :currency="transactions.monthlySummary?.currency"
            />
          </template>
        </section>

        <section class="home-section" aria-labelledby="home-review-title">
          <h2 id="home-review-title" class="home-section-title">
            To review
            <span v-if="toReviewCount" class="home-count tag num">{{
              toReviewCount
            }}</span>
          </h2>
          <ErrorBanner :message="anomalies.error" />
          <div v-if="toReviewCount" class="grp">
            <RouterLink
              v-if="pendingAlert"
              to="/insights#anomalies"
              class="row"
            >
              <span class="av home-alert-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 12h4l3-7 4 14 3-7h4"
                  />
                </svg>
              </span>
              <span class="rt">
                <b>
                  {{ pendingAlert.merchantName }} ·
                  {{
                    formatCurrency(pendingAlert.amount, pendingAlert.currency)
                  }}
                </b>
                <span>Unusual for you</span>
              </span>
              <span class="home-link">Review</span>
            </RouterLink>

            <RouterLink
              v-if="bills.bill"
              :to="`/split-bill/${bills.bill.id}`"
              class="row"
            >
              <span class="av home-tool-icon"><AppIcon name="users" /></span>
              <span class="rt">
                <b>{{ bills.bill.merchantName || 'Shared bill split' }}</b>
                <span>View participants and settlement</span>
              </span>
              <span class="home-link">Open</span>
            </RouterLink>
          </div>

          <LoadingSkeleton v-else-if="anomalies.loading" :rows="1" />
          <p v-else-if="!anomalies.error" class="home-review-empty">
            <AppIcon name="check" />
            All caught up. Nothing needs you right now.
          </p>
        </section>

        <section class="home-section" aria-labelledby="home-recent-title">
          <div class="home-section-heading">
            <h2 id="home-recent-title" class="home-section-title">Recent</h2>
            <RouterLink to="/transactions" class="home-link"
              >See all activity</RouterLink
            >
          </div>
          <div v-if="recent.length" class="grp">
            <RouterLink
              v-for="tx in recent"
              :key="tx.id"
              to="/transactions"
              class="row"
            >
              <span class="av" :style="avatarStyle(tx.categoryName)">
                {{ initials(tx.merchantName) }}
              </span>
              <span class="rt">
                <b>{{ tx.merchantName || tx.description || 'Transaction' }}</b>
                <span
                  >{{ tx.categoryName || 'Uncategorised' }} ·
                  {{ dateLabel(tx.occurredAt) }}</span
                >
              </span>
              <span class="amt">{{
                formatCurrency(tx.amount, tx.currency)
              }}</span>
            </RouterLink>
          </div>

          <LoadingSkeleton v-else-if="transactions.loading" :rows="2" />
          <div v-else-if="!transactions.error" class="home-empty-card">
            <p class="home-caption">No transactions recorded yet.</p>
            <RouterLink to="/transactions?add=1" class="home-link"
              >Add your first expense</RouterLink
            >
          </div>
        </section>
      </div>

      <div class="home-column">
        <section class="home-week" aria-labelledby="home-week-title">
          <h2 id="home-week-title">Weekly review</h2>
          <ErrorBanner :message="insights.error" />
          <LoadingSkeleton
            v-if="insights.loading && !latestInsight"
            :rows="2"
          />
          <template v-else-if="latestInsight">
            <p class="home-week-headline">
              {{ latestInsight.content.headline }}
            </p>
            <p class="home-caption">{{ latestInsight.content.summary }}</p>
            <ul
              v-if="weeklyComparison.length"
              class="home-week-chart"
              aria-label="Weekly spending comparison"
            >
              <li v-for="week in weeklyComparison" :key="week.label">
                <div class="home-week-track" aria-hidden="true">
                  <div class="home-week-bar" :style="{ height: week.height }" />
                </div>
                <span class="home-caption">{{ week.label }}</span>
                <strong class="num">{{ week.total }}</strong>
              </li>
            </ul>
          </template>
          <p v-else-if="!insights.error" class="home-caption">
            Record expenses to build your first weekly review.
          </p>
          <RouterLink to="/insights" class="home-link">
            Open weekly review <span aria-hidden="true">→</span>
          </RouterLink>
        </section>

        <section class="home-section" aria-labelledby="home-tools-title">
          <h2 id="home-tools-title" class="home-section-title">Money tools</h2>
          <div class="grp">
            <RouterLink to="/inbox" class="row">
              <span class="av home-tool-icon"><AppIcon name="receipt" /></span>
              <span class="rt">
                <b>Import spending</b>
                <span>Receipts, bank statements, and Gmail</span>
              </span>
              <span class="home-chevron" aria-hidden="true">›</span>
            </RouterLink>
            <RouterLink to="/split-bill" class="row">
              <span class="av home-tool-icon"><AppIcon name="users" /></span>
              <span class="rt">
                <b>Split a bill</b>
                <span>Share a receipt and track payments</span>
              </span>
              <span class="home-chevron" aria-hidden="true">›</span>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.duit-home-page,
.home-column {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 28px;
  min-width: 0;
}

.home-header,
.home-header-actions,
.home-section-heading,
.home-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-header,
.home-section-heading {
  justify-content: space-between;
}

.home-header h1 {
  font-size: 17px;
  line-height: 24px;
}

.home-header-actions {
  min-width: 0;
}

.home-search {
  display: none;
}

.home-notifications {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.home-notifications:hover {
  background: var(--sunken);
}

.home-notifications span {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--saffron);
  box-shadow: 0 0 0 2px var(--paper);
}

.home-notifications svg,
.home-search svg,
.home-alert-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
}

.home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 28px;
}

.home-spend,
.home-section,
.home-week {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 12px;
  min-width: 0;
}

.home-spend {
  gap: 6px;
}

.home-caption {
  color: var(--muted);
  font-size: 13px;
  line-height: 18px;
}

.home-spend h2 {
  font-weight: 400;
  letter-spacing: normal;
}

.home-amount {
  font-size: clamp(34px, 10vw, 48px);
  line-height: 1.1;
  font-weight: 600;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}

.home-amount span {
  margin-inline-end: 4px;
  color: var(--muted);
  font-size: 0.58em;
}

.home-section-title {
  font-size: 17px;
  line-height: 24px;
}

.home-count {
  align-self: center;
  background: var(--ink);
  color: var(--panel);
  font-size: 11px;
}

.home-alert-icon {
  background: #f9e6dc;
  color: #a3421a;
}

.home-tool-icon {
  background: var(--accent-tint);
  color: var(--accent-deep);
}

.home-tool-icon svg {
  width: 20px;
  height: 20px;
}

.home-link {
  width: fit-content;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
}

a.home-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
}

a.home-link:hover {
  text-decoration: underline;
}

a.row:hover .rt b {
  color: var(--accent);
}

.home-chevron {
  color: var(--accent);
  font-size: 22px;
}

.home-review-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  color: #2e7048;
  font-size: 14px;
}

.home-review-empty svg {
  flex: none;
  width: 20px;
  height: 20px;
}

.home-week,
.home-empty-card {
  border-radius: 16px;
  background: var(--panel);
}

.home-empty-card {
  padding: 18px 20px 8px;
}

.home-week {
  gap: 8px;
  padding: 20px 20px 12px;
}

.home-week h2 {
  color: var(--caption);
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.home-week-headline {
  font-size: 18px;
  line-height: 1.4;
  font-weight: 600;
}

.home-week-chart {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.home-week-chart li {
  display: grid;
  gap: 4px;
  min-width: 0;
  font-size: 13px;
}

.home-week-track {
  display: flex;
  align-items: end;
  height: 72px;
  border-bottom: 1px solid var(--rule);
}

.home-week-bar {
  width: 100%;
  border-radius: 6px 6px 0 0;
  background: var(--rule-strong);
}

.home-week-chart li:last-child .home-week-bar {
  background: var(--accent);
}

@media (max-width: 860px) {
  .home-amount {
    font-size: clamp(32px, 10vw, 40px);
  }
}

@media (min-width: 861px) {
  .duit-home-page,
  .home-column,
  .home-grid {
    gap: 32px;
  }

  .home-header h1 {
    font-size: 28px;
    line-height: 34px;
    font-weight: 700;
  }

  .home-header-actions {
    flex: 0 1 380px;
  }

  .home-search {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 8px;
    min-width: 0;
    height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--sunken);
    color: var(--muted);
  }

  .home-search:focus-within {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .home-search svg {
    flex: none;
    width: 20px;
    height: 20px;
  }

  .home-search input {
    flex: 1;
    min-width: 0;
    height: 100%;
    outline: none;
    background: transparent;
    color: var(--ink);
    font-size: 15px;
  }

  .home-search input::placeholder {
    color: var(--caption);
  }

  .home-week {
    padding: 24px 24px 16px;
  }
}

@media (min-width: 1080px) {
  .home-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
