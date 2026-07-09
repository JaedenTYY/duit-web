<script setup lang="ts">
import type { BillItem } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  item: BillItem
  currency: string
}>()
</script>

<template>
  <article class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-bold text-slate-900">
          {{ item.name }}
        </h3>
        <p class="mt-1 text-sm font-semibold text-slate-500">
          {{ item.quantity }} <span class="mx-1 text-slate-300">×</span> {{ formatCurrency(item.unitPrice, currency) }}
        </p>
      </div>
      <p class="shrink-0 text-lg font-black text-slate-900">
        {{ formatCurrency(item.lineTotal, currency) }}
      </p>
    </div>
  </article>
</template>
