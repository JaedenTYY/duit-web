<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import { formatCurrency } from '@/utils/currency'
import BillItemCard from '@/components/bill/BillItemCard.vue'
import EmptyState from '@/components/bill/EmptyState.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'
import LoadingSkeleton from '@/components/bill/LoadingSkeleton.vue'
import ParticipantStatusCard from '@/components/bill/ParticipantStatusCard.vue'
import PaymentQrCard from '@/components/bill/PaymentQrCard.vue'
import QRShareCard from '@/components/bill/QRShareCard.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const route = useRoute()
const billStore = useBillStore()
const { bill, paymentProfiles, loading, saving, error, ownerTerminalState, shareUrl } = storeToRefs(billStore)
const selectedProfileId = ref('')
const provider = ref('DuitNow')
const displayName = ref('')
const qrImageUrl = ref('')
const qrPayload = ref('')
const isDefault = ref(false)
let refreshTimer: number | undefined

const billId = computed(() => String(route.params.id))
const currentBill = computed(() => bill.value?.id === billId.value ? bill.value : null)
const selectedProfile = computed(() => currentBill.value?.paymentQrProfile ?? null)
const isTerminalBill = computed(() => {
  const status = currentBill.value?.status.toLowerCase()
  return Boolean(ownerTerminalState.value || status === 'closed' || status === 'expired')
})
const terminalMessage = computed(() => {
  if (ownerTerminalState.value) return ownerTerminalState.value.message
  const status = currentBill.value?.status.toLowerCase()
  if (status === 'closed') return 'This bill split is closed. Settlement controls are disabled.'
  if (status === 'expired') return 'This bill split has expired. Review is available, but split updates are disabled.'
  return null
})
const hasReconciliation = computed(() => {
  if (!currentBill.value) return false
  return currentBill.value.lineAdjustment !== '0.0000' || currentBill.value.totalAdjustment !== '0.0000'
})

async function loadBill(id: string) {
  await billStore.fetchBill(id).catch(() => undefined)
  if (currentBill.value) selectedProfileId.value = currentBill.value.paymentQrProfile?.id ?? ''
}

watch(billId, loadBill, { immediate: true })

onMounted(async () => {
  await billStore.fetchPaymentProfiles()
  refreshTimer = window.setInterval(() => {
    if (currentBill.value?.id && !isTerminalBill.value) {
      billStore.fetchParticipants(currentBill.value.id).catch(() => undefined)
    }
  }, 7000)
})

onUnmounted(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
  }
})

async function togglePaid(participantId: string, nextPaid: boolean) {
  if (!currentBill.value || isTerminalBill.value) return
  await billStore.markPaid(currentBill.value.id, participantId, nextPaid)
}

async function savePaymentProfile() {
  await billStore.createPaymentProfile({
    provider: provider.value,
    displayName: displayName.value,
    qrImageUrl: qrImageUrl.value || undefined,
    qrPayload: qrPayload.value || undefined,
    isDefault: isDefault.value
  })
  provider.value = 'DuitNow'
  displayName.value = ''
  qrImageUrl.value = ''
  qrPayload.value = ''
  isDefault.value = false
}

async function applyPaymentProfile() {
  if (!currentBill.value || isTerminalBill.value) return
  await billStore.setBillPaymentProfile(currentBill.value.id, selectedProfileId.value || null)
}
</script>

