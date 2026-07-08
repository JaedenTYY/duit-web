<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import BillUploadCard from '@/components/bill/BillUploadCard.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'

const router = useRouter()
const billStore = useBillStore()
const { uploading, error } = storeToRefs(billStore)

async function uploadReceipt(file: File) {
  try {
    const bill = await billStore.createFromReceipt(file)
    router.push({ name: 'owner-bill-split', params: { id: bill.id } })
  } catch {
    // Store renders the API error.
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8 pb-28">
    <header>
      <h1 class="text-3xl font-black tracking-tight text-slate-900">
        Split bill
      </h1>
      <p class="mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Scan a receipt, share a QR link, and track who picked which items.
      </p>
    </header>

    <ErrorBanner :message="error" />
    <BillUploadCard
      :uploading="uploading"
      @upload="uploadReceipt"
    />
  </div>
</template>
