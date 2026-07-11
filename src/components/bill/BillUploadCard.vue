<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  uploading: boolean
}>()

const emit = defineEmits<{
  (event: 'upload', file: File): void
}>()

const selectedFile = ref<File | null>(null)

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function submit() {
  if (selectedFile.value) {
    emit('upload', selectedFile.value)
  }
}
</script>

<template>
  <form
    class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
    @submit.prevent="submit"
  >
    <div>
      <h2 class="text-xl font-black text-slate-900">
        Scan receipt
      </h2>
      <p class="mt-1 text-sm leading-6 text-slate-500">
        Upload a receipt image to create an item-level split.
      </p>
    </div>

    <label class="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/50">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <svg
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      </div>
      <input
        type="file"
        accept="image/*"
        class="sr-only"
        @change="selectFile"
      >
      <span class="text-sm font-bold text-slate-900">
        {{ selectedFile ? selectedFile.name : 'Choose receipt image' }}
      </span>
      <span class="mt-1 text-xs font-semibold text-slate-500">
        JPG, PNG, or camera capture
      </span>
    </label>

    <button
      type="submit"
      :disabled="!selectedFile || uploading"
      class="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
    >
      {{ uploading ? 'Reading receipt...' : 'Create split' }}
    </button>
  </form>
</template>
