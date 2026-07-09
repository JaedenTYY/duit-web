<script setup lang="ts">
import { ref } from 'vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'

const showUpload = ref(false)

const handleUploadSuccess = () => {
  showUpload.value = false
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <header class="flex flex-col gap-2">
      <h1 class="text-4xl font-bold text-slate-900 tracking-tight">
        Magic Inbox
      </h1>
      <p class="text-slate-400 text-lg font-medium">
        Choose how you want to import your spending data.
      </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

      <!-- Receipt Upload -->
      <button
        class="bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:border-blue-300 hover:shadow-blue-500/10 transition-all text-left flex flex-col items-start active:scale-95 group"
        @click="showUpload = true"
      >
        <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
          <svg
            class="w-8 h-8"
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
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2 tracking-tight">Receipt Upload</h3>
        <p class="text-slate-400 font-medium text-sm">Snap a photo or upload an image of a physical receipt to parse items automatically.</p>
      </button>

      <!-- Gmail eReceipts -->
      <RouterLink
        to="/gmail"
        class="bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:border-red-300 hover:shadow-red-500/10 transition-all text-left flex flex-col items-start active:scale-95 group"
      >
        <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          /></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2 tracking-tight">Gmail eReceipts</h3>
        <p class="text-slate-400 font-medium text-sm">Connect your Gmail account to securely scan and extract digital receipts and invoices.</p>
      </RouterLink>

      <!-- Bank Statement Import -->
      <RouterLink
        to="/statements"
        class="bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 hover:border-emerald-300 hover:shadow-emerald-500/10 transition-all text-left flex flex-col items-start active:scale-95 group"
      >
        <div class="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 3h7l5 5v13H7V3zm7 0v6h5M10 13h6m-6 4h6"
          /></svg>
        </div>
        <h3 class="text-xl font-bold text-slate-900 mb-2 tracking-tight">Bank Statement Import</h3>
        <p class="text-slate-400 font-medium text-sm">Upload a PDF bank statement to ingest bulk transactions securely in one go.</p>
      </RouterLink>

    </div>

    <!-- Upload Modal -->
    <ReceiptUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>
