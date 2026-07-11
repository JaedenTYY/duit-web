<script setup lang="ts">
import { ref } from 'vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import QuestCard from '@/components/shared/QuestCard.vue'

const showUpload = ref(false)

function handleUploadSuccess() {
  showUpload.value = false
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <PageHeader
      eyebrow="Quest board"
      title="Earn XP from real money tasks"
      description="Pick one small mission. Duit keeps every import reviewable before it becomes a transaction."
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
      <QuestCard
        title="Receipt scan"
        description="Upload a receipt photo and let Google Vision plus Gemini draft the transaction."
        reward="+50 XP"
        icon="📸"
        tone="mint"
        action-label="Start scan"
        @click="showUpload = true"
      />
      <QuestCard
        title="Bill split"
        description="Turn one receipt into a guest-friendly bill claim flow for your group."
        reward="+40 XP"
        icon="🤝"
        tone="amber"
        to="/split-bill"
        action-label="Split"
      />
      <QuestCard
        title="Weekly coach"
        description="Review your seven-day spending signal and unlock one practical insight."
        reward="+60 XP"
        icon="🧠"
        tone="sky"
        to="/insights"
        action-label="Check"
      />
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p class="text-xs font-black uppercase text-amber-600">
        How rewards work today
      </p>
      <h2 class="mt-2 text-2xl font-black text-slate-950">
        Progress is visual first, backend rewards next.
      </h2>
      <p class="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
        This redesign makes the product feel rewarding immediately. The next backend step is storing XP events, streaks, and achievement unlocks so these missions become real account progress.
      </p>
    </section>

    <ReceiptUploadModal
      v-if="showUpload"
      @close="showUpload = false"
      @success="handleUploadSuccess"
    />
  </div>
</template>
