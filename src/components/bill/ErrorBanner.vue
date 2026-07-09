<script setup lang="ts">
defineProps<{
  message: string | null
}>()
</script>

<template>
  <div
    v-if="message"
    class="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/50 px-5 py-4 text-sm font-semibold text-red-700 backdrop-blur shadow-sm"
    role="alert"
  >
    <svg class="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {{ message }}
  </div>
</template>
