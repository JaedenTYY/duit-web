<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
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
  <div class="group relative flex items-center justify-between p-5 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl hover:bg-white/5 transition-all duration-300 ease-out active:scale-[0.99]">
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
        <h3 class="text-white font-bold text-base tracking-tight truncate pr-4">
          {{ transaction.description || transaction.categoryName || 'Transaction' }}
        </h3>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ transaction.categoryName || 'General' }}</span>
          <div class="w-1 h-1 rounded-full bg-slate-700"></div>
          <span class="text-xs font-semibold text-slate-500">{{ formattedDate }}</span>
        </div>
      </div>
    </div>

    <!-- Amount & Trash -->
    <div class="flex items-center gap-5 shrink-0 pl-2">
      <div class="text-right">
        <p 
          class="font-extrabold text-lg tracking-tight tabular-nums"
          :class="isIncome ? 'text-blue-400' : 'text-white'"
        >
          {{ isIncome ? '+' : '' }}{{ formatCurrency(transaction.amount, transaction.currency) }}
        </p>
      </div>

      <!-- Contextual Delete -->
      <button 
        class="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500 hover:text-white active:scale-90"
        @click.stop="emit('delete', transaction.id)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  </div>
</template>
