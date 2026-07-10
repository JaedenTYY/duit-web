<script setup lang="ts">
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
}>()
</script>

<template>
  <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
    <FriendlyAvatar
      :tone="tone"
      size="lg"
    />
    <div class="min-w-0">
      <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
        {{ eyebrow }}
      </p>
      <h2 class="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        {{ title }}
      </h2>
      <p class="mt-3 text-base font-medium leading-7 text-slate-600">
        {{ description }}
      </p>
    </div>
  </div>
</template>
