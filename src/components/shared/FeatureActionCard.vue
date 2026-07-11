<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  status: string
  icon: string
  tone?: 'mint' | 'amber' | 'coral' | 'sky'
  to?: string
  actionLabel?: string
}>(), {
  tone: 'mint',
  actionLabel: 'Start',
  to: undefined,
})

const emit = defineEmits<{
  (event: 'click'): void
}>()

const toneClasses = {
  mint: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  coral: 'bg-rose-50 text-rose-700 border-rose-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-100',
}
</script>

<template>
  <component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    type="button"
    :aria-label="`${title}: ${description}`"
    class="group flex min-h-40 w-full flex-col rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
    :class="toneClasses[tone]"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        {{ icon }}
      </span>
      <span class="rounded-full bg-white px-3 py-1 text-xs font-black shadow-sm">
        {{ status }}
      </span>
    </div>
    <h3 class="mt-4 text-lg font-black text-slate-950">
      {{ title }}
    </h3>
    <p class="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-500">
      {{ description }}
    </p>
    <span class="mt-4 inline-flex min-h-10 items-center justify-center self-start rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition group-hover:bg-slate-800">
      {{ actionLabel }}
    </span>
  </component>
</template>
