<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useInboxStore } from '@/stores/inbox'
import { formatCurrency } from '@/utils/currency'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import type { ReceiptExtractionResponse } from '@/types'

const inboxStore = useInboxStore()
const { pendingReceipts, loading } = storeToRefs(inboxStore)

const showUpload = ref(false)

onMounted(() => {
  inboxStore.fetchPendingReceipts()
})

const handleTag = async (receipt: ReceiptExtractionResponse, type: 'personal' | 'business') => {
  const data = {
    amount: receipt.extractedData.total,
    currency: receipt.extractedData.currency,
    merchantName: receipt.extractedData.merchant,
    occurredAt: receipt.extractedData.date ? new Date(receipt.extractedData.date).toISOString() : new Date().toISOString(),
    description: `Parsed via Magic Inbox`
  }
  
  await inboxStore.confirmReceipt(
    receipt.extractionId, 
    data, 
    type === 'business', 
    type === 'business' ? 'Business Expense' : null
  )
}

const handleUploadSuccess = () => {
  showUpload.value = false
  inboxStore.fetchPendingReceipts()
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
          Magic Inbox
        </h1>
        <p class="text-slate-400 mt-1">
          Dump your receipts here. We'll sort out the tax tags.
        </p>
      </div>
      <button 
        class="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
        @click="showUpload = true"
      >
        <svg
          class="w-5 h-5"
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
        New Scan
      </button>
    </header>

    <div
      v-if="loading"
      class="text-center py-20 text-slate-400 font-medium"
    >
      Fetching inbox...
    </div>

    <!-- Pending List -->
    <div
      v-else-if="pendingReceipts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div 
        v-for="receipt in pendingReceipts" 
        :key="receipt.extractionId"
        class="bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50"
      >
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="text-xl font-bold text-slate-900">
              {{ receipt.extractedData.merchant || 'Unknown Merchant' }}
            </h3>
            <p class="text-slate-400 text-sm mt-1">
              {{ receipt.extractedData.date ? new Date(receipt.extractedData.date).toLocaleDateString() : 'Unknown Date' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-slate-900 tracking-tight">
              {{ formatCurrency(receipt.extractedData.total.toString(), receipt.extractedData.currency) }}
            </p>
            <span class="inline-block mt-1 px-2 py-1 bg-white/10 text-slate-600 text-xs rounded-lg font-mono">
              OCR {{ receipt.confidence }}
            </span>
          </div>
        </div>

        <div class="bg-slate-950/50 rounded-xl p-4 mb-6">
          <p class="text-slate-400 text-sm uppercase tracking-widest font-bold mb-3">
            Extracted Items
          </p>
          <ul class="space-y-2 max-h-32 overflow-y-auto">
            <li
              v-for="(item, idx) in receipt.extractedData.lineItems.slice(0, 3)"
              :key="idx"
              class="flex justify-between text-sm text-slate-600"
            >
              <span class="truncate pr-4">{{ item.description }}</span>
              <span class="font-mono">{{ item.lineTotal.toFixed(2) }}</span>
            </li>
            <li
              v-if="receipt.extractedData.lineItems.length > 3"
              class="text-xs text-slate-400 italic mt-2"
            >
              + {{ receipt.extractedData.lineItems.length - 3 }} more items
            </li>
          </ul>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button 
            class="bg-slate-100 hover:bg-slate-200 text-slate-900 py-2.5 rounded-xl font-bold transition-colors text-sm flex items-center justify-center gap-2"
            @click="handleTag(receipt, 'personal')"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            /></svg>
            Personal
          </button>
          <button 
            class="bg-indigo-600 hover:bg-indigo-500 text-slate-900 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 text-sm flex items-center justify-center gap-2"
            @click="handleTag(receipt, 'business')"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            /></svg>
            Business
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-16 px-4 text-center bg-white backdrop-blur-xl border border-slate-100 rounded-3xl border-dashed"
    >
      <div class="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400">
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        /></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-2">
        Inbox Zero
      </h3>
      <p class="text-slate-400 max-w-sm mb-6 text-sm">
        You're all caught up! Snap a photo of your latest lunch receipt to keep your taxes in check.
      </p>
      <button 
        class="md:hidden bg-blue-600 text-slate-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform text-sm"
        @click="showUpload = true"
      >
        Tap to Scan Receipt
      </button>
    </div>

    <!-- Upload Modal -->
    <ReceiptUploadModal 
      v-if="showUpload"
      @close="showUpload = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>
