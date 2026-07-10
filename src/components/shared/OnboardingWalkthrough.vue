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
    eyebrow: 'Let’s get your spending organised',
    description: 'Duit helps you capture, understand, and act on your spending, from receipts and statements to insights and bill splits.',
    button: 'Start tour',
    tone: 'blue',
  },
  {
    route: '/dashboard',
    title: 'Dashboard',
    eyebrow: 'Your money home',
    description: 'This is where you see spending summaries, categories, recent transactions, and friendly AI highlights at a glance.',
    button: 'Next: Transactions',
    tone: 'emerald',
  },
  {
    route: '/transactions',
    title: 'Transactions',
    eyebrow: 'Clean spending feed',
    description: 'Add spending manually and review Duit’s semantic category suggestions so your history stays organised.',
    button: 'Next: Magic Inbox',
    tone: 'amber',
  },
  {
    route: '/inbox',
    title: 'Magic Inbox',
    eyebrow: 'Import hub',
    description: 'Bring in spending from receipt photos, bank statement PDFs, and Gmail eReceipts from one colourful hub.',
    button: 'Next: AI Insights',
    tone: 'blue',
  },
  {
    route: '/insights',
    title: 'AI Insights',
    eyebrow: 'Financial coach',
    description: 'Duit generates weekly spending summaries and recommendations so patterns are easier to understand.',
    button: 'Next: Anomaly Alerts',
    tone: 'emerald',
  },
  {
    route: '/insights',
    title: 'Anomaly Alerts',
    eyebrow: 'Unusual spending checks',
    description: 'Duit flags unusual transactions with a clear explanation, then lets you confirm or dismiss the alert.',
    button: 'Next: Split Bills',
    tone: 'rose',
  },
  {
    route: '/split-bill',
    title: 'Smart Bill Split',
    eyebrow: 'Shared receipts',
    description: 'Scan a receipt, create a bill split, share a guest QR link, and manually mark payments as settled.',
    button: 'Finish',
    tone: 'amber',
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
