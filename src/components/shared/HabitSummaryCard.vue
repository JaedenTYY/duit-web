<script setup lang="ts">
withDefaults(defineProps<{
  completion: number
  completedTasks: number
  totalTasks: number
  streakDays: number
  title?: string
  subtitle?: string
}>(), {
  title: 'Weekly habits',
  subtitle: 'A quick summary of the money tasks that keep your records useful.',
})
</script>

<template>
  <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase text-emerald-600">
          Progress overview
        </p>
        <h2 class="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
          {{ title }}
        </h2>
        <p class="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl shadow-inner sm:h-16 sm:w-16 sm:rounded-3xl sm:text-3xl">
        ✓
      </div>
    </div>

    <div class="mt-5 sm:mt-6">
      <div class="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>{{ completedTasks }} of {{ totalTasks }} tasks</span>
        <span>{{ Math.round(completion) }}%</span>
      </div>
      <div
        class="h-4 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        :aria-valuenow="Math.round(completion)"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Weekly habit completion"
      >
        <div
          class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-300"
          :style="{ width: `${Math.min(100, Math.max(0, completion))}%` }"
        />
      </div>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
      <div class="rounded-2xl bg-emerald-50 p-3 sm:p-4">
        <p class="text-xs font-black uppercase text-emerald-700">
          Active days
        </p>
        <p class="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
          {{ streakDays }} days
        </p>
      </div>
      <div class="rounded-2xl bg-amber-50 p-3 sm:p-4">
        <p class="text-xs font-black uppercase text-amber-700">
          Focus
        </p>
        <p class="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
          {{ completedTasks }}/{{ totalTasks }}
        </p>
      </div>
    </div>
  </section>
</template>
