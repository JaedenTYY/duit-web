<template>
  <div class="space-y-6">
    <div class="grid gap-4 sm:grid-cols-4">
      <div v-for="i in 4" :key="`stat-${i}`" class="h-28 animate-pulse rounded-3xl bg-white border border-slate-100 shadow-sm" />
    </div>
    <div class="h-64 animate-pulse rounded-3xl bg-white border border-slate-100 shadow-sm" />
    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="item in 6"
        :key="`item-${item}`"
        class="h-24 animate-pulse rounded-3xl bg-white border border-slate-100 shadow-sm"
      />
    </div>
  </div>
</template>
