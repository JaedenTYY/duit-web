<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, CategorisationResult } from '@/types'
import { logger } from '@/utils/logger'
import CategorySuggestion from './CategorySuggestion.vue'
import { useMerchantCategorisation } from '@/composables/useMerchantCategorisation'
import type {
  CreateTransactionRequestCurrency,
  UpdateTransactionRequestCurrency,
} from '@/api/generated/model'
import { normalizeDecimalInput, validateAmountInput, validateFxRateInput } from '@/utils/financialDecimal'
import { instantToLocalDateTimeInput, localDateTimeInputToInstant } from '@/utils/localDateTime'
import {
  createTransactionOperationIdentity,
  transactionOperationExpired,
} from '@/utils/transactionOperation'
import { useDialogFocusManagement } from '@/composables/useDialogFocusManagement'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const props = defineProps<{
  transaction?: Transaction | null
}>()

const store = useTransactionStore()
const {
  categoriseMerchant,
  forgetMerchantCategoryPreference,
} = useMerchantCategorisation()

const isEditing = computed(() => Boolean(props.transaction))
const amount = ref(props.transaction?.amount ?? '')
const currency = ref(props.transaction?.currency ?? 'MYR')
const fxRate = ref(props.transaction?.fxRate ?? '1.000000')
const merchantName = ref(props.transaction?.merchantName ?? '')
const categoryId = ref(props.transaction?.categoryId ?? '')
const description = ref(props.transaction?.description ?? '')
const rememberMerchantCategory = ref(false)
const categorisationStatus = ref('')
const financialError = ref('')
const expectedVersion = ref(props.transaction?.version ?? 0)
const operation = createTransactionOperationIdentity()
const occurredAt = ref(
  props.transaction
    ? instantToLocalDateTimeInput(props.transaction.occurredAt)
    : instantToLocalDateTimeInput(new Date().toISOString())
)

const showFxRate = computed(() => currency.value !== 'MYR')
const canRememberMerchantCategory = computed(() => {
  if (!merchantName.value.trim() || !categoryId.value) return false
  return !props.transaction || categoryId.value !== (props.transaction.categoryId ?? '')
})

const categorisation = ref<CategorisationResult | null>(null)
const dialogRef = ref<HTMLElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout>
let categorisationGeneration = 0

useDialogFocusManagement(dialogRef, {
  onEscape: requestClose,
  canClose: () => !store.submitting,
})

async function fetchCategorisation(name: string) {
  const requestedMerchant = name.trim()
  const generation = ++categorisationGeneration
  if (!requestedMerchant) {
    categorisation.value = null
    return
  }
  try {
    const result = await categoriseMerchant(requestedMerchant)
    if (generation !== categorisationGeneration || merchantName.value.trim() !== requestedMerchant) return
    categorisation.value = result
    categorisationStatus.value = ''
  } catch (err) {
    if (generation !== categorisationGeneration || merchantName.value.trim() !== requestedMerchant) return
    categorisationStatus.value = 'Could not refresh the merchant category suggestion.'
    logger.error('Failed to fetch merchant categorisation', err)
  }
}

watch(merchantName, (newVal) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchCategorisation(newVal)
  }, 500)
})

watch([merchantName, categoryId], () => {
  if (!canRememberMerchantCategory.value) {
    rememberMerchantCategory.value = false
  }
})

watch(currency, (next, previous) => {
  if (next === 'MYR') {
    fxRate.value = '1.000000'
  } else if (next !== previous) {
    fxRate.value = ''
  }
})

onMounted(() => {
  store.fetchCategories()
  if (merchantName.value) {
    fetchCategorisation(merchantName.value)
  }
})

onUnmounted(() => {
  clearTimeout(debounceTimer)
  categorisationGeneration += 1
})

async function forgetPreference(merchantId: string) {
  try {
    await forgetMerchantCategoryPreference(merchantId)
    await fetchCategorisation(merchantName.value)
    categorisationStatus.value = 'Saved merchant category forgotten. Your selected transaction category was kept.'
  } catch (err) {
    categorisationStatus.value = 'Could not forget the saved merchant category. It is still unchanged.'
    logger.error('Failed to forget merchant category preference', err)
  }
}

