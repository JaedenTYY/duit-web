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
  <article class="rounded-3xl border border-slate-200 bg-white p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 class="text-base font-black text-slate-900">
          {{ participant.displayName }}
        </h3>
        <p class="mt-1 text-sm font-semibold text-slate-500">
          {{ participant.selectedItems.length }} selected item{{ participant.selectedItems.length === 1 ? '' : 's' }}
        </p>
      </div>
      <span
        class="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
        :class="participant.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
      >
        {{ participant.isPaid ? 'Paid' : 'Unpaid' }}
      </span>
    </div>

    <div class="mt-4 space-y-2">
      <div
        v-for="item in participant.selectedItems"
        :key="item.itemId"
        class="flex justify-between gap-3 text-sm"
      >
        <span class="truncate font-semibold text-slate-600">{{ item.itemName }}</span>
        <span class="font-bold text-slate-900">{{ formatCurrency(item.allocatedAmount, currency) }}</span>
      </div>
    </div>

    <div class="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Amount owed
        </p>
        <p class="mt-1 text-xl font-black text-slate-900">
          {{ formatCurrency(participant.totalOwed, currency) }}
        </p>
      </div>
      <button
        type="button"
        :disabled="saving"
        class="rounded-2xl px-4 py-3 text-sm font-black transition active:scale-[0.98] disabled:opacity-40"
        :class="participant.isPaid ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'"
        @click="emit('toggle-paid', participant.id, !participant.isPaid)"
      >
        {{ participant.isPaid ? 'Mark unpaid' : 'Mark paid' }}
      </button>
    </div>
  </article>
</template>
