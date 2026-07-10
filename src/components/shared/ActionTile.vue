<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  description: string
  to?: string
  tone?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple'
  actionLabel?: string
}>(), {
  tone: 'blue',
  actionLabel: 'Open',
})

const emit = defineEmits<{
  (event: 'click'): void
}>()

const component = computed(() => props.to ? 'RouterLink' : 'button')
const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 group-hover:border-blue-200 group-hover:bg-blue-100/70',
  emerald: 'bg-emerald-50 text-emerald-700 group-hover:border-emerald-200 group-hover:bg-emerald-100/70',
  rose: 'bg-rose-50 text-rose-700 group-hover:border-rose-200 group-hover:bg-rose-100/70',
  amber: 'bg-amber-50 text-amber-700 group-hover:border-amber-200 group-hover:bg-amber-100/70',
  purple: 'bg-violet-50 text-violet-700 group-hover:border-violet-200 group-hover:bg-violet-100/70',
}
const cardToneClasses = {
  blue: 'from-white via-blue-50 to-cyan-50',
  emerald: 'from-white via-emerald-50 to-cyan-50',
  rose: 'from-white via-rose-50 to-orange-50',
  amber: 'from-white via-amber-50 to-orange-50',
  purple: 'from-white via-violet-50 to-cyan-50',
}
const ctaToneClasses = {
  blue: 'bg-blue-600 text-white shadow-blue-200',
  emerald: 'bg-emerald-600 text-white shadow-emerald-200',
  rose: 'bg-rose-600 text-white shadow-rose-200',
  amber: 'bg-amber-500 text-slate-950 shadow-amber-200',
  purple: 'bg-violet-600 text-white shadow-violet-200',
}
</script>

<template>
  <component
    :is="component"
    :to="to"
    type="button"
    class="group flex min-h-48 w-full flex-col items-start rounded-[2rem] border border-white/80 bg-gradient-to-br p-6 text-left shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80 focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99]"
    :class="cardToneClasses[tone]"
    @click="emit('click')"
  >
    <span
      class="flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent transition"
      :class="toneClasses[tone]"
    >
      <slot name="icon" />
    </span>
    <span class="mt-5 text-lg font-black tracking-tight text-slate-950">
      {{ title }}
    </span>
    <span class="mt-2 text-sm font-medium leading-6 text-slate-500">
      {{ description }}
    </span>
    <span
      class="mt-5 inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-black shadow-lg"
      :class="ctaToneClasses[tone]"
    >
      {{ actionLabel }}
    </span>
  </component>
</template>
