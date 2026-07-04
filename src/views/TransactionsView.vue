<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { useTransactionStore } from '@/stores/transaction'
import TransactionCard from '@/components/transactions/TransactionCard.vue'
import AddTransactionModal from '@/components/transactions/AddTransactionModal.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'

const store = useTransactionStore()
const isModalOpen = ref(false)
const showReceiptModal = ref(false)
const listContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
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

async function handleDelete(id: string) {
  if (confirm('Delete this transaction?')) {
    try {
      await store.deleteTransaction(id)
    } catch {
      // Error handled by store
    }
  }
}

async function handleReceiptClose() {
  showReceiptModal.value = false
  await store.fetchTransactions(true)
}
</script>

<template>
  <div class="relative min-h-[85vh] pb-32">
    <!-- Header -->
    <header class="mb-12">
      <h1 class="text-4xl font-bold text-slate-900 tracking-tight">
        Activity
      </h1>
      <p class="text-slate-400 font-medium mt-1">
        Keep track of your spending flow
      </p>
    </header>

    <!-- Error State -->
    <div
      v-if="store.error"
      class="mb-8 p-5 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] text-red-400 text-sm font-semibold flex items-center gap-3"
    >
      <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      {{ store.error }}
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="store.loading && store.transactions.length === 0"
      class="space-y-4"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="h-20 bg-white rounded-[1.5rem] border border-slate-100 animate-pulse"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!store.loading && store.transactions.length === 0"
      class="text-center py-32 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col items-center"
    >
      <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6">
        📝
      </div>
      <h3 class="text-xl font-bold text-slate-900 tracking-tight mb-2">
        No Transactions Yet
      </h3>
      <p class="text-slate-400 text-base font-medium mb-10 max-w-xs mx-auto">
        Your spending activity will appear here once you start tracking.
      </p>
      <button 
        class="bg-white text-slate-950 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-xl shadow-slate-200/50 shadow-white/5"
        @click="isModalOpen = true"
      >
        Track Transaction
      </button>
    </div>

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
    <div class="fixed bottom-32 right-8 flex flex-col gap-4 z-40">
      <button 
        class="w-14 h-14 rounded-full bg-slate-800/80 backdrop-blur-xl border border-slate-200 flex items-center justify-center text-blue-400 shadow-2xl shadow-slate-200/50 active:scale-90 transition-transform"
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
        class="w-16 h-16 rounded-full bg-blue-600 text-slate-900 shadow-[0_15px_35px_rgba(37,99,235,0.4)] flex items-center justify-center active:scale-90 transition-transform"
        @click="isModalOpen = true"
      >
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
      @close="isModalOpen = false"
    />
    <ReceiptUploadModal
      v-if="showReceiptModal"
      @close="handleReceiptClose"
    />
  </div>
</template>
