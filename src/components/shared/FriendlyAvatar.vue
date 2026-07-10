<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  tone?: 'blue' | 'emerald' | 'amber' | 'rose'
}>(), {
  size: 'md',
  tone: 'blue',
})

const sizeClasses = {
  sm: 'h-14 w-14',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
}

const toneClasses = {
  blue: 'from-blue-100 via-sky-50 to-indigo-100 text-blue-700',
  emerald: 'from-emerald-100 via-teal-50 to-blue-100 text-emerald-700',
  amber: 'from-amber-100 via-orange-50 to-rose-100 text-amber-700',
  rose: 'from-rose-100 via-pink-50 to-orange-100 text-rose-700',
}
</script>

<template>
  <div
    class="relative shrink-0 overflow-hidden rounded-[1.75rem] bg-gradient-to-br shadow-sm ring-1 ring-white/70"
    :class="[sizeClasses[size], toneClasses[tone]]"
    aria-hidden="true"
  >
    <div class="absolute -right-4 -top-5 h-14 w-14 rounded-full bg-white/55" />
    <div class="absolute -bottom-5 -left-4 h-16 w-16 rounded-full bg-white/45" />
    <div class="absolute inset-x-0 bottom-3 mx-auto h-7 w-12 rounded-full bg-current/10" />
    <div class="absolute left-1/2 top-1/2 h-9 w-11 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-sm">
      <div class="absolute left-2.5 top-3 h-1.5 w-1.5 rounded-full bg-current" />
      <div class="absolute right-2.5 top-3 h-1.5 w-1.5 rounded-full bg-current" />
      <div class="absolute bottom-2.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-current/35" />
    </div>
    <div class="absolute right-3 top-3 h-3 w-3 rounded-full bg-current/25" />
  </div>
</template>
