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
  <aside class="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:mx-0 sm:rounded-3xl sm:border">
    <div class="grid grid-cols-3 gap-2 text-xs font-bold text-slate-500">
      <div>
        <p>Items</p>
        <p class="mt-1 text-sm text-slate-900">{{ formatCurrency(subtotal, currency) }}</p>
      </div>
      <div>
        <p>Tax</p>
        <p class="mt-1 text-sm text-slate-900">{{ formatCurrency(tax, currency) }}</p>
      </div>
      <div>
        <p>Service</p>
        <p class="mt-1 text-sm text-slate-900">{{ formatCurrency(service, currency) }}</p>
      </div>
    </div>
    <div class="mt-4 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">
          Total owed
        </p>
        <p class="text-2xl font-black text-slate-900">
          {{ formatCurrency(total, currency) }}
        </p>
      </div>
      <button
        v-if="actionLabel"
        type="button"
        :disabled="disabled || loading"
        class="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        @click="emit('submit')"
      >
        {{ loading ? 'Saving...' : actionLabel }}
      </button>
    </div>
  </aside>
</template>
