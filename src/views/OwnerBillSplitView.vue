<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import StatCard from '@/components/shared/StatCard.vue'

const route = useRoute()
const billStore = useBillStore()
const { bill, paymentProfiles, loading, saving, error, shareUrl } = storeToRefs(billStore)
const selectedProfileId = ref('')
const provider = ref('DuitNow')
const displayName = ref('')
const qrImageUrl = ref('')
const qrPayload = ref('')
const isDefault = ref(false)
let refreshTimer: number | undefined

const billId = computed(() => String(route.params.id))
const selectedProfile = computed(() => bill.value?.paymentQrProfile ?? null)

onMounted(async () => {
  await Promise.all([
    billStore.fetchBill(billId.value),
    billStore.fetchPaymentProfiles()
  ])
  selectedProfileId.value = bill.value?.paymentQrProfile?.id ?? ''
  refreshTimer = window.setInterval(() => {
    if (bill.value?.id) {
      billStore.fetchParticipants(bill.value.id).catch(() => undefined)
    }
  }, 7000)
})

onUnmounted(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
  }
})

async function togglePaid(participantId: string, nextPaid: boolean) {
  if (!bill.value) return
  await billStore.markPaid(bill.value.id, participantId, nextPaid)
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
  if (!bill.value) return
  await billStore.setBillPaymentProfile(bill.value.id, selectedProfileId.value || null)
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-8 pb-28">
    <PageHeader
      eyebrow="Bill split"
      :title="bill?.merchantName || 'Receipt split'"
      :description="bill ? `Expires ${new Date(bill.expiresAt).toLocaleString()}` : 'Review receipt items, share the guest link, and track settlement.'"
    />

    <ErrorBanner :message="error" />
    <LoadingSkeleton v-if="loading && !bill" />

    <template v-else-if="bill">
      <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Subtotal"
          :value="formatCurrency(bill.subtotal, bill.currency)"
          tone="slate"
        />
        <StatCard
          label="Tax"
          :value="formatCurrency(bill.taxAmount, bill.currency)"
          tone="blue"
        />
        <StatCard
          label="Service"
          :value="formatCurrency(bill.serviceCharge, bill.currency)"
          tone="amber"
        />
        <div class="rounded-[2rem] border border-transparent bg-gradient-to-br from-slate-800 to-slate-950 p-5 shadow-lg shadow-slate-900/20">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Total</p>
          <p class="mt-2 truncate text-2xl font-black text-white">{{ formatCurrency(bill.totalAmount, bill.currency) }}</p>
        </div>
      </section>

      <QRShareCard :share-url="shareUrl" />

      <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="space-y-4">
          <h2 class="text-xl font-black text-slate-900">
            Receipt items
          </h2>
          <div class="grid gap-3 sm:grid-cols-2">
            <BillItemCard
              v-for="item in bill.items"
              :key="item.id"
              :item="item"
              :currency="bill.currency"
            />
          </div>
        </div>

        <div class="space-y-4">
          <PaymentQrCard :profile="selectedProfile" />

          <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 class="text-xl font-black text-slate-900">
              Select payment QR
            </h2>
            <div class="mt-5 flex flex-col gap-3 sm:flex-row">
              <select
                v-model="selectedProfileId"
                class="min-w-0 flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-blue-500 focus:bg-white"
              >
                <option value="">No QR selected</option>
                <option
                  v-for="profile in paymentProfiles"
                  :key="profile.id"
                  :value="profile.id"
                >
                  {{ profile.displayName }} · {{ profile.provider }}
                </option>
              </select>
              <button
                type="button"
                :disabled="saving"
                class="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                @click="applyPaymentProfile"
              >
                Apply
              </button>
            </div>
          </section>

          <form
            class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            @submit.prevent="savePaymentProfile"
          >
            <h2 class="text-xl font-black text-slate-900">
              Add payment QR
            </h2>
            <div class="mt-5 space-y-4">
              <input
                v-model="displayName"
                required
                class="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500 focus:bg-white"
                placeholder="Display name"
              >
              <input
                v-model="provider"
                required
                class="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500 focus:bg-white"
                placeholder="Provider (e.g. DuitNow)"
              >
              <input
                v-model="qrImageUrl"
                class="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500 focus:bg-white"
                placeholder="QR image URL"
              >
              <input
                v-model="qrPayload"
                class="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500 focus:bg-white"
                placeholder="QR payload or payment note"
              >
              <label class="flex items-center gap-3 text-sm font-bold text-slate-600">
                <input
                  v-model="isDefault"
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                >
                Make default
              </label>
              <button
                type="submit"
                :disabled="saving || (!qrImageUrl && !qrPayload)"
                class="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                Save QR profile
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-black text-slate-900">
            Participants
          </h2>
          <button
            type="button"
            class="min-h-11 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 border border-slate-200"
            @click="billStore.fetchParticipants(bill.id)"
          >
            Refresh
          </button>
        </div>
        <EmptyState
          v-if="bill.participants.length === 0"
          title="No guests yet"
          message="Share the QR link and participants will appear here after they join."
        />
        <div
          v-else
          class="grid gap-4 md:grid-cols-2"
        >
          <ParticipantStatusCard
            v-for="participant in bill.participants"
            :key="participant.id"
            :participant="participant"
            :currency="bill.currency"
            :saving="saving"
            @toggle-paid="togglePaid"
          />
        </div>
      </section>
    </template>
  </div>
</template>
