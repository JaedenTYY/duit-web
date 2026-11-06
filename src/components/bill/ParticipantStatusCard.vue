<script setup lang="ts">
import type { BillParticipant } from '@/types'
import { formatCurrency } from '@/utils/currency'

defineProps<{
  participant: BillParticipant
  currency: string
  saving?: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle-paid', participantId: string, isPaid: boolean): void
}>()
</script>

<template><article class="participant-row"><span class="participant-avatar" aria-hidden="true">{{ participant.displayName.charAt(0).toUpperCase() }}</span><div class="participant-body"><h3>{{ participant.displayName }}</h3><p>{{ participant.selectedItems.length }} item{{ participant.selectedItems.length === 1 ? '' : 's' }} · {{ participant.isPaid ? 'Paid' : 'Waiting for payment' }}</p><details v-if="participant.selectedItems.length"><summary>View items</summary><div v-for="item in participant.selectedItems" :key="item.itemId" class="participant-item"><span>{{ item.itemName }}</span><span>{{ formatCurrency(item.allocatedAmount, currency) }}</span></div></details><p v-if="participant.lineAdjustmentShare !== '0.0000' || participant.totalAdjustmentShare !== '0.0000'" class="participant-note">Receipt adjustment included in share.</p></div><div class="participant-end"><strong>{{ formatCurrency(participant.totalOwed, currency) }}</strong><button type="button" :disabled="saving" @click="emit('toggle-paid', participant.id, !participant.isPaid)">{{ participant.isPaid ? 'Mark unpaid' : 'Mark paid' }}</button></div></article></template><style scoped>.participant-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--rule)}.participant-avatar{display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:10px;background:var(--accent-tint);color:var(--accent);font-size:14px;font-weight:600}.participant-body{flex:1;min-width:0}.participant-body h3{margin:1px 0 3px;font-size:14px;font-weight:600}.participant-body p{margin:0;color:var(--muted);font-size:12px}.participant-body details{margin-top:8px;color:var(--accent);font-size:12px}.participant-body summary{cursor:pointer}.participant-item{display:flex;justify-content:space-between;gap:10px;margin-top:5px;color:var(--muted)}.participant-note{margin-top:8px!important}.participant-end{text-align:right}.participant-end strong{display:block;white-space:nowrap;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}.participant-end button{min-height:34px;margin-top:4px;padding:0 8px;border:0;background:transparent;color:var(--accent);font-size:12px;font-weight:600}.participant-end button:disabled{opacity:.5}</style>