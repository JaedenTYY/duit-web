<script setup lang="ts">
import type { BillParticipant } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  participant: BillParticipant
  currency: string
  saving?: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle-paid', participantId: string, isPaid: boolean): void
}>()
</script>

<template>
  <article class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-lg font-black text-slate-900">
          {{ participant.displayName }}
        </h3>
        <p class="mt-1 text-sm font-semibold text-slate-500">
          {{ participant.selectedItems.length }} selected item{{ participant.selectedItems.length === 1 ? '' : 's' }}
        </p>
      </div>
      <span
        class="rounded-2xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm"
        :class="participant.isPaid ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white' : 'bg-slate-100 text-slate-600'"
      >
        {{ participant.isPaid ? 'Paid' : 'Unpaid' }}
      </span>
    </div>

    <div class="mt-5 space-y-3">
      <div
        v-for="item in participant.selectedItems"
        :key="item.itemId"
        class="flex justify-between gap-3 text-sm"
      >
        <span class="truncate font-semibold text-slate-500">{{ item.itemName }}</span>
        <span class="font-bold text-slate-900">{{ formatCurrency(item.allocatedAmount, currency) }}</span>
      </div>
    </div>

    <div class="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
      <div>
        <p class="text-[10px] font-black uppercase tracking-widest text-blue-400">
          Amount owed
        </p>
        <p class="mt-1 text-2xl font-black text-slate-900">
          {{ formatCurrency(participant.totalOwed, currency) }}
        </p>
      </div>
      <button
        type="button"
        :disabled="saving"
        class="rounded-2xl px-5 py-3 text-sm font-black transition-all active:scale-95 disabled:opacity-40"
        :class="participant.isPaid ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-blue-500'"
        @click="emit('toggle-paid', participant.id, !participant.isPaid)"
      >
        {{ participant.isPaid ? 'Mark unpaid' : 'Mark paid' }}
      </button>
    </div>
  </article>
</template>
