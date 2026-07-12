<script setup lang="ts">
import { ref } from 'vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import FeatureActionCard from '@/components/shared/FeatureActionCard.vue'

const showUpload = ref(false)

function handleUploadSuccess() {
  showUpload.value = false
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <PageHeader
      eyebrow="Import center"
      title="Choose how to add spending"
      description="All import options are visible here. Duit keeps every import reviewable before it becomes a transaction."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
          @click="showUpload = true"
        >
          Scan receipt
        </button>
      </template>
    </PageHeader>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <FeatureActionCard
        title="Scan receipt"
        description="Upload a receipt photo and let Google Vision plus Gemini draft the transaction."
        status="Image upload"
        icon="camera"
        tone="mint"
        action-label="Start scan"
        @click="showUpload = true"
      />
      <FeatureActionCard
        title="Split bill"
        description="Turn one receipt into a guest-friendly bill claim flow for your group."
        status="Shared expense"
        icon="users"
        tone="amber"
        to="/split-bill"
        action-label="Split"
      />
      <FeatureActionCard
        title="Weekly insights"
        description="Review your seven-day spending signal and unlock one practical insight."
        status="Review"
        icon="insights"
        tone="sky"
        to="/insights"
        action-label="Check"
      />
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-xs font-black uppercase text-amber-600">
        Why this screen exists
      </p>
      <h2 class="mt-2 text-2xl font-black text-slate-950">
        Import methods should be visible, predictable, and reversible.
      </h2>
      <p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
        HCI principle: users should not need to remember where features are. Receipt uploads, Gmail receipts, bank statements, bill splitting, and insight review are grouped by task.
      </p>
    </section>

    <ReceiptUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>
