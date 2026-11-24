<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  TransactionStaleConflictError,
  useTransactionStore,
} from '@/stores/transaction'
import TransactionCard from '@/components/transactions/TransactionCard.vue'
import AddTransactionModal from '@/components/transactions/AddTransactionModal.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'
import { addDecimalStrings } from '@/utils/financialDecimal'

const store = useTransactionStore()
const route = useRoute()
const router = useRouter()
const search = ref('')
const source = ref('all')
const category = ref('all')

const visibleTransactions = computed(() =>
  store.transactions.filter(
    (tx) =>
      (source.value === 'all' || tx.source === source.value) &&
      (category.value === 'all' || tx.categoryName === category.value) &&
      `${tx.merchantName || ''} ${tx.description || ''} ${tx.categoryName || ''}`
        .toLowerCase()
        .includes(search.value.toLowerCase())
  )
)

const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of visibleTransactions.value) {
    const day = new Date(transaction.occurredAt).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    })
    groups.set(day, [...(groups.get(day) || []), transaction])
  }
  return [...groups].map(([day, items]) => ({
    day,
    items,
    total: items.every((item) => item.currency === items[0]?.currency)
      ? formatCurrency(
          addDecimalStrings(items.map((item) => item.amount)),
          items[0]!.currency
        )
      : null,
  }))
})

const isModalOpen = ref(false)
const showReceiptModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const deletingIds = ref<Set<string>>(new Set())
const selectedTransaction = ref<Transaction | null>(null)

onMounted(async () => {
  await store.fetchCategories()
  await store.fetchTransactions(true)
  if (route.query.add === '1') isModalOpen.value = true
  if (route.query.q) search.value = String(route.query.q)
})

watch(
  () => route.query.add,
  (value) => {
    if (value === '1') isModalOpen.value = true
  }
)

async function handleDelete(transaction: Transaction) {
  if (deletingIds.value.has(transaction.id)) return
  if (confirm('Delete this transaction?')) {
    selectedTransaction.value = null
    deletingIds.value = new Set(deletingIds.value).add(transaction.id)
    try {
      await store.deleteTransaction(transaction.id, transaction.version)
    } catch (error) {
      if (error instanceof TransactionStaleConflictError) {
        alert(
          'This transaction changed before it could be deleted. The latest version was loaded; review it and try again.'
        )
      }
    } finally {
      const next = new Set(deletingIds.value)
      next.delete(transaction.id)
      deletingIds.value = next
    }
  }
}

function handleEdit(transaction: Transaction) {
  selectedTransaction.value = null
  editingTransaction.value = transaction
  isModalOpen.value = true
}

function clearFilters() {
  search.value = ''
  category.value = 'all'
  source.value = 'all'
}

function closeTransactionModal() {
  isModalOpen.value = false
  editingTransaction.value = null
  if (route.query.add === '1') void router.replace({ path: '/transactions' })
}

async function handleReceiptClose() {
  showReceiptModal.value = false
  await store.fetchTransactions(true)
}
</script>

