<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <section class="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
      <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 class="text-xl font-black text-slate-900">
      {{ title }}
    </h3>
    <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {{ message }}
    </p>
  </section>
</template>
