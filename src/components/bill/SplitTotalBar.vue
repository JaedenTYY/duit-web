<script setup lang="ts">
import { formatCurrency } from '@/utils/currency'

defineProps<{
  currency: string
  subtotal: string
  tax: string
  service: string
  total: string
  disabled?: boolean
  loading?: boolean
  actionLabel?: string
}>()

const emit = defineEmits<{
  (event: 'submit'): void
}>()
</script>

<template>
  <aside class="sticky bottom-3 z-30 rounded-[1.75rem] border border-white/20 bg-slate-950/95 px-4 py-4 text-white shadow-2xl shadow-blue-900/20 backdrop-blur-xl sm:bottom-4 sm:px-5">
    <div class="flex flex-col gap-3">
      <div class="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300 sm:grid-cols-4">
        <div class="flex flex-col">
          <span class="text-slate-400">Items</span>
          <span class="text-sm text-white">{{ formatCurrency(subtotal, currency) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-slate-400">Tax</span>
          <span class="text-sm text-white">{{ formatCurrency(tax, currency) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-slate-400">Service</span>
          <span class="text-sm text-white">{{ formatCurrency(service, currency) }}</span>
        </div>
        <div class="flex flex-col items-end">
          <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Total owed</span>
          <span class="text-lg font-black text-white">{{ formatCurrency(total, currency) }}</span>
        </div>
      </div>
      
      <div class="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs font-medium leading-5 text-slate-400 sm:max-w-xs">
          Duit calculates your share but does not process payment.
        </p>
        
        <button
          v-if="actionLabel"
          type="button"
          :disabled="disabled || loading"
          class="min-h-11 w-full shrink-0 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          @click="emit('submit')"
        >
          {{ loading ? 'Saving...' : actionLabel }}
        </button>
      </div>
    </div>
  </aside>
</template>
