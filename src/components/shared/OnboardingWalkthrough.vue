<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OnboardingCoachDialog from '@/components/shared/OnboardingCoachDialog.vue'

const STORAGE_KEY = 'duit:onboardingCompleted'

// Developer reset:
// localStorage.removeItem('duit:onboardingCompleted')
const steps = [
  {
    route: '/dashboard',
    title: 'Welcome to Duit',
    eyebrow: 'A clearer view of everyday money',
    description: 'See what you have spent and what might need a look, without digging through a dashboard.',
    button: 'Next',
    tone: 'emerald',
  },
  {
    route: '/transactions',
    title: 'Keep spending in view',
    eyebrow: 'Activity',
    description: 'Add an expense or scan a receipt. Check the details and change a category whenever you need to.',
    button: 'Next',
    tone: 'emerald',
  },
  {
    route: '/split-bill',
    title: 'Split with friends',
    eyebrow: 'Shared bills',
    description: 'Share a receipt link. Friends can choose items without creating an account.',
    button: 'Finish',
    tone: 'emerald',
  },
] as const

const router = useRouter()
const route = useRoute()
const open = ref(false)
const currentIndex = ref(0)
const currentStep = computed(() => steps[currentIndex.value])
const isFirst = computed(() => currentIndex.value === 0)
const isLast = computed(() => currentIndex.value === steps.length - 1)
const progress = computed(() => `${currentIndex.value + 1} / ${steps.length}`)

async function moveTo(index: number) {
  currentIndex.value = Math.min(Math.max(index, 0), steps.length - 1)
  const target = steps[currentIndex.value].route
  if (route.path !== target) {
    try {
      await router.push(target)
    } catch {
      // Keep the dialog open even if navigation is interrupted by guards.
    }
  }
}

async function show() {
  currentIndex.value = 0
  open.value = true
}

function complete() {
  localStorage.setItem(STORAGE_KEY, 'true')
  open.value = false
}

async function next() {
  if (isLast.value) {
    complete()
    return
  }
  await moveTo(currentIndex.value + 1)
}

async function back() {
  if (!isFirst.value) {
    await moveTo(currentIndex.value - 1)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') complete()
  if (event.key === 'ArrowRight') void next()
  if (event.key === 'ArrowLeft') void back()
}

function handleReplay() {
  void show()
}

onMounted(() => {
  if (localStorage.getItem(STORAGE_KEY) !== 'true') {
    void show()
  }
  window.addEventListener('duit:replayOnboarding', handleReplay)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('duit:replayOnboarding', handleReplay)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <OnboardingCoachDialog
    :open="open"
    :eyebrow="currentStep.eyebrow"
    :title="currentStep.title"
    :description="currentStep.description"
    :progress="progress"
    :tone="currentStep.tone"
    :primary-label="currentStep.button"
    :back-disabled="isFirst"
    :is-last="isLast"
    @next="next"
    @back="back"
    @skip="complete"
  />
</template>
