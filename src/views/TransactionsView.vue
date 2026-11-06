<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TransactionStaleConflictError, useTransactionStore } from '@/stores/transaction'
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
const visibleTransactions = computed(() => store.transactions.filter(tx =>
  (source.value === 'all' || tx.source === source.value)
  && (category.value === 'all' || tx.categoryName === category.value)
  && `${tx.merchantName || ''} ${tx.description || ''} ${tx.categoryName || ''}`.toLowerCase().includes(search.value.toLowerCase()),
))
const groupedTransactions = computed(() => {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of visibleTransactions.value) {
    const day = new Date(transaction.occurredAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
    groups.set(day, [...(groups.get(day) || []), transaction])
  }
  return [...groups].map(([day, items]) => ({
    day,
    items,
    total: items.every(item => item.currency === items[0]?.currency) ? formatCurrency(addDecimalStrings(items.map(item => item.amount)), items[0]!.currency) : null,
  }))
})
const isModalOpen = ref(false)
const showReceiptModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const listContainer = ref<HTMLElement | null>(null)
const deletingIds = ref<Set<string>>(new Set())
const selectedTransaction = ref<Transaction | null>(null)

onMounted(async () => {
  await store.fetchCategories()
  await store.fetchTransactions(true)
  if (route.query.add === '1') isModalOpen.value = true
})
watch(() => route.query.add, value => { if (value === '1') isModalOpen.value = true })

