<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'
import AppIcon from '@/components/shared/AppIcon.vue'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  (e: 'edit', transaction: Transaction): void
  (e: 'delete', id: string): void
}>()

const isIncome = computed(() => {
  const catName = props.transaction.categoryName || ''
  return catName.includes('Salary') || catName.includes('Investment')
})

const formattedDate = computed(() => {
  return new Date(props.transaction.occurredAt).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
  })
})

const sourceLabel = computed(() => {
  switch (props.transaction.source) {
    case 'receipt': return 'Receipt'
    case 'import': return 'Import'
    default: return 'Manual'
  }
})
</script>

<template>
  <article class="group relative rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/70 active:scale-[0.99] sm:p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl p-3 shadow-inner sm:h-14 sm:w-14 sm:p-3.5"
          :style="{
            backgroundColor: transaction.categoryColor ? `${transaction.categoryColor}18` : '#f1f5f9',
            color: transaction.categoryColor || '#94a3b8'
          }"
        >
          <AppIcon name="card" />
        </div>

        <div class="min-w-0">
          <h3 class="truncate pr-1 text-base font-black tracking-tight text-slate-950">
            {{ transaction.merchantName || transaction.description || 'Transaction' }}
          </h3>
          <p class="mt-1 truncate text-sm font-medium text-slate-500">
            {{ transaction.description || transaction.categoryName || 'Spending activity' }}
          </p>
          <div class="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <span class="max-w-[9rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {{ transaction.categoryName || 'General' }}
            </span>
            <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              {{ sourceLabel }}
            </span>
            <span class="shrink-0 text-xs font-bold text-slate-400">
              {{ formattedDate }}
            </span>
          </div>
        </div>
      </div>

      <div class="shrink-0 text-right">
        <p 
          class="whitespace-nowrap text-base font-black tracking-tight tabular-nums sm:text-lg"
          :class="isIncome ? 'text-blue-400' : 'text-slate-900'"
        >
          {{ isIncome ? '+' : '' }}{{ formatCurrency(transaction.amount, transaction.currency) }}
        </p>
      </div>
    </div>

    <div class="mt-4 flex justify-end gap-2 sm:absolute sm:right-4 sm:top-1/2 sm:mt-0 sm:-translate-y-1/2 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100">
      <button 
        class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 active:scale-90"
        aria-label="Edit transaction"
        @click.stop="emit('edit', transaction)"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        /></svg>
      </button>
      <button 
        class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-600 hover:text-white active:scale-90"
        aria-label="Delete transaction"
        @click.stop="emit('delete', transaction.id)"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        /></svg>
      </button>
    </div>
  </article>
</template>
