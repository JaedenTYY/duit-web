<script setup lang="ts">
withDefaults(defineProps<{
  level: number
  xp: number
  nextLevelXp: number
  streakDays: number
  title?: string
  subtitle?: string
}>(), {
  title: 'Money path',
  subtitle: 'Build healthy money habits one small mission at a time.',
})
</script>

<template>
  <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase text-emerald-600">
          Level {{ level }}
        </p>
        <h2 class="mt-2 text-2xl font-black text-slate-950">
          {{ title }}
        </h2>
        <p class="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-amber-100 text-3xl shadow-inner">
        ⚡
      </div>
    </div>

    <div class="mt-6">
      <div class="mb-2 flex items-center justify-between text-xs font-black uppercase text-slate-500">
        <span>{{ xp }} XP</span>
        <span>{{ nextLevelXp }} XP</span>
      </div>
      <div class="h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-300"
          :style="{ width: `${Math.min(100, Math.max(0, (xp / nextLevelXp) * 100))}%` }"
        />
      </div>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <div class="rounded-2xl bg-emerald-50 p-4">
        <p class="text-xs font-black uppercase text-emerald-700">
          Streak
        </p>
        <p class="mt-1 text-2xl font-black text-slate-950">
          {{ streakDays }} days
        </p>
      </div>
      <div class="rounded-2xl bg-amber-50 p-4">
        <p class="text-xs font-black uppercase text-amber-700">
          Reward
        </p>
        <p class="mt-1 text-2xl font-black text-slate-950">
          +{{ Math.max(20, level * 10) }} XP
        </p>
      </div>
    </div>
  </section>
</template>
