<script setup lang="ts">
import WalkthroughStepDialog from '@/components/shared/WalkthroughStepDialog.vue'

defineProps<{
  open: boolean
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
  <Teleport to="body">
    <div
      v-if="open"
      class="pointer-events-none fixed inset-0 z-[100] flex items-end bg-slate-950/45 px-3 pb-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <WalkthroughStepDialog
        :eyebrow="eyebrow"
        :title="title"
        :description="description"
        :progress="progress"
        :tone="tone"
        :primary-label="primaryLabel"
        :back-disabled="backDisabled"
        :is-last="isLast"
        @next="emit('next')"
        @back="emit('back')"
        @skip="emit('skip')"
      />
    </div>
  </Teleport>
</template>
