<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import BillUploadCard from '@/components/bill/BillUploadCard.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'
import FeatureActionCard from '@/components/shared/FeatureActionCard.vue'
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
  <div class="mx-auto max-w-5xl space-y-6 pb-28">
    <PageHeader
      eyebrow="Split bill"
      title="Split the bill without the awkward math"
      description="Scan a receipt, share a guest link, and let everyone claim their items without creating an account."
    >
      <template #actions>
        <RouterLink
          to="/inbox"
          class="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Scan receipt first
        </RouterLink>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FeatureActionCard
        title="Upload bill"
        description="Use the receipt to create item choices for your group."
        status="Step 1"
        icon="receipt"
        tone="amber"
        action-label="Upload below"
      />
      <FeatureActionCard
        title="Share link"
        description="Guests can claim items without installing anything."
        status="Step 2"
        icon="link"
        tone="sky"
        action-label="After upload"
      />
      <FeatureActionCard
        title="Settle fairly"
        description="Show your own payment details; Duit does not process payments."
        status="Step 3"
        icon="check"
        tone="mint"
        action-label="Stay compliant"
      />
    </section>

    <section class="grid grid-cols-1 gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div class="rounded-[2rem] border border-amber-100 bg-amber-50 p-6">
        <p class="text-xs font-black uppercase text-amber-700">
          Important
        </p>
        <h2 class="mt-2 text-2xl font-black text-slate-950">
          Guest-friendly, not payment processing.
        </h2>
        <p class="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Duit displays payment details you provide, but it does not generate payment payloads or process payments.
        </p>
      </div>

      <div class="space-y-4">
        <ErrorBanner :message="error" />
        <BillUploadCard
          :uploading="uploading"
          @upload="uploadReceipt"
        />
      </div>
    </section>
  </div>
</template>
