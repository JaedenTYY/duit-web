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

<template><div class="transaction-layer" @click.self="requestClose"><section ref="dialogRef" role="dialog" aria-modal="true" aria-labelledby="transaction-dialog-title" tabindex="-1" class="transaction-sheet"><div class="add-sheet-handle" /><header class="transaction-sheet-head"><div><p>{{ isEditing ? 'Activity' : 'New expense' }}</p><h2 id="transaction-dialog-title">{{ isEditing ? 'Edit transaction' : 'Add an expense' }}</h2></div><button type="button" :disabled="store.submitting" aria-label="Close transaction dialog" @click="requestClose">×</button></header><form @submit.prevent="handleSubmit"><p v-if="financialError" role="alert" class="transaction-error">{{ financialError }}</p><p v-if="store.error" role="alert" class="transaction-error">{{ store.error }}</p><div class="transaction-fields"><div class="transaction-amount-grid"><div><label for="transaction-amount">Amount</label><input id="transaction-amount" v-model="amount" name="amount" type="text" inputmode="decimal" autocomplete="off" required placeholder="0.00"></div><div><label for="transaction-currency">Currency</label><select id="transaction-currency" v-model="currency"><option>MYR</option><option>SGD</option><option>IDR</option><option>USD</option><option>THB</option></select></div></div><div v-if="showFxRate"><label for="transaction-rate">Exchange rate to MYR</label><input id="transaction-rate" v-model="fxRate" type="text" inputmode="decimal" autocomplete="off" required></div><div><label for="transaction-merchant">Merchant</label><input v-if="!isEditing" id="transaction-merchant" v-model="merchantName" type="text" maxlength="255" placeholder="e.g. Village Grocer"><p v-else id="transaction-merchant" class="transaction-fixed">{{ merchantName || 'No merchant recorded' }}<small>Merchant cannot be changed for this record.</small></p></div><div><label for="transaction-category">Category</label><select id="transaction-category" v-model="categoryId" required><option value="">Choose a category</option><option v-for="cat in store.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option></select><CategorySuggestion v-if="categorisation" :categorisation="categorisation" :categories="store.categories" @apply="categoryId = $event" @forget="forgetPreference" /><p v-if="categorisationStatus" role="status" aria-live="polite" class="transaction-hint">{{ categorisationStatus }}</p></div><label v-if="canRememberMerchantCategory" class="transaction-remember"><input v-model="rememberMerchantCategory" type="checkbox"><span>Use this category next time for this merchant</span></label><div><label for="transaction-note">Note <span>(optional)</span></label><input id="transaction-note" v-model="description" type="text" maxlength="500" placeholder="Add a note"></div><div><label for="transaction-date">Date and time</label><input id="transaction-date" v-model="occurredAt" type="datetime-local" required></div></div><div class="transaction-save"><button type="submit" :disabled="store.submitting">{{ store.submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Save expense' }}</button></div></form></section></div></template>
<style scoped>.transaction-layer{position:fixed;z-index:100;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgb(28 27 25 / 45%)}.transaction-sheet{width:100%;max-width:580px;max-height:92dvh;overflow:auto;padding:8px 20px calc(20px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#fff}.transaction-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:10px 0 20px}.transaction-sheet-head p{margin:0 0 4px;color:var(--accent);font-size:12px;font-weight:600}.transaction-sheet-head h2{margin:0;font-size:21px}.transaction-sheet-head button{width:44px;height:44px;border:0;background:transparent;color:var(--muted);font-size:28px}.transaction-fields{display:flex;flex-direction:column;gap:17px}.transaction-fields label:not(.transaction-remember){display:block;margin-bottom:6px;font-size:13px;font-weight:600}.transaction-fields label span{color:var(--muted);font-weight:400}.transaction-fields input:not([type=checkbox]),.transaction-fields select{width:100%;min-height:48px;padding:10px 12px;border:1px solid #D2CEC5;border-radius:9px;background:#fff;color:var(--ink);font-size:15px}.transaction-fields input::placeholder{color:#8D8880}.transaction-amount-grid{display:grid;grid-template-columns:minmax(0,1fr) 100px;gap:10px}.transaction-remember{display:flex;align-items:flex-start;gap:10px;color:var(--muted);font-size:13px}.transaction-remember input{width:18px;height:18px;accent-color:var(--accent)}.transaction-fixed{margin:0;padding:12px;border-radius:9px;background:var(--paper);font-size:14px}.transaction-fixed small{display:block;margin-top:4px;color:var(--muted);font-size:12px}.transaction-hint{margin:6px 0;color:var(--muted);font-size:12px}.transaction-error{padding:12px;border-radius:9px;background:#FBE4E1;color:#8D1D18;font-size:13px}.transaction-save{position:sticky;bottom:-20px;margin:20px -20px -20px;padding:14px 20px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--rule);background:#fff}.transaction-save button{width:100%;min-height:50px;border:0;border-radius:9px;background:var(--accent);color:#fff;font-size:14px;font-weight:600}.transaction-save button:disabled{opacity:.5}@media(min-width:700px){.transaction-layer{align-items:center}.transaction-sheet{border-radius:16px;max-height:88dvh}}</style>
