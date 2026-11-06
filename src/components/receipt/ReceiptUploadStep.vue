<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { RECEIPT_IMAGE_ACCEPT, validateReceiptImageFile } from '@/utils/receiptFile'

const emit = defineEmits<{
  (e: 'fileSelected', file: File): void
}>()

withDefaults(defineProps<{
  actionLabel?: string
}>(), {
  actionLabel: 'Continue'
})

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const validationError = ref<string | null>(null)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    selectFile(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file) {
    selectFile(file)
  }
}

function selectFile(file: File) {
  const error = validateReceiptImageFile(file)
  if (error) {
    removeFile()
    validationError.value = error
    return
  }

  validationError.value = null
  selectedFile.value = file
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)

}

function removeFile() {
  selectedFile.value = null
  validationError.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function handleScan() {
  if (selectedFile.value) {
    emit('fileSelected', selectedFile.value)
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template><div class="receipt-upload"><div v-if="!selectedFile" class="receipt-drop" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop"><label><input type="file" :accept="RECEIPT_IMAGE_ACCEPT" @change="handleFileChange"><span class="receipt-camera" aria-hidden="true">▣</span><strong>Choose receipt image</strong><small>Take a photo or select one from your phone</small></label></div><p v-if="validationError" role="alert" class="receipt-validation">{{ validationError }}</p><div v-if="selectedFile" class="receipt-preview"><img :src="previewUrl ?? undefined" alt="Receipt preview"><div><span><strong>{{ selectedFile.name }}</strong><small>{{ formatSize(selectedFile.size) }}</small></span><button type="button" @click="removeFile">Remove</button></div><button type="button" class="receipt-continue" @click="handleScan">{{ actionLabel }}</button></div><p class="receipt-file-help">JPEG, PNG, or WebP · up to 10 MB</p></div></template>
<style scoped>.receipt-drop{border:1px dashed #B6B1A7;border-radius:12px;background:var(--paper)}.receipt-drop.dragging{border-color:var(--accent);background:var(--accent-tint)}.receipt-drop label{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:210px;cursor:pointer;text-align:center}.receipt-drop input{position:absolute;width:1px;height:1px;opacity:0}.receipt-drop:focus-within{outline:2px solid var(--accent);outline-offset:2px}.receipt-camera{display:grid;place-items:center;width:48px;height:48px;margin-bottom:16px;border-radius:11px;background:var(--accent-tint);color:var(--accent);font-size:26px}.receipt-drop strong{font-size:14px;font-weight:600}.receipt-drop small{margin-top:5px;color:var(--muted);font-size:12px}.receipt-file-help{margin:12px 0 0;color:var(--muted);font-size:12px;text-align:center}.receipt-validation{padding:12px;border-radius:9px;background:#FBE4E1;color:#8D1D18;font-size:13px}.receipt-preview>img{display:block;width:100%;max-height:260px;object-fit:contain;border:1px solid var(--rule);border-radius:10px;background:var(--paper)}.receipt-preview>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}.receipt-preview span{min-width:0}.receipt-preview strong,.receipt-preview small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.receipt-preview strong{font-size:13px}.receipt-preview small{color:var(--muted);font-size:12px}.receipt-preview>div button{min-height:44px;border:0;background:transparent;color:#A34437;font-size:13px}.receipt-continue{width:100%;min-height:50px;border:0;border-radius:9px;background:var(--accent);color:#fff;font-size:14px;font-weight:600}</style>
