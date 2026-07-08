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
    class="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50"
    @submit.prevent="submit"
  >
    <div>
      <h2 class="text-lg font-bold text-slate-900">
        Scan receipt
      </h2>
      <p class="mt-1 text-sm leading-6 text-slate-500">
        Upload a receipt image to create an item-level split.
      </p>
    </div>

    <label class="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
      <input
        type="file"
        accept="image/*"
        class="sr-only"
        @change="selectFile"
      >
      <span class="text-sm font-bold text-slate-900">
        {{ selectedFile ? selectedFile.name : 'Choose receipt image' }}
      </span>
      <span class="mt-1 text-xs font-medium text-slate-500">
        JPG, PNG, or camera capture
      </span>
    </label>

    <button
      type="submit"
      :disabled="!selectedFile || uploading"
      class="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {{ uploading ? 'Reading receipt...' : 'Create split' }}
    </button>
  </form>
</template>
