<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  tone?: 'blue' | 'mint' | 'purple' | 'peach'
}>(), {
  tone: 'blue',
})

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  mint: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  purple: 'bg-violet-50 text-violet-700 ring-violet-100',
  peach: 'bg-orange-50 text-orange-700 ring-orange-100',
}
</script>

<template>
  <article class="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
    <div
      class="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1"
      :class="toneClasses[tone]"
    >
      <slot name="icon" />
    </div>
    <h3 class="text-xl font-black tracking-tight text-slate-950">
      {{ title }}
    </h3>
    <p class="mt-2 text-sm font-semibold leading-6 text-slate-600">
      {{ description }}
    </p>
  </article>
</template>
