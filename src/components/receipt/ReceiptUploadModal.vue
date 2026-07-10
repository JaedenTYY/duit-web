<script setup lang="ts">
import { ref } from 'vue'
import { useReceiptStore, type ConfirmExtractionPayload } from '@/stores/receipt'
import { useTransactionStore } from '@/stores/transaction'
import ReceiptUploadStep from './ReceiptUploadStep.vue'
import ReceiptReviewStep from './ReceiptReviewStep.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const receiptStore = useReceiptStore()
const transactionStore = useTransactionStore()

const step = ref<'upload' | 'reviewing' | 'done'>('upload')
const selectedFile = ref<File | null>(null)

async function handleFileSelected(file: File) {
  selectedFile.value = file
  try {
    await receiptStore.uploadReceipt(file)
    step.value = 'reviewing'
  } catch {
    // Error handled by receiptStore.error
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
  step.value = 'upload'
  receiptStore.reset()
}

function closeModal() {
  receiptStore.reset()
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
          v-if="receiptStore.uploading || receiptStore.confirming"
          class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm"
        >
          <div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p class="font-black text-slate-950">
            {{ receiptStore.uploading ? 'Scanning receipt...' : 'Saving transaction...' }}
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
                  Scan receipt
                </h2>
                <p class="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Upload a clear photo and review the extracted transaction before saving.
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
              v-if="receiptStore.error"
              class="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              {{ receiptStore.error }}
            </div>

            <ReceiptUploadStep @file-selected="handleFileSelected" />
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
