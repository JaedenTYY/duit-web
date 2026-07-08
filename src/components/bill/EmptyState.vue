<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <section class="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
    <h3 class="text-lg font-bold text-slate-900">
      {{ title }}
    </h3>
    <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
      {{ message }}
    </p>
  </section>
</template>
