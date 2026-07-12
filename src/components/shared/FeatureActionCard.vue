<script setup lang="ts">
import AppIcon, { type AppIconName } from '@/components/shared/AppIcon.vue'

withDefaults(defineProps<{
  title: string
  description: string
  status: string
  icon: AppIconName
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
    class="group flex min-h-0 w-full flex-col rounded-3xl border bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] sm:min-h-40 sm:p-5"
    :class="toneClasses[tone]"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="flex h-9 w-9 items-center justify-center rounded-2xl bg-white p-2 text-current shadow-sm sm:h-12 sm:w-12 sm:p-3">
        <AppIcon :name="icon" />
      </span>
      <span class="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-black shadow-sm sm:px-3 sm:text-xs">
        {{ status }}
      </span>
    </div>
    <h3 class="mt-2.5 text-base font-black text-slate-950 sm:mt-4 sm:text-lg">
      {{ title }}
    </h3>
    <p class="mt-1 flex-1 text-sm font-semibold leading-5 text-slate-500 sm:mt-2 sm:leading-6">
      {{ description }}
    </p>
    <span class="mt-2.5 inline-flex min-h-9 items-center justify-center self-start rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition group-hover:bg-slate-800 sm:mt-4 sm:min-h-10">
      {{ actionLabel }}
    </span>
  </component>
</template>
