<script setup lang="ts">
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
  progress: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
  primaryLabel: string
  backDisabled?: boolean
  isLast?: boolean
}>()

const emit = defineEmits<{
  (event: 'next'): void
  (event: 'back'): void
  (event: 'skip'): void
}>()
</script>

<template>
  <section class="pointer-events-auto w-full max-w-xl rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-7">
    <div class="mb-5 flex items-center justify-between gap-4">
      <p class="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
        {{ progress }}
      </p>
      <button
        type="button"
        class="min-h-10 rounded-2xl px-3 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        @click="emit('skip')"
      >
        Skip
      </button>
    </div>

    <div class="flex flex-col gap-5 sm:flex-row sm:items-start">
      <FriendlyAvatar
        :tone="tone"
        size="lg"
      />
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          {{ eyebrow }}
        </p>
        <h2
          id="onboarding-title"
          class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
        >
          {{ title }}
        </h2>
        <p class="mt-3 text-base font-medium leading-7 text-slate-600">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="mt-7 grid grid-cols-[0.8fr_1.2fr] gap-3">
      <button
        type="button"
        class="min-h-11 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="backDisabled"
        @click="emit('back')"
      >
        Back
      </button>
      <button
        type="button"
        class="min-h-11 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
        @click="emit('next')"
      >
        {{ isLast ? 'Finish' : primaryLabel }}
      </button>
    </div>
  </section>
</template>
