<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string
  description?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'slate'
}>(), {
  tone: 'blue',
})

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
}
const cardToneClasses = {
  blue: 'from-white via-blue-50 to-cyan-50',
  emerald: 'from-white via-emerald-50 to-teal-50',
  amber: 'from-white via-amber-50 to-orange-50',
  slate: 'from-white via-slate-50 to-blue-50',
}
</script>

<template>
  <article
    class="rounded-[2rem] border border-white/80 bg-gradient-to-br p-5 shadow-lg shadow-slate-200/60"
    :class="cardToneClasses[tone]"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {{ label }}
        </p>
        <p class="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
          {{ value }}
        </p>
        <p
          v-if="description"
          class="mt-1 truncate text-sm font-medium text-slate-500"
        >
          {{ description }}
        </p>
      </div>
      <div
        v-if="$slots.icon"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1"
        :class="toneClasses[tone]"
      >
        <slot name="icon" />
      </div>
    </div>
  </article>
</template>
