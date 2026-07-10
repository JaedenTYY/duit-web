<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import BillUploadCard from '@/components/bill/BillUploadCard.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

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
    <PageHeader
      title="Split bill"
      description="Scan a receipt, share a guest link, and track who picked which items without asking guests to create an account."
    />

    <section class="rounded-[2rem] border border-amber-100 bg-amber-50 p-5 sm:p-7">
      <div class="flex items-start gap-4">
        <FriendlyAvatar
          tone="amber"
          size="sm"
        />
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-950">
            Guest-friendly by design
          </h2>
          <p class="mt-2 text-sm font-medium leading-6 text-slate-600">
            Duit displays payment details you provide, but it does not generate payment payloads or process payments.
          </p>
        </div>
      </div>
    </section>

    <ErrorBanner :message="error" />
    <BillUploadCard
      :uploading="uploading"
      @upload="uploadReceipt"
    />
  </div>
</template>
