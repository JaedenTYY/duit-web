<script setup lang="ts">
import type { BillItem } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  item: BillItem
  currency: string
}>()
</script>

<template>
  <article class="rounded-2xl border border-slate-200 bg-white p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-bold text-slate-900">
          {{ item.name }}
        </h3>
        <p class="mt-1 text-xs font-semibold text-slate-500">
          {{ item.quantity }} x {{ formatCurrency(item.unitPrice, currency) }}
        </p>
      </div>
      <p class="shrink-0 text-sm font-black text-slate-900">
        {{ formatCurrency(item.lineTotal, currency) }}
      </p>
    </div>
  </article>
</template>
