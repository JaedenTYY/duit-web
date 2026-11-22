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
const {
  guestBill,
  guestSummary,
  participantToken,
  guestShareToken,
  guestTerminalState,
  loading,
  saving,
  error,
} = storeToRefs(billStore)

const displayName = ref('')
const selectedItemIds = ref<Set<string>>(new Set())

const shareToken = computed(() => String(route.params.shareToken))
const currentGuestBill = computed(() =>
  guestShareToken.value === shareToken.value ? guestBill.value : null
)

const isTerminalBill = computed(() => {
  const status = currentGuestBill.value?.status.toLowerCase()
  return Boolean(
    guestTerminalState.value || status === 'closed' || status === 'expired'
  )
})

const terminalMessage = computed(() => {
  if (guestTerminalState.value) return guestTerminalState.value.message
  const status = currentGuestBill.value?.status.toLowerCase()
  if (status === 'closed') {
    return 'This bill split is closed. New joins and allocation changes are disabled.'
  }
  if (status === 'expired') {
    return 'This bill split has expired. New joins and allocation changes are disabled.'
  }
  return null
})

const selectedSubtotal = computed(() => {
  if (!currentGuestBill.value) return '0.00'
  return addDecimalStrings(
    currentGuestBill.value.items
      .filter((item) => selectedItemIds.value.has(item.id))
      .map((item) => item.lineTotal)
  )
})

const totalBarValues = computed(() => ({
  subtotal: guestSummary.value?.subtotalShare ?? selectedSubtotal.value,
  tax: guestSummary.value?.taxShare ?? '0.00',
  service: guestSummary.value?.serviceChargeShare ?? '0.00',
  total: guestSummary.value?.totalOwed ?? selectedSubtotal.value,
}))

const unallocatedTotal = computed(
  () =>
    guestSummary.value?.unallocatedTotal ??
    currentGuestBill.value?.unallocatedTotal ??
    '0.00'
)

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
  selectedItemIds.value = new Set(
    guestSummary.value.selectedItems.map((item) => item.itemId)
  )
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
  await billStore.selectGuestItems(
    shareToken.value,
    Array.from(selectedItemIds.value)
  )
}
</script>

