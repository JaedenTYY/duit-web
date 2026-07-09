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
  <aside class="sticky bottom-4 z-30 mx-4 rounded-3xl border border-white/20 bg-slate-900/95 px-5 py-4 shadow-2xl shadow-blue-900/20 backdrop-blur-xl sm:mx-0 sm:bottom-0 sm:rounded-b-none sm:rounded-t-3xl text-white">
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between text-xs font-semibold text-slate-300 sm:justify-start sm:gap-6">
        <div class="flex flex-col">
          <span class="text-slate-400">Items</span>
          <span class="text-white text-sm">{{ formatCurrency(subtotal, currency) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-slate-400">Tax</span>
          <span class="text-white text-sm">{{ formatCurrency(tax, currency) }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-slate-400">Service</span>
          <span class="text-white text-sm">{{ formatCurrency(service, currency) }}</span>
        </div>
        <div class="flex flex-col items-end sm:hidden">
          <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Total owed</span>
          <span class="text-lg font-black text-white">{{ formatCurrency(total, currency) }}</span>
        </div>
      </div>
      
      <div class="flex items-center justify-between gap-4 border-t border-white/10 pt-3 sm:border-none sm:pt-0">
        <div class="hidden flex-col items-start sm:flex">
          <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">Total owed</span>
          <span class="text-2xl font-black text-white">{{ formatCurrency(total, currency) }}</span>
        </div>
        
        <p class="text-xs text-slate-400 font-medium sm:max-w-xs">
          Duit calculates your share but does not process payments.
        </p>
        
        <button
          v-if="actionLabel"
          type="button"
          :disabled="disabled || loading"
          class="shrink-0 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          @click="emit('submit')"
        >
          {{ loading ? 'Saving...' : actionLabel }}
        </button>
      </div>
    </div>
  </aside>
</template>
