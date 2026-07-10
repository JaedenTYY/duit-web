<script setup lang="ts">
import { ref } from 'vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import ActionTile from '@/components/shared/ActionTile.vue'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const showUpload = ref(false)

const handleUploadSuccess = () => {
  showUpload.value = false
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <PageHeader
      title="Magic Inbox"
      description="Import receipts, statements, and eReceipts in one place. Duit keeps every import reviewable before it becomes a transaction."
    />

    <section class="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 sm:p-7">
      <div class="flex items-start gap-4">
        <FriendlyAvatar
          tone="blue"
          size="sm"
        />
        <div>
          <h2 class="text-xl font-black tracking-tight text-slate-950">
            Pick the fastest capture path
          </h2>
          <p class="mt-2 text-sm font-medium leading-6 text-slate-600">
            Use receipt photos for item-level detail, PDFs for bulk history, and Gmail for digital purchases.
          </p>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <ActionTile
        title="Receipt Upload"
        description="Snap a photo or upload an image to parse receipt totals and categories."
        tone="blue"
        action-label="Start scan"
        @click="showUpload = true"
      >
        <template #icon>
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
        </template>
      </ActionTile>

      <ActionTile
        title="Gmail eReceipts"
        description="Connect read-only Gmail access and confirm each eReceipt before import."
        to="/gmail"
        tone="rose"
        action-label="Connect Gmail"
      >
        <template #icon>
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
        </template>
      </ActionTile>

      <ActionTile
        title="Bank Statement Import"
        description="Upload a PDF statement and select the rows you want to keep."
        to="/statements"
        tone="emerald"
        action-label="Import PDF"
      >
        <template #icon>
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
        </template>
      </ActionTile>

    </div>

    <!-- Upload Modal -->
    <ReceiptUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>
