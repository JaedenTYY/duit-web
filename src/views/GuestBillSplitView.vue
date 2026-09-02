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
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'
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
  <main class="min-h-screen bg-slate-50 px-4 py-5 text-slate-700">
    <div class="mx-auto max-w-2xl space-y-6 pb-28">
      <header class="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/40 sm:p-6">
        <div class="flex items-start gap-4">
          <FriendlyAvatar
            tone="blue"
            size="sm"
          />
          <div class="min-w-0">
            <p class="text-xs font-black uppercase tracking-widest text-blue-300">
              Duit split
            </p>
            <h1 class="mt-2 truncate text-2xl font-black tracking-tight">
              {{ currentGuestBill?.merchantName || 'Shared bill' }}
            </h1>
            <p
              v-if="currentGuestBill"
              class="mt-2 text-sm font-semibold leading-6 text-slate-300"
            >
              Total {{ formatCurrency(currentGuestBill.totalAmount, currentGuestBill.currency) }} · Expires {{ new Date(currentGuestBill.expiresAt).toLocaleDateString() }}
            </p>
          </div>
        </div>
      </header>

      <ErrorBanner :message="error" />
      <ErrorBanner :message="terminalMessage" />
      <LoadingSkeleton v-if="loading && !currentGuestBill && !guestTerminalState" />

      <template v-else-if="currentGuestBill">
        <form
          v-if="!participantToken"
          class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          @submit.prevent="joinBill"
        >
          <h2 class="text-xl font-black text-slate-900">
            Join this split
          </h2>
          <p class="mt-1 text-sm leading-6 text-slate-500">
            Enter the name your friend should see on their participant list.
          </p>
          <input
            v-model="displayName"
            required
            maxlength="120"
            class="mt-6 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-base font-semibold outline-none transition-colors focus:border-blue-500 focus:bg-white"
            placeholder="Your name"
          >
          <button
            type="submit"
            :disabled="saving || !displayName.trim() || isTerminalBill"
            class="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            {{ saving ? 'Joining...' : 'Join bill' }}
          </button>
        </form>

        <section
          v-else
          class="space-y-6"
        >
          <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-xl font-black text-slate-900">
              Select your items
            </h2>
            <p class="mt-1 text-sm leading-6 text-slate-500">
              Tap every receipt line you shared or consumed. This is a whole-line split; saving sends the complete replacement selection.
            </p>
            <p class="mt-3 rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-700">
              Before saving, the item subtotal is only a preview. Duit will replace it with the authoritative split, tax, service and reconciliation after the backend recalculates.
            </p>
          </div>

          <div class="space-y-3">
            <GuestBillItemCard
              v-for="item in currentGuestBill.items"
              :key="item.id"
              :item="item"
              :currency="currentGuestBill.currency"
              :selected="selectedItemIds.has(item.id)"
              :disabled="isTerminalBill || saving"
              @toggle="toggleItem"
            />
          </div>

          <PaymentQrCard :profile="guestSummary?.paymentQrProfile ?? currentGuestBill.paymentQrProfile ?? null" />

          <div class="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm">
            Remaining / unallocated amount:
            <span class="font-black text-slate-950">{{ formatCurrency(unallocatedTotal, currentGuestBill.currency) }}</span>
          </div>

          <SplitTotalBar
            :currency="currentGuestBill.currency"
            :subtotal="totalBarValues.subtotal"
            :tax="totalBarValues.tax"
            :service="totalBarValues.service"
            :total="totalBarValues.total"
            :disabled="saving || isTerminalBill || !participantToken"
            :loading="saving"
            action-label="Save items"
            @submit="saveSelection"
          />
        </section>
      </template>

      <EmptyState
        v-else-if="!loading"
        title="Bill unavailable"
        message="This split link may be invalid or expired."
      />
    </div>
  </main>
</template>
