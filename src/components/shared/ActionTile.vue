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
  to: undefined,
})

const emit = defineEmits<{
  (event: 'click'): void
}>()

const component = computed(() => props.to ? 'RouterLink' : 'button')
const toneClasses = {
  blue: 'bg-sky-50 text-sky-700 group-hover:border-sky-200 group-hover:bg-sky-100/70',
  emerald: 'bg-emerald-50 text-emerald-700 group-hover:border-emerald-200 group-hover:bg-emerald-100/70',
  rose: 'bg-rose-50 text-rose-700 group-hover:border-rose-200 group-hover:bg-rose-100/70',
  amber: 'bg-amber-50 text-amber-700 group-hover:border-amber-200 group-hover:bg-amber-100/70',
  purple: 'bg-violet-50 text-violet-700 group-hover:border-violet-200 group-hover:bg-violet-100/70',
}
const cardToneClasses = {
  blue: 'bg-white border-sky-100',
  emerald: 'bg-white border-emerald-100',
  rose: 'bg-white border-rose-100',
  amber: 'bg-white border-amber-100',
  purple: 'bg-white border-violet-100',
}
const ctaToneClasses = {
  blue: 'bg-sky-500 text-white shadow-sky-100',
  emerald: 'bg-emerald-500 text-white shadow-emerald-100',
  rose: 'bg-rose-500 text-white shadow-rose-100',
  amber: 'bg-amber-500 text-slate-950 shadow-amber-200',
  purple: 'bg-violet-600 text-white shadow-violet-200',
}
</script>

<template>
  <component
    :is="component"
    :to="to"
    type="button"
    class="group flex min-h-48 w-full flex-col items-start rounded-[2rem] border p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100 active:scale-[0.99]"
    :class="cardToneClasses[tone]"
    @click="emit('click')"
  >
    <span
      class="flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent transition"
      :class="toneClasses[tone]"
    >
      <slot name="icon" />
    </span>
    <span class="mt-5 text-lg font-black text-slate-950">
      {{ title }}
    </span>
    <span class="mt-2 text-sm font-semibold leading-6 text-slate-500">
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
