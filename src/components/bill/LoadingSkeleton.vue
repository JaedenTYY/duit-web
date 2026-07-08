<template>
  <div class="space-y-4">
    <div class="h-28 animate-pulse rounded-3xl bg-white border border-slate-100" />
    <div class="grid gap-3 sm:grid-cols-2">
      <div
        v-for="item in 4"
        :key="item"
        class="h-24 animate-pulse rounded-2xl bg-white border border-slate-100"
      />
    </div>
  </div>
</template>
