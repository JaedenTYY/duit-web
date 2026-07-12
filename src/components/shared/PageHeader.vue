<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <header class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-7">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
      <div class="min-w-0">
        <p
          v-if="eyebrow"
          class="text-xs font-black uppercase text-emerald-600"
        >
          {{ eyebrow }}
        </p>
        <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-4xl">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500 sm:text-base"
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
    </div>
  </header>
</template>
