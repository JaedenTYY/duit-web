<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import api from '@/lib/api'
import type { ReceiptExtractionResponse, Category, CategorisationResult } from '@/types'
import type { ConfirmExtractionPayload } from '@/stores/receipt'
import { formatCurrency } from '@/utils/currency'
import { logger } from '@/utils/logger'
import CategorySuggestion from '../transactions/CategorySuggestion.vue'

const props = defineProps<{
  extraction: ReceiptExtractionResponse
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'confirm', payload: ConfirmExtractionPayload): void
  (e: 'back'): void
}>()

const formContainer = ref<HTMLElement | null>(null)

const amount = ref(props.extraction.extractedData.total.toString())
const currency = ref(props.extraction.extractedData.currency)
const merchantName = ref(props.extraction.extractedData.merchantName ?? '')
const description = ref(props.extraction.extractedData.merchantName ?? '')
const categoryId = ref('')
const fxRate = ref(1)
const occurredAt = ref(
  props.extraction.extractedData.date
    ? new Date(props.extraction.extractedData.date).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16)
)

const showFxRate = computed(() => currency.value !== 'MYR')
const fieldsNeedingReview = computed(() => props.extraction.extractedData.fieldsNeedingReview ?? [])

const categorisation = ref<CategorisationResult | null>(null)
let debounceTimer: ReturnType<typeof setTimeout>

async function fetchCategorisation(name: string) {
  if (!name.trim()) {
    categorisation.value = null
    return
  }
  try {
    const res = await api.get<{ data: CategorisationResult }>('/merchants/categorise', {
      params: { name }
    })
    categorisation.value = res.data.data
  } catch (err) {
    logger.error('Failed to fetch merchant categorisation', err)
  }
}

watch(merchantName, (newVal) => {
  clearTimeout(debounceTimer)
  if (newVal) {
    debounceTimer = setTimeout(() => {
      fetchCategorisation(newVal)
    }, 500)
  } else {
    categorisation.value = null
  }
})

onMounted(() => {
  if (formContainer.value) {
    gsap.from(formContainer.value, {
      y: 18,
      opacity: 0,
      duration: 0.35,
      ease: 'power2.out'
    })
  }

  if (merchantName.value) {
    fetchCategorisation(merchantName.value)
  }
})

function handleConfirm() {
  emit('confirm', {
    extractionId: props.extraction.extractionId,
    amount: parseFloat(amount.value),
    currency: currency.value,
    merchantName: merchantName.value || undefined,
    categoryId: categoryId.value || undefined,
    description: description.value || undefined,
    occurredAt: new Date(occurredAt.value).toISOString(),
    fxRate: showFxRate.value ? fxRate.value : undefined,
  })
}

function lineTotal(item: { qty: number; unitPrice: number }) {
  return Number(item.qty) * Number(item.unitPrice)
}

function formatReviewField(field: string) {
  return field.replaceAll('_', ' ')
}
</script>

<template>
  <div
    ref="formContainer"
    class="space-y-5"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
          Review before saving
        </p>
        <h3 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
          Check the receipt details
        </h3>
      </div>
      <div
        class="w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
        :class="{
          'bg-emerald-50 text-emerald-700': extraction.confidence === 'high',
          'bg-amber-50 text-amber-700': extraction.confidence === 'medium',
          'bg-red-50 text-red-700': extraction.confidence === 'low'
        }"
      >
        {{ extraction.confidence === 'high' ? 'High confidence' : extraction.confidence === 'medium' ? 'Review carefully' : 'Verify fields' }}
      </div>
    </div>

    <div
      v-if="fieldsNeedingReview.length > 0"
      class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p class="font-black">
        Please verify these fields before saving:
      </p>
      <div class="mt-2 flex flex-wrap gap-2">
        <span
          v-for="field in fieldsNeedingReview"
          :key="field"
          class="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-amber-900"
        >
          {{ formatReviewField(field) }}
        </span>
      </div>
    </div>

    <div
      v-if="extraction.extractedData.lineItems.length > 0"
      class="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4"
    >
      <div class="mb-3 flex justify-between px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>Item</span>
        <span>Total</span>
      </div>
      <div class="max-h-56 space-y-2 overflow-y-auto pr-1">
        <div
          v-for="(item, index) in extraction.extractedData.lineItems"
          :key="index"
          class="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-black text-slate-950">
              {{ item.name }}
            </p>
            <p class="text-xs font-medium text-slate-500">
              {{ item.qty }} x {{ formatCurrency(item.unitPrice.toString(), currency) }}
            </p>
          </div>
          <span class="shrink-0 text-sm font-black tabular-nums text-slate-950">{{ formatCurrency(lineTotal(item).toString(), currency) }}</span>
        </div>
      </div>
    </div>

    <form
      class="space-y-4"
      @submit.prevent="handleConfirm"
    >
      <div class="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label class="receipt-label">Amount</label>
          <input
            v-model="amount"
            type="number"
            step="0.01"
            required
            class="receipt-input"
          >
        </div>
        <div>
          <label class="receipt-label">Currency</label>
          <select
            v-model="currency"
            class="receipt-input px-3"
          >
            <option>MYR</option>
            <option>SGD</option>
            <option>IDR</option>
            <option>USD</option>
            <option>THB</option>
          </select>
        </div>
      </div>

      <div v-if="showFxRate">
        <label class="receipt-label">Exchange Rate (to MYR)</label>
        <input
          v-model="fxRate"
          type="number"
          step="0.0001"
          required
          class="receipt-input"
        >
      </div>

      <div>
        <label class="receipt-label">Merchant</label>
        <input
          v-model="merchantName"
          type="text"
          placeholder="e.g. Kopitiam"
          class="receipt-input"
        >
      </div>

      <div>
        <label class="receipt-label">Category</label>
        <select
          v-model="categoryId"
          required
          class="receipt-input bg-white"
        >
          <option value="">
            Select category
          </option>
          <option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>

        <CategorySuggestion
          v-if="categorisation"
          :categorisation="categorisation"
          :categories="categories"
          @apply="categoryId = $event"
        />
      </div>

      <div>
        <label class="receipt-label">Description</label>
        <input
          v-model="description"
          type="text"
          class="receipt-input"
        >
      </div>

      <div>
        <label class="receipt-label">Date & Time</label>
        <input
          v-model="occurredAt"
          type="datetime-local"
          required
          class="receipt-input bg-white"
        >
      </div>

      <div class="grid grid-cols-[0.8fr_1.2fr] gap-3 pt-2">
        <button
          type="button"
          class="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          @click="emit('back')"
        >
          Re-scan
        </button>
        <button
          type="submit"
          class="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        >
          Confirm & Save
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.receipt-label {
  @apply mb-1 block px-1 text-xs font-black uppercase tracking-wider text-slate-500;
}

.receipt-input {
  @apply w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100;
}
</style>
