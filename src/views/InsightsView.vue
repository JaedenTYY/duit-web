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
const period = new Date(Date.UTC(year, month - 1)).toLocaleDateString('en-MY', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const categories = computed(() => store.monthlySummary?.byCategory || [])

async function focusAlerts() {
  if (route.hash !== '#anomalies') return
  await nextTick()
  anomalySection.value?.scrollIntoView({ block: 'start' })
  anomalySection.value?.focus({ preventScroll: true })
}

onMounted(async () => {
  await Promise.allSettled([
    store.fetchMonthlySummary(year, month),
    insightStore.fetchInsights(),
  ])
  await focusAlerts()
})

watch(() => route.hash, focusAlerts)
</script>

<template>
  <div>
    <PageHeader
      title="Insights"
      :description="`${period} · Changes and patterns worth knowing about.`"
    />

    <ErrorBanner :message="store.monthlySummaryError" />
    <ErrorBanner :message="insightStore.error" />

    <div class="insight-grid">
      <!-- Left Column: Weekly Reviews & Anomalies -->
      <div>
        <section class="insight-section">
          <div class="insight-heading">
            <h2>Your weekly review</h2>
            <button
              type="button"
              class="b3 btn"
              :disabled="insightStore.generating"
              @click="insightStore.generateWeeklyInsight()"
            >
              {{ insightStore.generating ? 'Preparing…' : 'Refresh review' }}
            </button>
          </div>

          <div v-if="insightStore.loading && !insightStore.insights.length">
            <LoadingSkeleton :rows="2" />
          </div>

          <div v-else-if="insightStore.insights.length" class="insight-list">
            <details
              v-for="insight in insightStore.insights"
              :key="insight.id"
              class="insight-entry"
            >
              <summary>
                <span>
                  <strong>{{ insight.content.headline }}</strong>
                  <small>
                    {{
                      new Date(insight.periodStart).toLocaleDateString(
                        'en-MY',
                        { day: 'numeric', month: 'short' }
                      )
                    }}
                    –
                    {{
                      new Date(insight.periodEnd).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                      })
                    }}
                  </small>
                </span>
                <span aria-hidden="true" style="color: #0e5a52; font-size: 20px"
                  >›</span
                >
              </summary>
              <div class="insight-body">
                <p>{{ insight.content.summary }}</p>
                <p
                  v-if="insight.content.positiveNote"
                  style="color: #2e7048; font-weight: 500"
                >
                  ✓ {{ insight.content.positiveNote }}
                </p>
                <p v-if="insight.content.recommendation" class="insight-rec">
                  <strong>Worth trying:</strong>
                  {{ insight.content.recommendation }}
                </p>
              </div>
            </details>
          </div>

          <div
            v-else
            style="
              padding: 24px;
              background: #ffffff;
              border-radius: 16px;
              border: 1px solid #e4e0d7;
            "
          >
            <p
              style="
                margin: 0;
                color: #57534c;
                font-size: 14px;
                line-height: 20px;
              "
            >
              We're still learning your spending patterns. Your weekly AI
              insights will appear after recording a few expenses.
            </p>
          </div>
        </section>

        <!-- Anomaly Detection Section -->
        <section
          id="anomalies"
          ref="anomalySection"
          tabindex="-1"
          class="insight-section scroll-mt-6"
        >
          <h2>Unusual for you</h2>
          <p class="insight-section-copy">
            Duit alerts you when an amount differs significantly from your usual
            patterns. You always decide what's right.
          </p>
          <AnomalyDashboard />
        </section>
      </div>

      <!-- Right Column: Monthly Category Summary -->
      <div>
        <section class="insight-section">
          <h2>By category</h2>
          <p class="insight-section-copy">
            Where your spending went this month.
          </p>

          <LoadingSkeleton
            v-if="store.monthlySummaryStatus === 'loading'"
            :rows="3"
          />

          <template v-else>
            <div v-if="store.monthlySummary" class="insight-total-card">
              <span style="font-size: 13px; color: #57534c"
                >Total recorded</span
              >
              <strong
                class="num"
                style="
                  font-size: 36px;
                  line-height: 40px;
                  font-weight: 600;
                  color: #1c1b19;
                "
              >
                {{
                  formatCurrency(
                    store.monthlySummary.totalSpend,
                    store.monthlySummary.currency
                  )
                }}
              </strong>
              <small style="color: #6e6a62; font-size: 12px">
                {{ store.monthlySummary.transactionCount }} transactions
                recorded
              </small>
            </div>

            <SpendingBreakdown
              :categories="categories"
              :currency="store.monthlySummary?.currency"
            />
          </template>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 32px;
  margin-top: 24px;
}

.insight-section {
  margin-bottom: 38px;
}

.insight-section h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1c1b19;
}

.insight-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.insight-heading h2 {
  margin: 0;
}

.insight-list {
  background: #ffffff;
  border-radius: 16px;
  padding: 0 16px;
  border: 1px solid #e4e0d7;
}

.insight-entry {
  border-bottom: 1px solid #efece5;
}

.insight-entry:last-child {
  border-bottom: 0;
}

.insight-entry summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  min-height: 72px;
  padding: 14px 0;
  cursor: pointer;
  list-style: none;
}

.insight-entry summary::-webkit-details-marker {
  display: none;
}

.insight-entry summary span:first-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.insight-entry summary strong {
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: #1c1b19;
}

.insight-entry summary small {
  color: #57534c;
  font-size: 12px;
}

.insight-body {
  padding: 0 0 18px;
  color: #57534c;
  font-size: 14px;
  line-height: 21px;
}

.insight-body p {
  margin: 0 0 10px;
}

.insight-rec {
  background: #f7f5f0;
  padding: 10px 14px;
  border-radius: 10px;
  margin-top: 8px;
}

.insight-section-copy {
  margin: 0 0 14px;
  color: #57534c;
  font-size: 13px;
  line-height: 19px;
}

.insight-total-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e4e0d7;
}

@media (max-width: 1079px) {
  .insight-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .insight-section {
    margin-bottom: 32px;
  }
}
</style>
