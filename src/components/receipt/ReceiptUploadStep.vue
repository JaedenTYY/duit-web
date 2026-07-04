<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const emit = defineEmits<{
  (e: 'fileSelected', file: File): void
}>()

const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const previewContainer = ref<HTMLElement | null>(null)

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    selectFile(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    selectFile(file)
  }
}

function selectFile(file: File) {
  selectedFile.value = file
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  
  // Animation for preview
  setTimeout(() => {
    if (previewContainer.value) {
      gsap.from(previewContainer.value, {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: 'back.out(1.7)'
      })
    }
  }, 0)
}

function removeFile() {
  selectedFile.value = null
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
  <div class="space-y-6">
    <div 
      v-if="!selectedFile"
      class="relative group"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input 
        type="file" 
        accept="image/*" 
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        @change="handleFileChange"
      >
      <div 
        class="border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300"
        :class="isDragging ? 'border-duit-primary bg-duit-light' : 'border-gray-200 group-hover:border-duit-primary/50'"
      >
        <div class="w-16 h-16 bg-duit-light rounded-full flex items-center justify-center mx-auto mb-4 text-duit-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
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
        <h3 class="text-lg font-bold text-duit-dark mb-1">
          Drop your receipt here
        </h3>
        <p class="text-duit-mid text-sm">
          or click to browse from your device
        </p>
      </div>
    </div>

    <div
      v-else
      ref="previewContainer"
      class="space-y-4"
    >
      <div class="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
        <img
          :src="previewUrl ?? undefined"
          class="w-full h-64 object-contain mx-auto"
          alt="Receipt preview"
        >
        <button 
          class="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full text-duit-danger shadow-sm hover:bg-white transition-colors"
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

      <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
        <div class="min-w-0">
          <p class="text-sm font-bold text-duit-dark truncate">
            {{ selectedFile.name }}
          </p>
          <p class="text-xs text-duit-mid">
            {{ formatSize(selectedFile.size) }}
          </p>
        </div>
        <button 
          class="bg-duit-primary text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-duit-primary/20"
          @click="handleScan"
        >
          Scan Receipt
        </button>
      </div>
    </div>
  </div>
</template>
