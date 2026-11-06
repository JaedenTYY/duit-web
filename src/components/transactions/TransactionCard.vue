<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{ transaction: Transaction; deleting?: boolean }>()
const emit = defineEmits<{ (e: 'open', transaction: Transaction): void }>()
const formattedDate = computed(() => new Date(props.transaction.occurredAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', timeZone: 'Asia/Kuala_Lumpur' }))
const merchant = computed(() => props.transaction.merchantName || props.transaction.description || 'Transaction')
const initials = computed(() => merchant.value.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase())
</script>

<template>
  <button type="button" class="transaction-record" :disabled="deleting" :aria-label="`View ${merchant} transaction`" @click="emit('open', transaction)">
    <span class="transaction-avatar" aria-hidden="true">{{ initials }}</span>
    <span class="transaction-info"><strong>{{ merchant }}</strong><small>{{ transaction.categoryName || 'Uncategorised' }} · <time :datetime="transaction.occurredAt">{{ formattedDate }}</time></small></span>
    <span class="transaction-amount">{{ formatCurrency(transaction.amount, transaction.currency) }}</span>
  </button>
</template>

<style scoped>
.transaction-record { display:flex; align-items:center; gap:12px; width:100%; min-height:68px; padding:10px 0; border:0; border-bottom:1px solid var(--rule); background:transparent; color:var(--ink); text-align:left; }
.transaction-record:hover { background:rgb(255 255 255 / 45%); }
.transaction-avatar { display:grid; place-items:center; width:42px; height:42px; flex:none; border-radius:11px; background:#EFECE5; color:var(--accent); font-size:12px; font-weight:600; }
.transaction-info { display:flex; flex:1; flex-direction:column; gap:3px; min-width:0; }
.transaction-info strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:600; }
.transaction-info small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--muted); font-size:12px; }
.transaction-amount { white-space:nowrap; font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; }
</style>
