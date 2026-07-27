<script setup lang="ts">
defineProps<{
  message: string
  referenceId?: string | null
}>()
</script>

<template>
  <div
    role="alert"
    class="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
  >
    <div class="flex items-center gap-3">
      <span
        class="h-2 w-2 shrink-0 rounded-full bg-red-500"
        aria-hidden="true"
      />
      <span>{{ message }}</span>
    </div>
    <p
      v-if="referenceId"
      class="mt-2 pl-5 text-xs font-medium text-red-600"
    >
      Reference ID:
      <code>{{ referenceId }}</code>
    </p>
  </div>
</template>
