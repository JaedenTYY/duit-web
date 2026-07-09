<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, CategorisationResult } from '@/types'
import api from '@/lib/api'
import CategorySuggestion from './CategorySuggestion.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const props = defineProps<{
  transaction?: Transaction | null
}>()

const store = useTransactionStore()

const isEditing = computed(() => Boolean(props.transaction))
const amount = ref<number | null>(props.transaction ? Number(props.transaction.amount) : null)
const currency = ref(props.transaction?.currency ?? 'MYR')
const fxRate = ref<number>(props.transaction ? Number(props.transaction.fxRate) : 1)
const merchantName = ref(props.transaction?.merchantName ?? '')
const categoryId = ref(props.transaction?.categoryId ?? '')
const description = ref(props.transaction?.description ?? '')
const occurredAt = ref(
  props.transaction
    ? new Date(props.transaction.occurredAt).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16)
)

const showFxRate = computed(() => currency.value !== 'MYR')

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
    console.error(err)
  }
}

watch(merchantName, (newVal) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchCategorisation(newVal)
  }, 500)
})

onMounted(() => {
  store.fetchCategories()
  if (merchantName.value) {
    fetchCategorisation(merchantName.value)
  }
})

async function handleSubmit() {
  if (amount.value === null) return

  try {
    const payload = {
      amount: amount.value,
      currency: currency.value,
      merchantName: merchantName.value || undefined,
      categoryId: categoryId.value || undefined,
      description: description.value || undefined,
      occurredAt: new Date(occurredAt.value).toISOString(),
      fxRate: showFxRate.value ? fxRate.value : undefined,
    }

    if (props.transaction) {
      await store.updateTransaction(props.transaction.id, payload)
    } else {
      await store.createTransaction(payload)
    }
    emit('close')
  } catch {
    // Error handled by store.error
  }
}
</script>

<template>
  <div 
    class="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <!-- Bottom Sheet Container -->
    <div class="fixed bottom-0 w-full max-w-2xl bg-white rounded-t-[3rem] border-t border-slate-200 p-8 pt-12 pb-14 shadow-2xl shadow-slate-200/50 transform transition-transform animate-slide-up">
      <!-- Drag Handle -->
      <div class="w-14 h-1.5 bg-slate-700/50 rounded-full absolute top-4 left-1/2 -translate-x-1/2" />

      <div class="flex justify-between items-center mb-10">
        <div>
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ isEditing ? 'Edit Spending' : 'Track Spending' }}
          </h2>
          <p class="text-slate-400 font-medium">
            {{ isEditing ? 'Update an existing record' : 'Record a new outflow stream' }}
          </p>
        </div>
        <button
          class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          @click="emit('close')"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
            d="M6 18L18 6M6 6l12 12"
          /></svg>
        </button>
      </div>

      <form
        class="space-y-8"
        @submit.prevent="handleSubmit"
      >
        <!-- Value & Unit -->
        <div class="grid grid-cols-3 gap-5">
          <div class="col-span-2 space-y-2">
            <label class="premium-label">Amount</label>
            <input 
              v-model="amount" 
              type="number" 
              step="0.01" 
              required
              placeholder="0.00"
              class="premium-input text-2xl py-5"
            >
          </div>
          <div class="space-y-2">
            <label class="premium-label">Currency</label>
            <div class="relative">
              <select
                v-model="currency"
                class="premium-input appearance-none py-5 pr-10"
              >
                <option>MYR</option><option>SGD</option><option>IDR</option><option>USD</option><option>THB</option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M19 9l-7 7-7-7"
                /></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic FX Multiplier -->
        <div
          v-if="showFxRate"
          class="space-y-2 animate-fade-in"
        >
          <label class="premium-label text-blue-400 uppercase tracking-widest text-[10px]">Exchange Multiplier (1 {{ currency }} to MYR)</label>
          <input
            v-model="fxRate"
            type="number"
            step="0.0001"
            required
            class="premium-input border-blue-500/20 bg-blue-500/5"
          >
        </div>

        <!-- Classification -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="premium-label">Merchant Name</label>
            <input
              v-model="merchantName"
              type="text"
              maxlength="255"
              placeholder="e.g. Starbucks..."
              class="premium-input"
            >
          </div>

          <div class="space-y-2">
            <label class="premium-label">Category</label>
            <div class="relative">
              <select
                v-model="categoryId"
                required
                class="premium-input appearance-none pr-10"
              >
                <option value="">
                  Select Classification
                </option>
                <option
                  v-for="cat in store.categories"
                  :key="cat.id"
                  :value="cat.id"
                >
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
              <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M19 9l-7 7-7-7"
                /></svg>
              </div>
            </div>

            <CategorySuggestion
              v-if="categorisation"
              :categorisation="categorisation"
              :categories="store.categories"
              @apply="categoryId = $event"
            />
          </div>
        </div>

        <!-- Metadata -->
        <div class="space-y-2">
          <label class="premium-label">Description</label>
          <input
            v-model="description"
            type="text"
            maxlength="500"
            placeholder="Notes (optional)..."
            class="premium-input"
          >
        </div>

        <!-- Timestamp -->
        <div class="space-y-2">
          <label class="premium-label">Date & Time</label>
          <input
            v-model="occurredAt"
            type="datetime-local"
            required
            class="premium-input"
          >
        </div>

        <!-- Protocol Error -->
        <div
          v-if="store.error"
          class="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-wider"
        >
          System Error: {{ store.error }}
        </div>

        <!-- Transmission -->
        <button 
          type="submit" 
          :disabled="store.submitting"
          class="w-full py-5 bg-white text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 active:scale-[0.98] transition-all disabled:opacity-30 shadow-2xl shadow-slate-200/50 shadow-white/5 mt-4"
        >
          {{ store.submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Transaction' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.premium-input {
  @apply w-full bg-slate-100 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold 
         placeholder-slate-600 outline-none transition-all duration-300
         focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:bg-slate-800/60;
}
.premium-label {
  @apply block text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1;
}
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