async function handleDelete(transaction: Transaction) {
  if (deletingIds.value.has(transaction.id)) return
  if (confirm('Delete this transaction?')) {
    deletingIds.value = new Set(deletingIds.value).add(transaction.id)
    try {
      await store.deleteTransaction(transaction.id, transaction.version)
    } catch (error) {
      if (error instanceof TransactionStaleConflictError) {
        alert('This transaction changed before it could be deleted. The latest version was loaded; review it and try again.')
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
    <PageHeader title="Activity" />
    <section class="activity-tools" aria-label="Find transactions">
      <label class="sr-only" for="ledger-search">Search loaded transactions</label>
      <input id="ledger-search" v-model="search" type="search" placeholder="Search activity" class="ledger-search">
      <div class="filter-chips" aria-label="Filter by category">
        <button type="button" :aria-pressed="category === 'all'" :class="{ selected: category === 'all' }" @click="category = 'all'">All</button>
        <button v-for="option in store.categories.slice(0, 8)" :key="option.id" type="button" :aria-pressed="category === option.name" :class="{ selected: category === option.name }" @click="category = option.name">{{ option.name }}</button>
      </div>
      <label class="activity-source">Source <select v-model="source"><option value="all">All sources</option><option value="manual">Manual</option><option value="receipt">Receipt</option><option value="statement">Statement</option><option value="gmail">Gmail</option></select></label>
      <p v-if="search || source !== 'all' || category !== 'all'" role="status" class="activity-count">{{ visibleTransactions.length }} matching loaded transactions. Load older activity to search further.</p>
    </section>
    <ErrorBanner :message="store.error" />
    <LoadingSkeleton v-if="store.loading && store.transactions.length === 0" :rows="6" variant="list" />
    <EmptyState v-else-if="!store.loading && store.transactions.length === 0" title="No activity yet" message="Add an expense or scan a receipt to start your spending history." action-label="Add expense" @action="editingTransaction = null; isModalOpen = true" />
    <div v-else ref="listContainer" class="activity-list">
      <section v-for="group in groupedTransactions" :key="group.day" class="activity-group"><div class="activity-group-head"><h2>{{ group.day }}</h2><span v-if="group.total">{{ group.total }}</span></div><div class="activity-group-rows"><TransactionCard v-for="tx in group.items" :key="tx.id" :transaction="tx" :deleting="deletingIds.has(tx.id)" @open="selectedTransaction = tx" /></div></section>
      <p v-if="visibleTransactions.length === 0" class="home-quiet activity-empty-filter">No transactions match this search.</p>
      <button v-if="store.hasMore" type="button" class="activity-more" :disabled="store.loading" @click="store.fetchTransactions()">{{ store.loading ? 'Loading…' : 'Load older activity' }}</button>
    </div>
    <div v-if="selectedTransaction" class="detail-layer" @click.self="selectedTransaction = null">
      <section class="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title">
        <div class="add-sheet-handle" />
        <div class="detail-head"><h2 id="transaction-detail-title">Transaction</h2><button type="button" aria-label="Close transaction detail" @click="selectedTransaction = null">×</button></div>
        <p class="detail-merchant">{{ selectedTransaction.merchantName || selectedTransaction.description || 'Transaction' }}</p>
        <p class="detail-amount">{{ formatCurrency(selectedTransaction.amount, selectedTransaction.currency) }}</p>
        <dl class="detail-list"><div><dt>Category</dt><dd>{{ selectedTransaction.categoryName || 'Uncategorised' }}</dd></div><div><dt>Date</dt><dd>{{ new Date(selectedTransaction.occurredAt).toLocaleDateString('en-MY', { dateStyle: 'long', timeZone: 'Asia/Kuala_Lumpur' }) }}</dd></div><div><dt>Added from</dt><dd>{{ selectedTransaction.source }}</dd></div><div v-if="selectedTransaction.description"><dt>Note</dt><dd>{{ selectedTransaction.description }}</dd></div></dl>
        <button type="button" class="primary-button detail-primary" @click="handleEdit(selectedTransaction)">Edit transaction</button>
        <button type="button" class="detail-delete" :disabled="deletingIds.has(selectedTransaction.id)" @click="handleDelete(selectedTransaction); selectedTransaction = null">Delete transaction</button>
      </section>
    </div>
    <AddTransactionModal v-if="isModalOpen" :transaction="editingTransaction" @close="closeTransactionModal" />
    <ReceiptUploadModal v-if="showReceiptModal" @close="handleReceiptClose" />
  </div>
</template>

<style scoped>
.activity-page { max-width:760px; padding-bottom:50px; }
.activity-tools { display:flex; flex-direction:column; gap:12px; margin:24px 0; }
.ledger-search { min-height:44px; border:0; background:#EFECE5; }
.filter-chips { flex-wrap:nowrap; overflow-x:auto; scrollbar-width:none; }
.filter-chips button { min-height:36px; flex:none; padding:0 14px; border-color:#D6D1C6; background:#fff; font-size:14px; }
.filter-chips button.selected { border-color:var(--accent); background:var(--accent-tint); color:var(--accent-deep); }
.activity-source { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:12px; }
.activity-source select { min-height:36px; padding:0 10px; border:1px solid var(--rule); border-radius:9px; background:#fff; color:var(--ink); }
.activity-count { color:var(--muted); font-size:12px; }
.activity-group { margin-top:20px; }
.activity-group-head { display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; font-size:13px; }
.activity-group-head h2 { margin:0; font-size:13px; font-weight:600; }
.activity-group-head span { color:var(--muted); font-variant-numeric:tabular-nums; }
.activity-group-rows { padding:0 16px; border-radius:16px; background:#fff; }
.activity-group-rows :deep(.transaction-record:last-child) { border-bottom:0; }
.activity-more { width:100%; min-height:52px; margin-top:24px; border:1px solid var(--rule); border-radius:12px; background:#fff; color:var(--accent); font-size:14px; font-weight:600; }
.activity-empty-filter { padding:24px 0; }
.detail-layer { position:fixed; z-index:110; inset:0; display:flex; align-items:flex-end; justify-content:center; background:rgb(28 27 25 / 42%); }
.detail-sheet { width:100%; max-width:520px; max-height:90dvh; overflow:auto; padding:8px 20px calc(24px + env(safe-area-inset-bottom)); border-radius:22px 22px 0 0; background:#fff; }
.detail-head { display:flex; align-items:center; justify-content:space-between; }
.detail-head h2 { font-size:20px; }
.detail-head button { width:44px; height:44px; border:0; background:transparent; color:var(--muted); font-size:26px; }
.detail-merchant { margin:28px 0 4px; color:var(--muted); font-size:14px; }
.detail-amount { margin:0 0 24px; font-size:36px; font-weight:600; letter-spacing:-.04em; font-variant-numeric:tabular-nums; }
.detail-list { margin:0 0 24px; border-top:1px solid var(--rule); }
.detail-list div { display:flex; justify-content:space-between; gap:16px; padding:15px 0; border-bottom:1px solid var(--rule); font-size:14px; }
.detail-list dt { color:var(--muted); }
.detail-list dd { margin:0; max-width:60%; text-align:right; overflow-wrap:anywhere; }
.detail-primary { width:100%; }
.detail-delete { display:block; min-height:44px; margin:8px auto 0; border:0; background:transparent; color:#A34437; font-size:13px; }
@media(min-width:861px) { .detail-layer { align-items:center; } .detail-sheet { border-radius:16px; padding:20px 28px 28px; } }
</style>
