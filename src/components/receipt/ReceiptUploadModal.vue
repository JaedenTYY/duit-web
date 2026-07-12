<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillStore } from '@/stores/bill'
import { useReceiptStore, type ConfirmExtractionPayload } from '@/stores/receipt'
import { useTransactionStore } from '@/stores/transaction'
import ReceiptUploadStep from './ReceiptUploadStep.vue'
import ReceiptReviewStep from './ReceiptReviewStep.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const router = useRouter()
const billStore = useBillStore()
const receiptStore = useReceiptStore()
const transactionStore = useTransactionStore()

const step = ref<'upload' | 'choose' | 'reviewing' | 'done'>('upload')
const selectedFile = ref<File | null>(null)
const isWorking = computed(() => receiptStore.uploading || receiptStore.confirming || billStore.uploading)
const currentError = computed(() => receiptStore.error || billStore.error)
const workingLabel = computed(() => {
  if (billStore.uploading) return 'Creating bill split...'
  return receiptStore.uploading ? 'Scanning receipt...' : 'Saving transaction...'
})

function handleFileSelected(file: File) {
  selectedFile.value = file
  receiptStore.reset()
  billStore.error = null
  step.value = 'choose'
}

async function handleAddExpense() {
  if (!selectedFile.value) return

  try {
    await receiptStore.uploadReceipt(selectedFile.value)
    step.value = 'reviewing'
  } catch {
    // Error handled by receiptStore.error
  }
}

async function handleSplitBill() {
  if (!selectedFile.value) return

  try {
    const bill = await billStore.createFromReceipt(selectedFile.value)
    emit('success')
    emit('close')
    router.push({ name: 'owner-bill-split', params: { id: bill.id } })
  } catch {
    // Error handled by billStore.error
  }
}

async function handleConfirm(payload: ConfirmExtractionPayload) {
  try {
    const newTransaction = await receiptStore.confirmExtraction(payload)
    transactionStore.transactions = [newTransaction, ...transactionStore.transactions]
    step.value = 'done'
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 1500)
  } catch {
    // Error handled by receiptStore.error
  }
}

function handleBack() {
  if (step.value === 'reviewing' && selectedFile.value) {
    step.value = 'choose'
    receiptStore.reset()
    return
  }

  step.value = 'upload'
  selectedFile.value = null
  receiptStore.reset()
  billStore.error = null
}

function closeModal() {
  receiptStore.reset()
  billStore.error = null
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
      @click.self="closeModal"
    >
      <div class="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/20 sm:max-h-[88vh]">
        <!-- Loading Overlay -->
        <div
          v-if="isWorking"
          class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm"
        >
          <div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p class="font-black text-slate-950">
            {{ workingLabel }}
          </p>
          <p class="mt-1 text-sm font-medium text-slate-500">
            Keep this sheet open while Duit reads the details.
          </p>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto p-5 sm:p-8">
          <div v-if="step === 'upload'">
            <div class="mb-6 flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Receipt capture
                </p>
                <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  Scan or upload receipt
                </h2>
                <p class="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Add a clear photo first. Then choose whether to save it as an expense or create a bill split.
                </p>
              </div>
              <button
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close receipt scanner"
                @click="closeModal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div
              v-if="currentError"
              class="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {{ currentError }}
            </div>

            <ReceiptUploadStep
              action-label="Continue"
              @file-selected="handleFileSelected"
            />
          </div>

          <div v-else-if="step === 'choose'">
            <div class="mb-6 flex items-start justify-between gap-4">
              <div>
                <p class="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Receipt ready
                </p>
                <h2 class="mt-1 text-2xl font-black tracking-tight text-slate-950">
                  What should Duit do with it?
                </h2>
                <p class="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Choose one path. Duit will only call the API needed for that action.
                </p>
              </div>
              <button
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close receipt scanner"
                @click="closeModal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div
              v-if="currentError"
              class="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {{ currentError }}
            </div>

            <div class="space-y-3">
              <button
                type="button"
                class="flex w-full items-center gap-4 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-100/70 active:scale-[0.99]"
                @click="handleAddExpense"
              >
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.3"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8 7h8M8 11h8M8 15h4M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 0 1 1-1Z"
                    />
                  </svg>
                </span>
                <span class="min-w-0">
                  <span class="block text-base font-black text-slate-950">Add to expenses</span>
                  <span class="mt-1 block text-sm font-semibold leading-5 text-slate-600">
                    Extract merchant, total, date, and category for your transaction list.
                  </span>
                </span>
              </button>

              <button
                type="button"
                class="flex w-full items-center gap-4 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4 text-left transition hover:border-amber-200 hover:bg-amber-100/70 active:scale-[0.99]"
                @click="handleSplitBill"
              >
                <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
                  <svg
                    class="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.3"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M21 20v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M17 3.13a4 4 0 0 1 0 7.75"
                    />
                  </svg>
                </span>
                <span class="min-w-0">
                  <span class="block text-base font-black text-slate-950">Split bill</span>
                  <span class="mt-1 block text-sm font-semibold leading-5 text-slate-600">
                    Create item choices, share a guest link, and track who has settled.
                  </span>
                </span>
              </button>
            </div>

            <button
              type="button"
              class="mt-5 min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              @click="handleBack"
            >
              Choose another image
            </button>
          </div>

          <div v-else-if="step === 'reviewing' && receiptStore.extraction">
            <ReceiptReviewStep
              :extraction="receiptStore.extraction"
              :categories="transactionStore.categories"
              @confirm="handleConfirm"
              @back="handleBack"
            />
          </div>

          <div
            v-else-if="step === 'done'"
            class="text-center py-12"
          >
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-50 text-4xl text-emerald-600">
              ✓
            </div>
            <h2 class="mb-2 text-2xl font-black tracking-tight text-slate-950">
              Receipt saved
            </h2>
            <p class="font-medium text-slate-500">
              Transaction has been added to your list.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