<template>
  <div class="owner-page">
    <PageHeader eyebrow="Your split" :title="currentBill?.merchantName || 'Receipt split'" :description="currentBill ? `Expires ${new Date(currentBill.expiresAt).toLocaleDateString('en-MY')}` : 'Review items, share the link, and track payments.'" />
    <ErrorBanner :message="error" /><ErrorBanner :message="terminalMessage" /><LoadingSkeleton v-if="loading && !currentBill && !ownerTerminalState" />
    <template v-else-if="currentBill">
      <div class="owner-grid">
        <div>
          <section class="owner-summary"><p>Bill total</p><strong>{{ formatCurrency(currentBill.totalAmount, currentBill.currency) }}</strong><div><span>Subtotal {{ formatCurrency(currentBill.subtotal, currentBill.currency) }}</span><span>Tax {{ formatCurrency(currentBill.taxAmount, currentBill.currency) }}</span><span>Service {{ formatCurrency(currentBill.serviceCharge, currentBill.currency) }}</span></div></section>
          <section class="owner-section owner-people"><div class="owner-heading"><h2>People</h2><button type="button" :disabled="isTerminalBill" @click="billStore.fetchParticipants(currentBill.id)">Refresh</button></div><EmptyState v-if="currentBill.participants.length === 0" title="No guests yet" message="Share the link and guests will appear after they join." /><div v-else class="owner-list"><ParticipantStatusCard v-for="participant in currentBill.participants" :key="participant.id" :participant="participant" :currency="currentBill.currency" :saving="saving || isTerminalBill" @toggle-paid="togglePaid" /></div></section>
          <section class="owner-section owner-items"><h2>Receipt items</h2><div class="owner-list"><BillItemCard v-for="item in currentBill.items" :key="item.id" :item="item" :currency="currentBill.currency" /></div></section>
        </div>
        <div><QRShareCard :share-url="shareUrl" /><section class="owner-section owner-allocation"><h2>Allocation</h2><dl><div><dt>Not yet assigned</dt><dd>{{ formatCurrency(currentBill.unallocatedTotal, currentBill.currency) }}</dd></div><div><dt>Version</dt><dd>{{ currentBill.allocationVersion }}</dd></div></dl><p v-if="hasReconciliation">Receipt adjustment: {{ formatCurrency(currentBill.lineAdjustment, currentBill.currency) }} on items and {{ formatCurrency(currentBill.totalAdjustment, currentBill.currency) }} on total.</p></section>
          <details class="owner-payment"><summary>Payment details</summary><p>Duit shows payment details you provide. It does not process payments.</p><PaymentQrCard :profile="selectedProfile" /><label for="owner-qr-select">Choose saved payment QR</label><div class="owner-payment-action"><select id="owner-qr-select" v-model="selectedProfileId"><option value="">No QR selected</option><option v-for="profile in paymentProfiles" :key="profile.id" :value="profile.id">{{ profile.displayName }} · {{ profile.provider }}</option></select><button type="button" :disabled="saving || isTerminalBill" @click="applyPaymentProfile">Apply</button></div><form @submit.prevent="savePaymentProfile"><h3>Add your payment details</h3><label for="owner-qr-name">Display name</label><input id="owner-qr-name" v-model="displayName" required placeholder="Your name"><label for="owner-qr-provider">Provider</label><input id="owner-qr-provider" v-model="provider" required placeholder="DuitNow"><label for="owner-qr-image">Your QR image URL</label><input id="owner-qr-image" v-model="qrImageUrl" placeholder="Paste an image URL"><label for="owner-qr-note">Payment note</label><input id="owner-qr-note" v-model="qrPayload" placeholder="Optional note"><label class="owner-checkbox"><input v-model="isDefault" type="checkbox"> Make default</label><button type="submit" :disabled="saving || (!qrImageUrl && !qrPayload)">Save payment details</button></form></details>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
.owner-page { max-width:1060px; padding-bottom:60px; }
.owner-grid { display:grid; grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr); gap:40px; }
.owner-summary { padding:26px; border-radius:16px; background:var(--accent); color:#fff; }
.owner-summary p { margin:0 0 5px; color:#D8E9E3; font-size:13px; }
.owner-summary strong { font-size:clamp(32px,4vw,42px); line-height:1.15; font-weight:600; letter-spacing:-.04em; font-variant-numeric:tabular-nums; }
.owner-summary div { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:20px; color:#D8E9E3; font-size:12px; }
.owner-section { margin-top:28px; }
.owner-section h2 { margin:0 0 12px; font-size:17px; }
.owner-heading { display:flex; justify-content:space-between; align-items:center; }
.owner-heading button { min-height:44px; border:0; background:transparent; color:var(--accent); font-size:13px; font-weight:600; }
.owner-list { border-top:1px solid var(--rule); }
.owner-allocation dl { margin:0; border-top:1px solid var(--rule); }
.owner-allocation dl div { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--rule); font-size:13px; }
.owner-allocation dt,.owner-allocation p { color:var(--muted); }
.owner-allocation dd { margin:0; font-weight:600; }
.owner-allocation p { font-size:12px; line-height:18px; }
.owner-payment { margin-top:28px; padding:16px; border:1px solid var(--rule); border-radius:12px; background:#fff; }
.owner-payment summary { cursor:pointer; font-size:15px; font-weight:600; }
.owner-payment p { color:var(--muted); font-size:13px; line-height:19px; }
.owner-payment label { display:block; margin:15px 0 6px; font-size:13px; font-weight:600; }
.owner-payment input:not([type=checkbox]),.owner-payment select { width:100%; min-height:46px; padding:10px; border:1px solid var(--rule); border-radius:9px; background:#fff; font-size:14px; }
.owner-payment-action { display:flex; gap:8px; }
.owner-payment-action button,.owner-payment form button { min-height:46px; padding:0 16px; border:0; border-radius:9px; background:var(--accent); color:#fff; font-size:13px; font-weight:600; }
.owner-payment form h3 { margin:24px 0 0; font-size:15px; }
.owner-payment .owner-checkbox { display:flex; align-items:center; gap:8px; font-weight:400; }
.owner-payment form button { width:100%; margin-top:12px; }
@media(max-width:800px){.owner-grid{display:flex;flex-direction:column;gap:0}.owner-grid>div{display:contents}.owner-summary{order:0;margin:0 -20px;border-radius:0;padding:24px 20px}.owner-grid :deep(.share-card){order:1;margin-top:24px}.owner-people{order:2}.owner-items{order:3}.owner-allocation{order:4}.owner-payment{order:5}}
</style>