<template>
  <main class="guest-page">
    <div class="guest-wrap">
      <!-- Guest Top Wordmark Header -->
      <header class="guest-head">
        <div class="guest-nav-bar">
          <div class="wordmark" aria-label="Duit">
            du<span class="wordmark-i" aria-hidden="true">ı</span>t
          </div>
          <span class="guest-badge">Guest split</span>
        </div>

        <div v-if="currentGuestBill" class="guest-bill-intro">
          <span class="guest-kicker">You were invited to split</span>
          <h1 class="guest-title">
            {{ currentGuestBill.merchantName || 'Shared bill' }}
          </h1>
          <p class="guest-meta">
            {{
              formatCurrency(
                currentGuestBill.totalAmount,
                currentGuestBill.currency
              )
            }}
            total · Expires
            {{
              new Date(currentGuestBill.expiresAt).toLocaleDateString('en-MY', {
                dateStyle: 'medium',
              })
            }}
          </p>
        </div>
      </header>

      <ErrorBanner :message="error" />
      <ErrorBanner :message="terminalMessage" />

      <LoadingSkeleton
        v-if="loading && !currentGuestBill && !guestTerminalState"
      />

      <!-- Step 1: Join / Name Prompt -->
      <template v-else-if="currentGuestBill">
        <form
          v-if="!participantToken"
          class="guest-join-card"
          @submit.prevent="joinBill"
        >
          <h2>Which one is you?</h2>
          <p>
            Enter your name so friends know what you've claimed. No account or
            app needed.
          </p>

          <div style="display: flex; flex-direction: column; gap: 8px">
            <label
              for="guest-name"
              style="font-size: 13px; font-weight: 600; color: #1c1b19"
            >
              Your name
            </label>
            <input
              id="guest-name"
              v-model="displayName"
              required
              maxlength="120"
              autocomplete="name"
              placeholder="e.g. Aina or Mei Ling"
              class="guest-input"
            />
          </div>

          <button
            type="submit"
            class="btn b1"
            style="margin-top: 16px"
            :disabled="saving || !displayName.trim() || isTerminalBill"
          >
            {{ saving ? 'Joining…' : 'Continue' }}
          </button>

          <small class="guest-disclaimer">
            Your name is only shown to people sharing this bill. Duit does not
            store your contact details.
          </small>
        </form>

        <!-- Step 2: Dish Selection & Settlement -->
        <section v-else class="guest-claim-section">
          <div class="guest-section-title">
            <h2>What did you have?</h2>
            <p>
              Tap everything you ordered. Shared dishes and taxes are
              automatically divided for you.
            </p>
          </div>

          <div class="guest-items-group grp">
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

          <div class="guest-payment-box">
            <PaymentQrCard
              :profile="
                guestSummary?.paymentQrProfile ??
                currentGuestBill.paymentQrProfile ??
                null
              "
            />
            <p
              v-if="unallocatedTotal !== '0.00'"
              style="margin-top: 8px; color: #57534c; font-size: 13px"
            >
              Unassigned on this bill:
              {{ formatCurrency(unallocatedTotal, currentGuestBill.currency) }}
            </p>
          </div>

          <p class="guest-compliance-note">
            Duit calculates your share but does not process payment. Payment
            happens directly through your own bank or wallet.
          </p>

          <SplitTotalBar
            :currency="currentGuestBill.currency"
            :subtotal="totalBarValues.subtotal"
            :tax="totalBarValues.tax"
            :service="totalBarValues.service"
            :total="totalBarValues.total"
            :disabled="saving || isTerminalBill || !participantToken"
            :loading="saving"
            action-label="Confirm my share"
            @submit="saveSelection"
          />
        </section>
      </template>

      <EmptyState
        v-else-if="!loading"
        title="Bill unavailable"
        message="This split link may be invalid or expired. Check the link with the person who shared it."
      />
    </div>
  </main>
</template>

<style scoped>
.guest-page {
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
}

.guest-wrap {
  max-width: 620px;
  margin: auto;
  padding: 24px 20px 160px;
}

.guest-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.guest-badge {
  font-size: 12px;
  font-weight: 600;
  color: #57534c;
  background: #efece5;
  padding: 4px 10px;
  border-radius: 999px;
}

.guest-bill-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 24px;
}

.guest-kicker {
  font-size: 13px;
  color: #57534c;
}

.guest-title {
  font-size: 28px;
  line-height: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #1c1b19;
}

.guest-meta {
  margin: 4px 0 0;
  color: #57534c;
  font-size: 13px;
}

.guest-join-card {
  padding: 28px 24px;
  border: 1px solid #e4e0d7;
  border-radius: 16px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guest-join-card h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1c1b19;
}

.guest-join-card p {
  margin: 0;
  color: #57534c;
  font-size: 14px;
  line-height: 20px;
}

.guest-input {
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  border: 1px solid #d6d1c6;
  border-radius: 10px;
  background: #ffffff;
  color: #1c1b19;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.guest-disclaimer {
  display: block;
  color: #6e6a62;
  font-size: 12px;
  line-height: 16px;
}

.guest-claim-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guest-section-title h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1c1b19;
}

.guest-section-title p {
  margin: 4px 0 0;
  color: #57534c;
  font-size: 14px;
  line-height: 20px;
}

.guest-items-group {
  background: #ffffff;
  border-radius: 16px;
  padding: 0 16px;
  border: 1px solid #e4e0d7;
}

.guest-payment-box {
  margin-top: 8px;
}

.guest-compliance-note {
  margin: 8px 0 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #efece5;
  color: #57534c;
  font-size: 12px;
  line-height: 17px;
}
</style>
