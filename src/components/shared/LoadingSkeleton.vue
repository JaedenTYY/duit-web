<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  variant?: 'cards' | 'list'
}>(), {
  rows: 3,
  variant: 'cards',
})
</script>

<template>
  <div
    class="grid gap-4"
    :class="variant === 'cards' ? 'sm:grid-cols-2' : ''"
    aria-label="Loading"
  >
    <div
      v-for="row in rows"
      :key="row"
      class="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div class="h-4 w-24 rounded-full bg-slate-100" />
      <div class="mt-4 h-7 w-2/3 rounded-full bg-slate-100" />
      <div class="mt-5 space-y-2">
        <div class="h-3 rounded-full bg-slate-100" />
        <div class="h-3 w-4/5 rounded-full bg-slate-100" />
      </div>
    </div>
  </div>
</template>
