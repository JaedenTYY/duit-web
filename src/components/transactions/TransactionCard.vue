<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'

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
</script>

<template>
  <div class="group relative flex items-center justify-between p-5 bg-white backdrop-blur-xl border border-slate-100 rounded-3xl hover:bg-slate-50 transition-all duration-300 ease-out active:scale-[0.99]">
    <div class="flex items-center gap-5 min-w-0">
      <!-- Icon with elegant glass container -->
      <div 
        class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner"
        :style="{ 
          backgroundColor: `${transaction.categoryColor}15` || '#1e293b',
          color: transaction.categoryColor || '#94a3b8'
        }"
      >
        {{ transaction.categoryIcon || '📦' }}
      </div>

      <!-- Details -->
      <div class="min-w-0">
        <h3 class="text-slate-900 font-bold text-base tracking-tight truncate pr-4">
          {{ transaction.description || transaction.categoryName || 'Transaction' }}
        </h3>
        <div class="flex items-center gap-2 mt-1 truncate">
          <span
            v-if="transaction.merchantName"
            class="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate"
          >{{ transaction.merchantName }}</span>
          <div
            v-if="transaction.merchantName"
            class="w-1 h-1 shrink-0 rounded-full bg-slate-200"
          />
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">{{ transaction.categoryName || 'General' }}</span>
          <div class="w-1 h-1 shrink-0 rounded-full bg-slate-200" />
          <span class="text-xs font-semibold text-slate-400 shrink-0">{{ formattedDate }}</span>
        </div>
      </div>
    </div>

    <!-- Amount & Trash -->
    <div class="flex items-center gap-5 shrink-0 pl-2">
      <div class="text-right">
        <p 
          class="font-extrabold text-lg tracking-tight tabular-nums"
          :class="isIncome ? 'text-blue-400' : 'text-slate-900'"
        >
          {{ isIncome ? '+' : '' }}{{ formatCurrency(transaction.amount, transaction.currency) }}
        </p>
      </div>

      <!-- Contextual Actions -->
      <button 
        class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-200 hover:text-slate-900 active:scale-90"
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
        class="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500 hover:text-slate-900 active:scale-90"
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
  </div>
</template>
