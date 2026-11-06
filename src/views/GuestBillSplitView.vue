<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import { formatCurrency } from '@/utils/currency'
import EmptyState from '@/components/bill/EmptyState.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'
import GuestBillItemCard from '@/components/bill/GuestBillItemCard.vue'
import LoadingSkeleton from '@/components/bill/LoadingSkeleton.vue'
import PaymentQrCard from '@/components/bill/PaymentQrCard.vue'
import SplitTotalBar from '@/components/bill/SplitTotalBar.vue'
import { addDecimalStrings } from '@/utils/financialDecimal'

const route = useRoute()
const billStore = useBillStore()
const { guestBill, guestSummary, participantToken, guestShareToken, guestTerminalState, loading, saving, error } = storeToRefs(billStore)
const displayName = ref('')
const selectedItemIds = ref<Set<string>>(new Set())

const shareToken = computed(() => String(route.params.shareToken))
const currentGuestBill = computed(() => guestShareToken.value === shareToken.value ? guestBill.value : null)
const isTerminalBill = computed(() => {
  const status = currentGuestBill.value?.status.toLowerCase()
  return Boolean(guestTerminalState.value || status === 'closed' || status === 'expired')
})
const terminalMessage = computed(() => {
  if (guestTerminalState.value) return guestTerminalState.value.message
  const status = currentGuestBill.value?.status.toLowerCase()
  if (status === 'closed') return 'This bill split is closed. New joins and allocation changes are disabled.'
  if (status === 'expired') return 'This bill split has expired. New joins and allocation changes are disabled.'
  return null
})
const selectedSubtotal = computed(() => {
  if (!currentGuestBill.value) return '0.00'
  return addDecimalStrings(currentGuestBill.value.items
    .filter(item => selectedItemIds.value.has(item.id))
    .map(item => item.lineTotal))
})

const totalBarValues = computed(() => ({
  subtotal: guestSummary.value?.subtotalShare ?? selectedSubtotal.value,
  tax: guestSummary.value?.taxShare ?? '0.00',
  service: guestSummary.value?.serviceChargeShare ?? '0.00',
  total: guestSummary.value?.totalOwed ?? selectedSubtotal.value
}))

const unallocatedTotal = computed(() => guestSummary.value?.unallocatedTotal ?? currentGuestBill.value?.unallocatedTotal ?? '0.00')

async function loadGuestBill(token: string) {
  await billStore.fetchGuestBill(token).catch(() => undefined)
  syncSelectedItems()
}

onMounted(() => {
  void loadGuestBill(shareToken.value)
})
watch(shareToken, loadGuestBill)

watch(guestSummary, syncSelectedItems)

function syncSelectedItems() {
  if (!guestSummary.value || isTerminalBill.value) return
  selectedItemIds.value = new Set(guestSummary.value.selectedItems.map(item => item.itemId))
}

async function joinBill() {
  if (!displayName.value.trim() || isTerminalBill.value) return
  await billStore.joinGuestBill(shareToken.value, displayName.value.trim())
}

function toggleItem(itemId: string) {
  if (isTerminalBill.value || saving.value || !participantToken.value) return
  const next = new Set(selectedItemIds.value)
  if (next.has(itemId)) {
    next.delete(itemId)
  } else {
    next.add(itemId)
  }
  selectedItemIds.value = next
}

async function saveSelection() {
  if (isTerminalBill.value || saving.value || !participantToken.value) return
  await billStore.selectGuestItems(shareToken.value, Array.from(selectedItemIds.value))
}
</script>

<template>
  <main class="guest-page"><div class="guest-wrap"><header class="guest-head"><p class="guest-brand">duit<span>.</span> <small>shared bill</small></p><h1>{{ currentGuestBill?.merchantName || 'Shared bill' }}</h1><p v-if="currentGuestBill">{{ formatCurrency(currentGuestBill.totalAmount, currentGuestBill.currency) }} total · Expires {{ new Date(currentGuestBill.expiresAt).toLocaleDateString('en-MY') }}</p></header>
    <ErrorBanner :message="error" /><ErrorBanner :message="terminalMessage" /><LoadingSkeleton v-if="loading && !currentGuestBill && !guestTerminalState" />
    <template v-else-if="currentGuestBill">
      <form v-if="!participantToken" class="guest-join" @submit.prevent="joinBill"><h2>Join this split</h2><p>Enter the name your friend will recognise. You do not need an account.</p><label for="guest-name">Your name</label><input id="guest-name" v-model="displayName" required maxlength="120" autocomplete="name" placeholder="e.g. Aina"><button type="submit" :disabled="saving || !displayName.trim() || isTerminalBill">{{ saving ? 'Joining…' : 'Continue' }}</button></form>
      <section v-else><div class="guest-section-title"><h2>Choose your items</h2><p>Tap the items that are yours. Shared items are split between the people who select them.</p></div><div class="guest-items"><GuestBillItemCard v-for="item in currentGuestBill.items" :key="item.id" :item="item" :currency="currentGuestBill.currency" :selected="selectedItemIds.has(item.id)" :disabled="isTerminalBill || saving" @toggle="toggleItem" /></div><div class="guest-payment"><PaymentQrCard :profile="guestSummary?.paymentQrProfile ?? currentGuestBill.paymentQrProfile ?? null" /><p>Unassigned on this bill: {{ formatCurrency(unallocatedTotal, currentGuestBill.currency) }}</p></div><SplitTotalBar :currency="currentGuestBill.currency" :subtotal="totalBarValues.subtotal" :tax="totalBarValues.tax" :service="totalBarValues.service" :total="totalBarValues.total" :disabled="saving || isTerminalBill || !participantToken" :loading="saving" action-label="Save my items" @submit="saveSelection" /></section>
    </template><EmptyState v-else-if="!loading" title="Bill unavailable" message="This split link may be invalid or expired." /></div></main>
</template>
<style scoped>
.guest-page { min-height:100dvh; background:var(--paper); color:var(--ink); }
.guest-wrap { max-width:620px; margin:auto; padding:28px 20px 160px; }
.guest-head { margin-bottom:28px; }
.guest-brand { margin:0 0 32px; color:var(--accent); font-size:24px; font-weight:700; letter-spacing:-.06em; }
.guest-brand span { color:#D9A23A; }
.guest-brand small { margin-left:8px; color:var(--muted); font-size:12px; font-weight:400; letter-spacing:0; }
.guest-head h1 { margin:0; font-size:28px; }
.guest-head > p:last-child { margin:8px 0 0; color:var(--muted); font-size:13px; }
.guest-join { padding:24px; border:1px solid var(--rule); border-radius:14px; background:#fff; }
.guest-join h2,.guest-section-title h2 { margin:0; font-size:19px; }
.guest-join p,.guest-section-title p { margin:7px 0 22px; color:var(--muted); font-size:13px; line-height:20px; }
.guest-join label { display:block; margin-bottom:7px; font-size:13px; font-weight:600; }
.guest-join input { width:100%; min-height:52px; padding:12px; border:1px solid #D2CEC5; border-radius:10px; background:#fff; }
.guest-join button { width:100%; min-height:52px; margin-top:16px; border:0; border-radius:10px; background:var(--accent); color:#fff; font-weight:600; }
.guest-join button:disabled { opacity:.5; }
.guest-items { border-top:1px solid var(--rule); }
.guest-payment { margin-top:24px; }
.guest-payment > p { color:var(--muted); font-size:12px; }
</style>
