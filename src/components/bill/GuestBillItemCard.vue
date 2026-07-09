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
    class="flex min-h-24 w-full items-center justify-between gap-4 rounded-3xl border-2 p-4 text-left transition-all duration-300 active:scale-95"
    :class="selected ? 'border-transparent bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30' : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 hover:shadow-md'"
    @click="emit('toggle', item.id)"
  >
    <span class="min-w-0">
      <span class="block truncate text-base font-bold transition-colors" :class="selected ? 'text-white' : 'text-slate-900'">{{ item.name }}</span>
      <span class="mt-1 block text-sm font-semibold transition-colors" :class="selected ? 'text-blue-100' : 'text-slate-500'">
        {{ item.quantity }} x {{ formatCurrency(item.unitPrice, currency) }}
      </span>
    </span>
    <span class="flex shrink-0 items-center gap-3">
      <span class="text-lg font-black transition-colors" :class="selected ? 'text-white' : 'text-slate-900'">{{ formatCurrency(item.lineTotal, currency) }}</span>
      <span
        class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
        :class="selected ? 'bg-white text-blue-600 shadow-sm scale-110' : 'border-2 border-slate-200 bg-slate-50 text-slate-300 scale-100'"
      >
        <svg v-if="selected" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
      </span>
    </span>
  </button>
</template>
