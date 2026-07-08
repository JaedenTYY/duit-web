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
    <header>
      <p class="text-xs font-black uppercase tracking-widest text-blue-600">
        Bill split
      </p>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {{ bill?.merchantName || 'Receipt split' }}
      </h1>
      <p
        v-if="bill"
        class="mt-2 text-sm font-semibold text-slate-500"
      >
        Expires {{ new Date(bill.expiresAt).toLocaleString() }}
      </p>
    </header>

    <ErrorBanner :message="error" />
    <LoadingSkeleton v-if="loading && !bill" />

    <template v-else-if="bill">
      <section class="grid gap-4 sm:grid-cols-4">
        <div class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Subtotal</p>
          <p class="mt-2 text-xl font-black text-slate-900">{{ formatCurrency(bill.subtotal, bill.currency) }}</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Tax</p>
          <p class="mt-2 text-xl font-black text-slate-900">{{ formatCurrency(bill.taxAmount, bill.currency) }}</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Service</p>
          <p class="mt-2 text-xl font-black text-slate-900">{{ formatCurrency(bill.serviceCharge, bill.currency) }}</p>
        </div>
        <div class="rounded-3xl border border-slate-200 bg-slate-900 p-5">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total</p>
          <p class="mt-2 text-xl font-black text-white">{{ formatCurrency(bill.totalAmount, bill.currency) }}</p>
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

          <section class="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 class="text-lg font-bold text-slate-900">
              Select payment QR
            </h2>
            <div class="mt-4 flex gap-2">
              <select
                v-model="selectedProfileId"
                class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
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
                class="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-40"
                @click="applyPaymentProfile"
              >
                Apply
              </button>
            </div>
          </section>

          <form
            class="rounded-3xl border border-slate-200 bg-white p-5"
            @submit.prevent="savePaymentProfile"
          >
            <h2 class="text-lg font-bold text-slate-900">
              Add payment QR
            </h2>
            <div class="mt-4 space-y-3">
              <input
                v-model="displayName"
                required
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="Display name"
              >
              <input
                v-model="provider"
                required
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="Provider"
              >
              <input
                v-model="qrImageUrl"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="QR image URL"
              >
              <input
                v-model="qrPayload"
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500"
                placeholder="QR payload or payment note"
              >
              <label class="flex items-center gap-3 text-sm font-bold text-slate-600">
                <input
                  v-model="isDefault"
                  type="checkbox"
                  class="h-4 w-4"
                >
                Make default
              </label>
              <button
                type="submit"
                :disabled="saving || (!qrImageUrl && !qrPayload)"
                class="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 disabled:opacity-40"
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
            class="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 border border-slate-200"
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