async function handleSubmit() {
  const amountError = validateAmountInput(amount.value)
  const rateError = showFxRate.value ? validateFxRateInput(fxRate.value) : null
  financialError.value = amountError ?? rateError ?? ''
  if (financialError.value) return
  if (!props.transaction && transactionOperationExpired(operation)) {
    financialError.value = 'This submission is more than 24 hours old. Review transaction history before intentionally submitting it again.'
    return
  }

  try {
    const sharedPayload = {
      amount: normalizeDecimalInput(amount.value),
      currency: currency.value as CreateTransactionRequestCurrency & UpdateTransactionRequestCurrency,
      categoryId: categoryId.value || undefined,
      description: description.value || undefined,
      occurredAt: localDateTimeInputToInstant(occurredAt.value),
      fxRate: showFxRate.value ? normalizeDecimalInput(fxRate.value) : undefined,
      rememberMerchantCategory: rememberMerchantCategory.value,
    }

    if (props.transaction) {
      await store.updateTransaction(props.transaction.id, {
        ...sharedPayload,
        expectedVersion: expectedVersion.value,
      })
    } else {
      await store.createTransaction({
        ...sharedPayload,
        merchantName: merchantName.value || undefined,
      }, operation.key)
    }
    emit('close')
  } catch (error) {
    if (error instanceof Error && error.name === 'TransactionStaleConflictError') {
      const current = (error as Error & { current?: Transaction | null }).current
      if (current) applyCurrentTransaction(current)
      financialError.value = error.message
    }
  }
}

function applyCurrentTransaction(current: Transaction) {
  amount.value = current.amount
  currency.value = current.currency
  fxRate.value = current.fxRate
  categoryId.value = current.categoryId ?? ''
  description.value = current.description ?? ''
  occurredAt.value = instantToLocalDateTimeInput(current.occurredAt)
  expectedVersion.value = current.version
  rememberMerchantCategory.value = false
}

function requestClose() {
  if (store.submitting) return
  emit('close')
}
</script>

<template>
  <div 
    class="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm"
    @click.self="requestClose"
  >
    <!-- Bottom Sheet Container -->
    <div
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-dialog-title"
      tabindex="-1"
      class="fixed bottom-0 w-full max-w-2xl bg-white rounded-t-[3rem] border-t border-slate-200 p-8 pt-12 pb-14 shadow-2xl shadow-slate-200/50 transform transition-transform animate-slide-up"
    >
      <!-- Drag Handle -->
      <div class="w-14 h-1.5 bg-slate-700/50 rounded-full absolute top-4 left-1/2 -translate-x-1/2" />

      <div class="flex justify-between items-center mb-10">
        <div>
          <h2
            id="transaction-dialog-title"
            class="text-3xl font-bold text-slate-900 tracking-tight"
          >
            {{ isEditing ? 'Edit Spending' : 'Track Spending' }}
          </h2>
          <p class="text-slate-400 font-medium">
            {{ isEditing ? 'Update an existing record' : 'Record a new outflow stream' }}
          </p>
        </div>
        <button
          type="button"
          class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          :disabled="store.submitting"
          aria-label="Close transaction dialog"
          @click="requestClose"
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
        <p
          v-if="financialError"
          role="alert"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {{ financialError }}
        </p>
        <!-- Value & Unit -->
        <div class="grid grid-cols-3 gap-5">
          <div class="col-span-2 space-y-2">
            <label class="premium-label">Amount</label>
            <input 
              v-model="amount" 
              name="amount"
              type="text"
              inputmode="decimal"
              autocomplete="off"
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
            type="text"
            inputmode="decimal"
            autocomplete="off"
            required
            class="premium-input border-blue-500/20 bg-blue-500/5"
          >
        </div>

        <!-- Classification -->
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="premium-label">Merchant Name</label>
            <input
              v-if="!isEditing"
              v-model="merchantName"
              type="text"
              maxlength="255"
              placeholder="e.g. Starbucks..."
              class="premium-input"
            >
            <div
              v-else
              class="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4"
            >
              <p class="break-words text-sm font-black text-slate-900">
                {{ merchantName || 'No merchant recorded' }}
              </p>
              <p class="mt-1 text-xs font-semibold text-slate-500">
                Merchant name is fixed for existing transactions because the current API does not accept merchant edits.
              </p>
            </div>
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
              @forget="forgetPreference"
            />

            <p
              v-if="categorisationStatus"
              role="status"
              aria-live="polite"
              class="mt-2 text-xs text-slate-600"
            >
              {{ categorisationStatus }}
            </p>
          </div>

          <label
            v-if="canRememberMerchantCategory"
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
          >
            <input
              v-model="rememberMerchantCategory"
              type="checkbox"
              class="mt-0.5 h-4 w-4"
            >
            <span>Use this category for future transactions from this merchant</span>
          </label>
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
