<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <p
        v-if="eyebrow"
        class="text-xs font-bold uppercase tracking-[0.18em] text-blue-600"
      >
        {{ eyebrow }}
      </p>
      <h1 class="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base"
      >
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.actions"
      class="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