<template>
  <div class="activity-page">
    <PageHeader
      title="Activity"
      description="All transactions captured from receipts, statements, and manual entries."
    />

    <section class="activity-tools" aria-label="Find transactions">
      <!-- Search Input -->
      <div style="position: relative; display: flex; align-items: center">
        <label class="sr-only" for="ledger-search"
          >Search loaded transactions</label
        >
        <svg
          style="
            position: absolute;
            left: 14px;
            width: 18px;
            height: 18px;
            fill: none;
            stroke: #6e6a62;
            stroke-width: 1.75;
            pointer-events: none;
          "
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="ledger-search"
          v-model="search"
          type="search"
          placeholder="Search activity by merchant, note, or category"
          class="ledger-search"
          style="padding-left: 42px"
        />
      </div>

      <!-- Filter Chips -->
      <div class="filter-chips" aria-label="Filter by category">
        <button
          type="button"
          class="chipf"
          :class="{ on: category === 'all' }"
          :aria-pressed="category === 'all'"
          @click="category = 'all'"
        >
          All
        </button>

        <button
          v-for="option in store.categories.slice(0, 8)"
          :key="option.id"
          type="button"
          class="chipf"
          :class="{ on: category === option.name }"
          :aria-pressed="category === option.name"
          @click="category = option.name"
        >
          {{ option.name }}
        </button>
      </div>

      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        "
      >
        <label class="activity-source">
          Source
          <select v-model="source">
            <option value="all">All sources</option>
            <option value="manual">Manual</option>
            <option value="receipt">Receipt</option>
            <option value="statement">Statement</option>
            <option value="gmail">Gmail</option>
          </select>
        </label>

        <p
          v-if="search || source !== 'all' || category !== 'all'"
          role="status"
          class="activity-count"
        >
          Showing {{ visibleTransactions.length }} of
          {{ store.transactions.length }} loaded transactions
        </p>
      </div>
    </section>

    <ErrorBanner :message="store.error" />

    <LoadingSkeleton
      v-if="store.loading && store.transactions.length === 0"
      :rows="5"
    />

    <div
      v-else-if="groupedTransactions.length === 0 && !store.error"
      class="activity-empty-filter"
    >
      <EmptyState
        v-if="store.transactions.length === 0"
        title="No activity yet"
        message="Add an expense or scan a receipt to start tracking spending."
        action-label="Add an expense"
        @action="isModalOpen = true"
      />
      <EmptyState
        v-else
        title="No transactions found"
        message="Clear your filters to view all loaded activity."
        action-label="Clear filters"
        @action="clearFilters"
      />
    </div>

    <!-- Grouped Ledger -->
    <div v-else class="activity-groups">
      <section
        v-for="group in groupedTransactions"
        :key="group.day"
        class="activity-group"
      >
        <div class="activity-group-head">
          <h2>{{ group.day }}</h2>
          <span v-if="group.total" class="num">{{ group.total }}</span>
        </div>

        <div class="grp activity-group-rows">
          <TransactionCard
            v-for="transaction in group.items"
            :key="transaction.id"
            :transaction="transaction"
            :deleting="deletingIds.has(transaction.id)"
            @open="selectedTransaction = $event"
          />
        </div>
      </section>

      <button
        v-if="store.hasMore"
        type="button"
        class="activity-more"
        :disabled="store.loading"
        @click="store.fetchTransactions()"
      >
        {{ store.loading ? 'Loading…' : 'Load older activity' }}
      </button>
    </div>

    <!-- Transaction Detail Sheet -->
    <div
      v-if="selectedTransaction"
      class="detail-layer"
      @click.self="selectedTransaction = null"
    >
      <section
        class="detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
      >
        <div class="add-sheet-handle" />
        <div class="detail-head">
          <h2 id="transaction-detail-title">Transaction</h2>
          <button
            type="button"
            aria-label="Close transaction detail"
            @click="selectedTransaction = null"
          >
            ×
          </button>
        </div>

        <p class="detail-merchant">
          {{
            selectedTransaction.merchantName ||
            selectedTransaction.description ||
            'Transaction'
          }}
        </p>

        <p class="detail-amount">
          <span style="font-size: 22px; color: #57534c; margin-right: 4px">{{
            selectedTransaction.currency
          }}</span>
          {{
            formatCurrency(
              selectedTransaction.amount,
              selectedTransaction.currency
            )
              .split(' ')
              .slice(1)
              .join(' ')
          }}
        </p>

        <dl class="detail-list">
          <div>
            <dt>Category</dt>
            <dd>{{ selectedTransaction.categoryName || 'Uncategorised' }}</dd>
          </div>
          <div>
            <dt>Date and time</dt>
            <dd>
              {{
                new Date(selectedTransaction.occurredAt).toLocaleDateString(
                  'en-MY',
                  {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kuala_Lumpur',
                  }
                )
              }}
            </dd>
          </div>
          <div>
            <dt>Captured via</dt>
            <dd style="text-transform: capitalize">
              {{ selectedTransaction.source }}
            </dd>
          </div>
          <div v-if="selectedTransaction.description">
            <dt>Note</dt>
            <dd>{{ selectedTransaction.description }}</dd>
          </div>
        </dl>

        <div style="display: flex; flex-direction: column; gap: 8px">
          <button
            type="button"
            class="btn b1 detail-primary"
            @click="handleEdit(selectedTransaction)"
          >
            Edit transaction
          </button>
          <button
            type="button"
            class="detail-delete"
            :disabled="deletingIds.has(selectedTransaction.id)"
            @click="handleDelete(selectedTransaction)"
          >
            Delete transaction
          </button>
        </div>
      </section>
    </div>

    <AddTransactionModal
      v-if="isModalOpen"
      :transaction="editingTransaction"
      @close="closeTransactionModal"
    />

    <ReceiptUploadModal v-if="showReceiptModal" @close="handleReceiptClose" />
  </div>
