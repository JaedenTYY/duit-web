<script setup lang="ts">
import type { BillItem } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  item: BillItem
  currency: string
  selected: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
}>()
</script>

<template><button type="button" class="guest-item" :class="{ chosen: selected }" :disabled="disabled" :aria-pressed="selected" @click="emit('toggle', item.id)"><span class="guest-check" aria-hidden="true">{{ selected ? '✓' : '' }}</span><span class="guest-item-info"><strong>{{ item.name }}</strong><small>{{ item.quantity }} × {{ formatCurrency(item.unitPrice, currency) }}<span v-if="item.claimantCount > 0"> · Shared by {{ item.claimantCount }}</span></small></span><b>{{ formatCurrency(item.lineTotal, currency) }}</b></button></template>
<style scoped>
.guest-item { display:flex; align-items:center; gap:12px; width:100%; min-height:68px; padding:12px 0; border:0; border-bottom:1px solid var(--rule); background:transparent; color:var(--ink); text-align:left; }
.guest-item:disabled { opacity:.5; }
.guest-check { display:grid; place-items:center; width:22px; height:22px; flex:none; border:1.5px solid #AAA69D; border-radius:6px; color:#fff; font-size:14px; }
.guest-item.chosen .guest-check { border-color:var(--accent); background:var(--accent); }
.guest-item-info { display:flex; flex:1; flex-direction:column; min-width:0; gap:3px; }
.guest-item-info strong { font-size:14px; font-weight:600; }
.guest-item-info small { color:var(--muted); font-size:12px; }
.guest-item b { white-space:nowrap; font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
</style>
