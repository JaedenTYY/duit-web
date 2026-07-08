<script setup lang="ts">
import type { BillItem } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  item: BillItem
  currency: string
  selected: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
}>()
</script>

<template>
  <button
    type="button"
    class="flex min-h-24 w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99]"
    :class="selected ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10' : 'border-slate-200 bg-white hover:bg-slate-50'"
    @click="emit('toggle', item.id)"
  >
    <span class="min-w-0">
      <span class="block truncate text-base font-bold text-slate-900">{{ item.name }}</span>
      <span class="mt-1 block text-sm font-semibold text-slate-500">
        {{ item.quantity }} x {{ formatCurrency(item.unitPrice, currency) }}
      </span>
    </span>
    <span class="flex shrink-0 items-center gap-3">
      <span class="text-base font-black text-slate-900">{{ formatCurrency(item.lineTotal, currency) }}</span>
      <span
        class="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-black"
        :class="selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-300'"
      >
        ✓
      </span>
    </span>
  </button>
</template>
