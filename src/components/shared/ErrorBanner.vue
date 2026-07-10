<script setup lang="ts">
defineProps<{
  message: string | null | undefined
  actionLabel?: string
}>()

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template>
  <div
    v-if="message"
    class="flex flex-col gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 sm:flex-row sm:items-center sm:justify-between"
    role="alert"
  >
    <div class="flex items-start gap-3">
      <span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
      <p>{{ message }}</p>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="min-h-10 rounded-2xl bg-white px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-200"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
