<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  transaction: Transaction
  deleting?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', transaction: Transaction): void
}>()

const formattedDate = computed(() =>
  new Date(props.transaction.occurredAt).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kuala_Lumpur',
  })
)

const merchant = computed(
  () =>
    props.transaction.merchantName ||
    props.transaction.description ||
    'Transaction'
)

const initials = computed(() =>
  merchant.value
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
)

function avatarStyle(categoryName?: string | null) {
  const cat = (categoryName || '').toLowerCase()
  if (cat.includes('food') || cat.includes('dining'))
    return { bg: '#F6E8DA', text: '#8A4E17' }
  if (cat.includes('grocer')) return { bg: '#E4EDE7', text: '#2F5E45' }
  if (cat.includes('shop')) return { bg: '#F2E6EA', text: '#7A3A50' }
  if (cat.includes('transp') || cat.includes('grab'))
    return { bg: '#E3EAF2', text: '#2F527A' }
  if (cat.includes('bill') || cat.includes('util'))
    return { bg: '#EAE7F2', text: '#4F4778' }
  return { bg: '#EFECE5', text: '#57534C' }
}
</script>

<template>
  <button
    type="button"
    class="transaction-record"
    :disabled="deleting"
    :aria-label="`View ${merchant} transaction`"
    @click="emit('open', transaction)"
  >
    <span
      class="transaction-avatar"
      :style="{
        background: avatarStyle(transaction.categoryName).bg,
        color: avatarStyle(transaction.categoryName).text,
      }"
      aria-hidden="true"
    >
      {{ initials }}
    </span>
    <span class="transaction-info">
      <strong>{{ merchant }}</strong>
      <small
        >{{ transaction.categoryName || 'Uncategorised' }} ·
        <time :datetime="transaction.occurredAt">{{
          formattedDate
        }}</time></small
      >
    </span>
    <span class="transaction-amount">
      <span
        class="rm"
        style="
          font-size: 12px;
          color: #57534c;
          font-weight: 500;
          margin-right: 2px;
        "
        >{{ transaction.currency }}</span
      >
      {{
        formatCurrency(transaction.amount, transaction.currency)
          .split(' ')
          .slice(1)
          .join(' ')
      }}
    </span>
  </button>
</template>

<style scoped>
.transaction-record {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid #efece5;
  background: transparent;
  color: #1c1b19;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}

.transaction-record:hover {
  background: rgba(247, 245, 240, 0.6);
}

.transaction-avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.transaction-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.transaction-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: #1c1b19;
}

.transaction-info small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #57534c;
  font-size: 13px;
  line-height: 18px;
}

.transaction-amount {
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1c1b19;
}
</style>
