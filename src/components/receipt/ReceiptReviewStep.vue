<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import type { ReceiptExtractionResponse, Category, ConfirmExtractionPayload } from '@/types'
import { formatCurrency } from '@/utils/currency'

const props = defineProps<{
  extraction: ReceiptExtractionResponse
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'confirm', payload: ConfirmExtractionPayload): void
  (e: 'back'): void
}>()

const formContainer = ref<HTMLElement | null>(null)

// Form state
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

onMounted(() => {
  if (formContainer.value) {
    gsap.from(formContainer.value, {
      x: 40,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out'
    })
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
</script>

<template>
  <div ref="formContainer" class="space-y-6">
    <!-- Header & Confidence -->
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-duit-dark">Review Extraction</h3>
      <div 
        class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
        :class="{
          'bg-duit-success/10 text-duit-success': extraction.confidence === 'high',
          'bg-duit-warning/10 text-duit-warning': extraction.confidence === 'medium',
          'bg-duit-danger/10 text-duit-danger': extraction.confidence === 'low'
        }"
      >
        {{ extraction.confidence === 'high' ? 'High Confidence' : extraction.confidence === 'medium' ? 'Review Carefully' : 'Verify Fields' }}
      </div>
    </div>

    <!-- Line Items -->
    <div v-if="extraction.extractedData.lineItems.length > 0" class="bg-gray-50 rounded-2xl p-4 space-y-3">
      <div class="flex justify-between text-[10px] font-bold text-duit-mid uppercase tracking-widest px-2">
        <span>Item</span>
        <span>Total</span>
      </div>
      <div class="space-y-2">
        <div v-for="(item, index) in extraction.extractedData.lineItems" :key="index" class="flex justify-between items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <div class="min-w-0 pr-4">
            <p class="text-sm font-semibold text-duit-dark truncate">{{ item.name }}</p>
            <p class="text-xs text-duit-mid">{{ item.qty }} × {{ formatCurrency(item.unitPrice.toString(), currency) }}</p>
          </div>
          <span class="text-sm font-bold text-duit-dark">{{ formatCurrency((item.qty * item.unitPrice).toString(), currency) }}</span>
        </div>
      </div>
    </div>

    <!-- Editable Form -->
    <form @submit.prevent="handleConfirm" class="space-y-4">
      <div class="flex gap-3">
        <div class="flex-grow">
          <label class="block text-sm font-medium text-duit-dark mb-1">Amount</label>
          <input 
            v-model="amount" 
            type="number" 
            step="0.01" 
            required
            class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition"
          >
        </div>
        <div class="w-24">
          <label class="block text-sm font-medium text-duit-dark mb-1">Currency</label>
          <select 
            v-model="currency"
            class="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition bg-white"
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
        <label class="block text-sm font-medium text-duit-dark mb-1">Exchange Rate (to MYR)</label>
        <input 
          v-model="fxRate" 
          type="number" 
          step="0.0001" 
          required
          class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-duit-dark mb-1">Merchant</label>
        <input 
          v-model="merchantName" 
          type="text"
          placeholder="e.g. Starbucks"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-duit-dark mb-1">Category</label>
        <select 
          v-model="categoryId"
          required
          class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition bg-white"
        >
          <option value="">Select category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.icon }} {{ cat.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-duit-dark mb-1">Description</label>
        <input 
          v-model="description" 
          type="text"
          class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-duit-dark mb-1">Date & Time</label>
        <input 
          v-model="occurredAt" 
          type="datetime-local" 
          required
          class="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-duit-primary/30 focus:border-duit-primary transition bg-white"
        >
      </div>

      <div class="flex gap-4 pt-4">
        <button 
          type="button"
          class="flex-1 py-3 border border-gray-200 text-duit-dark font-bold rounded-xl hover:bg-gray-50 transition-colors"
          @click="emit('back')"
        >
          Re-scan
        </button>
        <button 
          type="submit" 
          class="flex-[2] py-3 bg-duit-primary text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-duit-primary/20"
        >
          Confirm & Save
        </button>
      </div>
    </form>
  </div>
</template>
