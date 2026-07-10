<script setup lang="ts">
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

withDefaults(defineProps<{
  title: string
  message: string
  actionLabel?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'rose'
}>(), {
  tone: 'blue',
})

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template>
  <section class="flex flex-col items-center rounded-[2rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
    <FriendlyAvatar
      :tone="tone"
      size="md"
    />
    <h2 class="mt-6 text-xl font-black tracking-tight text-slate-950">
      {{ title }}
    </h2>
    <p class="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
      {{ message }}
    </p>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-6 min-h-11 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.98]"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
    <div
      v-if="$slots.actions"
      class="mt-6"
    >
      <slot name="actions" />
    </div>
  </section>
</template>
