<script setup lang="ts">
import { ref } from 'vue'
import { useReceiptStore, type ConfirmExtractionPayload } from '@/stores/receipt'
import { useTransactionStore } from '@/stores/transaction'
import ReceiptUploadStep from './ReceiptUploadStep.vue'
import ReceiptReviewStep from './ReceiptReviewStep.vue'

const emit = defineEmits<{
  (e: 'close'): void
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
</script>

<template>
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duit-dark/60 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden">
      <!-- Loading Overlay -->
      <div 
        v-if="receiptStore.uploading || receiptStore.confirming"
        class="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
      >
        <div class="w-12 h-12 border-4 border-duit-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p class="font-bold text-duit-dark">
          {{ receiptStore.uploading ? 'Scanning receipt...' : 'Saving transaction...' }}
        </p>
      </div>

      <!-- Content -->
      <div class="p-8">
        <div v-if="step === 'upload'">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-duit-dark">
              Scan Receipt
            </h2>
            <button
              class="text-duit-mid hover:text-duit-dark"
              @click="emit('close')"
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
            class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-duit-danger text-sm"
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
          <div class="w-20 h-20 bg-duit-success/10 text-duit-success rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            ✓
          </div>
          <h2 class="text-2xl font-bold text-duit-dark mb-2">
            Receipt Saved!
          </h2>
          <p class="text-duit-mid">
            Transaction has been added to your list.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
