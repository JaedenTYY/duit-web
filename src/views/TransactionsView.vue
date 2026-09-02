<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { TransactionStaleConflictError, useTransactionStore } from '@/stores/transaction'
import TransactionCard from '@/components/transactions/TransactionCard.vue'
import AddTransactionModal from '@/components/transactions/AddTransactionModal.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import type { Transaction } from '@/types'

const store = useTransactionStore()
const isModalOpen = ref(false)
const showReceiptModal = ref(false)
const editingTransaction = ref<Transaction | null>(null)
const listContainer = ref<HTMLElement | null>(null)
const deletingIds = ref<Set<string>>(new Set())

onMounted(async () => {
  await store.fetchCategories()
  await store.fetchTransactions(true)
  animateList()
})

function animateList() {
  if (listContainer.value && store.transactions.length > 0) {
    const ctx = gsap.context(() => {
      gsap.from(listContainer.value?.children || [], {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all'
      })
    }, listContainer.value)
    return () => ctx.revert()
  }
}

watch(() => store.transactions.length, (newLen, oldLen) => {
  if (newLen > oldLen && oldLen > 0) {
    setTimeout(animateList, 50)
  }
})

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
  editingTransaction.value = transaction
  isModalOpen.value = true
}

function closeTransactionModal() {
  isModalOpen.value = false
  editingTransaction.value = null
}

async function handleReceiptClose() {
  showReceiptModal.value = false
  await store.fetchTransactions(true)
}
</script>

<template>
  <div class="relative min-h-[85vh] pb-32">
    <PageHeader
      class="mb-8"
      title="Transactions"
      description="Review manual entries, receipt captures, and imported statement rows in one clean spending feed."
    >
      <template #actions>
        <RouterLink
          to="/statements"
          class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          Import bank PDF
        </RouterLink>
      </template>
    </PageHeader>

    <div class="mb-6 grid grid-cols-2 gap-3 md:hidden">
      <button
        type="button"
        aria-label="Add transaction"
        class="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-sm"
        @click="editingTransaction = null; isModalOpen = true"
      >
        New
      </button>
      <button
        type="button"
        aria-label="Scan receipt"
        class="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
        @click="showReceiptModal = true"
      >
        Receipt
      </button>
    </div>

    <ErrorBanner
      class="mb-6"
      :message="store.error"
    />

    <LoadingSkeleton
      v-if="store.loading && store.transactions.length === 0"
      :rows="6"
      variant="list"
    />

    <EmptyState
      v-else-if="!store.loading && store.transactions.length === 0"
      title="No transactions yet"
      message="Add one manually or import from the Magic Inbox to start building your spending history."
      action-label="Add Transaction"
      tone="blue"
      @action="editingTransaction = null; isModalOpen = true"
    />

    <!-- Activity Stream -->
    <div
      v-else
      ref="listContainer"
      class="space-y-4"
    >
      <TransactionCard 
        v-for="tx in store.transactions" 
        :key="tx.id" 
        :transaction="tx"
        :deleting="deletingIds.has(tx.id)"
        @edit="handleEdit"
        @delete="handleDelete"
      />

      <!-- Load More -->
      <div
        v-if="store.hasMore"
        class="pt-10 text-center"
      >
        <button 
          class="px-12 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white hover:text-slate-950 transition-all disabled:opacity-30"
          :disabled="store.loading"
          @click="store.fetchTransactions()"
        >
          {{ store.loading ? 'Syncing...' : 'Load Older Data' }}
        </button>
      </div>
    </div>

    <!-- Floating Action Stack -->
    <div class="fixed bottom-8 right-8 z-40 hidden flex-col gap-3 md:flex">
      <button 
        class="w-12 h-12 rounded-full bg-white backdrop-blur-xl border border-slate-200 flex items-center justify-center text-amber-600 shadow-xl shadow-slate-200/70 active:scale-90 transition-transform sm:h-14 sm:w-14"
        aria-label="Upload receipt"
        @click="showReceiptModal = true"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        /><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        /></svg>
      </button>
      
      <button 
        class="w-14 h-14 rounded-full bg-emerald-500 text-white shadow-[0_15px_35px_rgba(16,185,129,0.28)] flex items-center justify-center active:scale-90 transition-transform sm:h-16 sm:w-16"
        aria-label="Add transaction"
        @click="editingTransaction = null; isModalOpen = true"
      >
        <span class="sr-only">Add Transaction</span>
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        /></svg>
      </button>
    </div>

    <!-- Modals -->
    <AddTransactionModal
      v-if="isModalOpen"
      :transaction="editingTransaction"
      @close="closeTransactionModal"
    />
    <ReceiptUploadModal
      v-if="showReceiptModal"
      @close="handleReceiptClose"
    />
  </div>
</template>
