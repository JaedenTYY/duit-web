<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillStore } from '@/stores/bill'
import { useReceiptStore, type ConfirmExtractionPayload } from '@/stores/receipt'
import { useTransactionStore } from '@/stores/transaction'
import ReceiptUploadStep from './ReceiptUploadStep.vue'
import ReceiptReviewStep from './ReceiptReviewStep.vue'
import { useDialogFocusManagement } from '@/composables/useDialogFocusManagement'

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
const dialogRef = ref<HTMLElement | null>(null)
const isWorking = computed(() => receiptStore.uploading || receiptStore.confirming || billStore.uploading)
const currentError = computed(() => receiptStore.error || billStore.error)
const workingLabel = computed(() => {
  if (billStore.uploading) return 'Creating bill split...'
  return receiptStore.uploading ? 'Scanning receipt...' : 'Saving transaction...'
})

useDialogFocusManagement(dialogRef, {
  onEscape: closeModal,
  canClose: () => !isWorking.value,
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
  if (receiptStore.confirming) return
  try {
    const newTransaction = await receiptStore.confirmExtraction(payload)
    transactionStore.recordCreatedTransaction(newTransaction)
    await transactionStore.reconcileAfterFinancialMutation()
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
  if (isWorking.value) return
  receiptStore.reset()
  billStore.error = null
  emit('close')
}
</script>

<template><Teleport to="body"><div class="receipt-layer" @click.self="closeModal"><div ref="dialogRef" role="dialog" aria-modal="true" aria-labelledby="receipt-dialog-title" tabindex="-1" class="receipt-sheet"><div class="receipt-head"><div><p>{{ step === 'upload' ? 'Capture' : step === 'choose' ? 'Receipt ready' : step === 'reviewing' ? 'Review' : 'Done' }}</p><h2 id="receipt-dialog-title">{{ step === 'upload' ? 'Scan a receipt' : step === 'choose' ? 'What would you like to do?' : step === 'reviewing' ? 'Review receipt details' : 'Receipt saved' }}</h2></div><button type="button" aria-label="Close receipt scanner" :disabled="isWorking" @click="closeModal">×</button></div><div class="receipt-content"><div v-if="isWorking" class="receipt-working" role="status"><span class="receipt-spinner" aria-hidden="true" /><strong>{{ workingLabel }}</strong><p>Keep this sheet open while Duit reads the details.</p></div><p v-if="currentError" role="alert" class="receipt-error">{{ currentError }}</p><template v-if="step === 'upload'"><p class="receipt-help">Take a clear photo or choose a receipt image. You'll check the details before saving.</p><ReceiptUploadStep action-label="Continue" @file-selected="handleFileSelected" /></template><template v-else-if="step === 'choose'"><p class="receipt-help">{{ selectedFile?.name }} is ready.</p><button type="button" class="receipt-choice" @click="handleAddExpense"><span class="receipt-choice-icon">＋</span><span><strong>Add an expense</strong><small>Review merchant, amount, date, and category.</small></span><b>›</b></button><button type="button" class="receipt-choice" @click="handleSplitBill"><span class="receipt-choice-icon">≡</span><span><strong>Split this bill</strong><small>Let friends choose items from the receipt.</small></span><b>›</b></button><button type="button" class="receipt-back" @click="handleBack">Choose another image</button></template><ReceiptReviewStep v-else-if="step === 'reviewing' && receiptStore.extraction" :extraction="receiptStore.extraction" :categories="transactionStore.categories" :confirming="receiptStore.confirming" @confirm="handleConfirm" @back="handleBack" /><div v-else-if="step === 'done'" class="receipt-done"><span>✓</span><h3>Saved to Activity</h3><p>You can edit this expense whenever you need to.</p></div></div></div></div></Teleport></template>
<style scoped>.receipt-layer{position:fixed;z-index:120;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgb(28 27 25 / 48%)}.receipt-sheet{position:relative;display:flex;flex-direction:column;width:100%;max-width:560px;max-height:94dvh;overflow:hidden;border-radius:22px 22px 0 0;background:#fff}.receipt-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:22px 20px 12px;border-bottom:1px solid var(--rule)}.receipt-head p{margin:0 0 4px;color:var(--accent);font-size:12px;font-weight:600}.receipt-head h2{margin:0;font-size:21px}.receipt-head button{width:44px;height:44px;flex:none;border:0;background:transparent;color:var(--muted);font-size:28px}.receipt-content{position:relative;overflow-y:auto;padding:20px 20px calc(26px + env(safe-area-inset-bottom))}.receipt-help{margin:0 0 18px;color:var(--muted);font-size:13px;line-height:20px}.receipt-working{position:absolute;z-index:5;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgb(255 255 255 / 95%);text-align:center}.receipt-working strong{font-size:15px}.receipt-working p{color:var(--muted);font-size:13px}.receipt-spinner{width:34px;height:34px;margin-bottom:15px;border:3px solid var(--accent-tint);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.receipt-error{padding:12px;border:1px solid #E9A5A0;border-radius:9px;background:#FBE4E1;color:#8D1D18;font-size:13px}.receipt-choice{display:flex;align-items:center;gap:12px;width:100%;min-height:76px;padding:10px 0;border:0;border-bottom:1px solid var(--rule);background:transparent;text-align:left}.receipt-choice-icon{display:grid;place-items:center;width:42px;height:42px;flex:none;border-radius:10px;background:var(--accent-tint);color:var(--accent);font-size:22px}.receipt-choice>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:4px}.receipt-choice strong{font-size:14px;font-weight:600}.receipt-choice small{color:var(--muted);font-size:12px}.receipt-choice b{color:var(--accent);font-size:22px;font-weight:400}.receipt-back{min-height:44px;margin-top:14px;border:0;background:transparent;color:var(--accent);font-size:13px;font-weight:600}.receipt-done{text-align:center;padding:40px 10px}.receipt-done span{display:grid;place-items:center;width:56px;height:56px;margin:auto;border-radius:14px;background:var(--accent-tint);color:var(--accent);font-size:30px}.receipt-done h3{margin:18px 0 5px;font-size:20px}.receipt-done p{color:var(--muted);font-size:13px}@media(min-width:700px){.receipt-layer{align-items:center}.receipt-sheet{max-height:88dvh;border-radius:16px}}</style>