</template>

<style scoped>
.activity-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0 28px;
}

.ledger-search {
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  background: #efece5;
  color: #1c1b19;
  font-size: 15px;
  padding: 0 14px;
  box-sizing: border-box;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.filter-chips::-webkit-scrollbar {
  display: none;
}

.activity-source {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #57534c;
  font-size: 13px;
}

.activity-source select {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid #e4e0d7;
  border-radius: 9px;
  background: #ffffff;
  color: #1c1b19;
  font-size: 13px;
}

.activity-count {
  margin: 0;
  color: #57534c;
  font-size: 12px;
}

.activity-group {
  margin-top: 24px;
}

.activity-group-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
  padding: 0 4px;
}

.activity-group-head h2 {
  font-size: 14px;
  font-weight: 600;
  color: #1c1b19;
}

.activity-group-head span {
  color: #57534c;
  font-size: 13px;
  font-weight: 500;
}

.activity-group-rows {
  background: #ffffff;
  border-radius: 16px;
  padding: 0 16px;
}

.activity-more {
  width: 100%;
  min-height: 52px;
  margin-top: 24px;
  border: 1px solid #d6d1c6;
  border-radius: 12px;
  background: #ffffff;
  color: #0e5a52;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.activity-empty-filter {
  padding: 32px 0;
}

.detail-layer {
  position: fixed;
  z-index: 110;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(28, 27, 25, 0.42);
  backdrop-filter: blur(2px);
}

.detail-sheet {
  width: 100%;
  max-width: 520px;
  max-height: 90dvh;
  overflow: auto;
  padding: 8px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  border-radius: 24px 24px 0 0;
  background: #ffffff;
  box-shadow: 0 -8px 40px rgba(28, 27, 25, 0.16);
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-head h2 {
  font-size: 20px;
  color: #1c1b19;
}

.detail-head button {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: #57534c;
  font-size: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-merchant {
  margin: 20px 0 4px;
  color: #57534c;
  font-size: 14px;
}

.detail-amount {
  margin: 0 0 24px;
  font-size: 36px;
  line-height: 40px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: #1c1b19;
}

.detail-list {
  margin: 0 0 24px;
  border-top: 1px solid #e4e0d7;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #efece5;
  font-size: 14px;
}

.detail-list dt {
  color: #57534c;
}

.detail-list dd {
  margin: 0;
  max-width: 65%;
  text-align: right;
  font-weight: 500;
  color: #1c1b19;
  overflow-wrap: anywhere;
}

.detail-primary {
  width: 100%;
}

.detail-delete {
  display: block;
  min-height: 44px;
  margin: 4px auto 0;
  border: 0;
  background: transparent;
  color: #a3421a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

@media (min-width: 861px) {
  .filter-chips {
    flex-wrap: wrap;
    overflow: visible;
  }

  .detail-layer {
    align-items: center;
  }
  .detail-sheet {
    border-radius: 20px;
    padding: 24px 28px 28px;
  }
}
</style>
