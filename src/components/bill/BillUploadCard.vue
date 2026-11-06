<script setup lang="ts">
import { ref } from 'vue'
import { RECEIPT_IMAGE_ACCEPT, validateReceiptImageFile } from '@/utils/receiptFile'

defineProps<{
  uploading: boolean
}>()

const emit = defineEmits<{
  (event: 'upload', file: File): void
}>()

const selectedFile = ref<File | null>(null)
const validationError = ref<string | null>(null)

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (!file) {
    selectedFile.value = null
    validationError.value = null
    return
  }

  const error = validateReceiptImageFile(file)
  if (error) {
    selectedFile.value = null
    validationError.value = error
    input.value = ''
    return
  }

  selectedFile.value = file
  validationError.value = null
}

function submit() {
  if (selectedFile.value) {
    emit('upload', selectedFile.value)
  }
}
</script>

<template>
  <form class="bill-upload" @submit.prevent="submit">
    <h2>Add a receipt</h2><p>Take a photo or choose an image. You can review the result before sharing.</p>
    <label class="bill-drop"><input type="file" :accept="RECEIPT_IMAGE_ACCEPT" class="sr-only" @change="selectFile"><span class="bill-upload-icon" aria-hidden="true">↥</span><strong>{{ selectedFile ? selectedFile.name : 'Choose receipt image' }}</strong><small>JPEG, PNG, or WebP · up to 10 MB</small></label>
    <p v-if="validationError" class="bill-upload-error" role="alert">{{ validationError }}</p>
    <button type="submit" :disabled="!selectedFile || uploading || !!validationError">{{ uploading ? 'Reading receipt…' : 'Create split' }}</button>
  </form>
</template>
<style scoped>
.bill-upload { padding:24px; border:1px solid var(--rule); border-radius:16px; background:#fff; }
.bill-upload h2 { margin:0; font-size:19px; }
.bill-upload > p { margin:7px 0 22px; color:var(--muted); font-size:13px; line-height:20px; }
.bill-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:200px; padding:20px; border:1px dashed #B6B1A7; border-radius:12px; background:var(--paper); cursor:pointer; text-align:center; }
.bill-drop:focus-within { outline:2px solid var(--accent); outline-offset:2px; }
.bill-upload-icon { display:grid; place-items:center; width:42px; height:42px; margin-bottom:14px; border-radius:10px; background:var(--accent-tint); color:var(--accent); font-size:27px; }
.bill-drop strong { max-width:100%; overflow-wrap:anywhere; font-size:14px; font-weight:600; }
.bill-drop small { margin-top:5px; color:var(--muted); font-size:12px; }
.bill-upload button { width:100%; min-height:52px; margin-top:20px; border:0; border-radius:10px; background:var(--accent); color:#fff; font-size:14px; font-weight:600; }
.bill-upload button:disabled { opacity:.45; }
.bill-upload-error { color:#A34437 !important; }
</style>
