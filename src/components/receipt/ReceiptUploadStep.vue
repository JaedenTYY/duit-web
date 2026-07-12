<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { gsap } from 'gsap'
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
const previewContainer = ref<HTMLElement | null>(null)
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

  setTimeout(() => {
    if (previewContainer.value) {
      gsap.from(previewContainer.value, {
        scale: 0.96,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }
  }, 0)
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

<template>
  <div class="space-y-5">
    <div
      v-if="!selectedFile"
      class="relative group"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        type="file"
        :accept="RECEIPT_IMAGE_ACCEPT"
        class="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        @change="handleFileChange"
      >
      <div
        class="rounded-[2rem] border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10"
        :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 group-hover:border-blue-300'"
      >
        <div class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-black tracking-tight text-slate-950">
          Add a receipt photo
        </h3>
        <p class="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-slate-600">
          Take a clear picture or choose an image from your phone. Duit will extract the spending details.
        </p>
        <div class="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200">
          Choose image
        </div>
        <p class="mx-auto mt-3 max-w-xs text-xs font-bold text-slate-500">
          JPEG, PNG, or WebP only. Max 10 MB.
        </p>
      </div>
    </div>

    <div
      v-if="validationError"
      class="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
    >
      {{ validationError }}
    </div>

    <div
      v-else
      ref="previewContainer"
      class="space-y-4"
    >
      <div class="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
        <img
          :src="previewUrl ?? undefined"
          class="mx-auto h-72 w-full object-contain"
          alt="Receipt preview"
        >
        <button
          class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition hover:bg-red-50"
          aria-label="Remove selected receipt"
          @click="removeFile"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex min-w-0 items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-black text-slate-950">
              {{ selectedFile?.name }}
            </p>
            <p class="mt-1 text-xs font-semibold text-slate-500">
              {{ selectedFile ? formatSize(selectedFile.size) : '' }}
            </p>
          </div>
          <button
            class="min-h-11 shrink-0 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
            @click="handleScan"
          >
            {{ actionLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
