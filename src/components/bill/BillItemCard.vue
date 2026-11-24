<script setup lang="ts">
import type { BillItem } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  item: BillItem
  currency: string
}>()
</script>

<template><article class="bill-item"><div><h3>{{ item.name }}</h3><p>{{ item.quantity }} × {{ formatCurrency(item.unitPrice, currency) }}</p></div><strong>{{ formatCurrency(item.lineTotal, currency) }}</strong></article></template><style scoped>.bill-item{display:flex;justify-content:space-between;gap:12px;min-height:64px;padding:12px 0;border-bottom:1px solid var(--rule)}.bill-item h3{margin:0;font-size:14px;font-weight:600}.bill-item p{margin:4px 0 0;color:var(--muted);font-size:12px}.bill-item strong{white-space:nowrap;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}</style>