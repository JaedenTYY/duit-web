<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'
import DuitLogo from '@/components/shared/DuitLogo.vue'

const router = useRouter()
const hero = ref<HTMLElement | null>(null)
const preview = ref<HTMLElement | null>(null)

const featureCards = [
  {
    title: 'Scan receipts',
    description: 'Capture a receipt once, then choose whether to save it as an expense or start a bill split.',
    tone: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  },
  {
    title: 'Split bills',
    description: 'Turn receipt items into a shareable claim flow, without forcing guests to create accounts.',
    tone: 'bg-amber-50 border-amber-100 text-amber-700',
  },
  {
    title: 'Review spending',
    description: 'See transactions, categories, unusual activity, and weekly insights in one readable workspace.',
    tone: 'bg-sky-50 border-sky-100 text-sky-700',
  },
]

const workflow = [
  'Take or upload a receipt',
  'Choose expenses or split bill',
  'Review extracted details',
  'Save, share, or learn from it',
]

onMounted(() => {
  const ctx = gsap.context(() => {
    gsap.from(hero.value?.children || [], {
      y: 18,
      opacity: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power3.out'
    })
    gsap.from(preview.value, {
      y: 24,
      opacity: 0,
      scale: 0.985,
      duration: 0.65,
      ease: 'power3.out',
      delay: 0.12
    })
  })

  return () => ctx.revert()
})

function navigateToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f8faf6] text-slate-950 selection:bg-emerald-200 selection:text-emerald-950">
    <nav class="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-[#f8faf6]/90 backdrop-blur-2xl">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <button
          type="button"
          class="rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-200"
          aria-label="Duit home"
          @click="$router.push('/')"
        >
          <DuitLogo size="sm" />
        </button>
        <button
          class="min-h-10 rounded-2xl bg-slate-950 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-700 active:scale-[0.98]"
          @click="navigateToLogin"
        >
          Login
        </button>
      </div>
    </nav>

    <main>
      <section class="relative px-5 pb-14 pt-28 sm:px-8 lg:px-12">
        <div
          ref="hero"
          class="mx-auto flex min-h-[62vh] max-w-5xl flex-col items-center justify-center text-center"
        >
          <DuitLogo
            class="justify-center"
            subtitle="personal finance"
          />
          <h1 class="mt-8 max-w-4xl text-5xl font-black leading-none text-slate-950 sm:text-7xl lg:text-8xl">
            Duit
          </h1>
          <p class="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600 sm:text-xl">
            A cleaner way to scan receipts, split shared bills, and understand weekly spending without digging through messy records.
          </p>
          <div class="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
            <button
              class="inline-flex min-h-13 items-center justify-center rounded-2xl bg-emerald-500 px-7 py-4 text-base font-black text-white shadow-xl shadow-emerald-200 transition hover:bg-emerald-600 active:scale-[0.98]"
              @click="navigateToLogin"
            >
              Open Duit
            </button>
            <a
              href="#workflow"
              class="inline-flex min-h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              See workflow
            </a>
          </div>
        </div>

        <div
          ref="preview"
          class="mx-auto -mt-6 max-w-5xl"
        >
          <div class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
            <div class="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div class="p-5 sm:p-8">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-black uppercase text-emerald-700">
                      Today
                    </p>
                    <h2 class="mt-1 text-2xl font-black text-slate-950">
                      Spending workspace
                    </h2>
                  </div>
                  <span class="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">RM 128.40</span>
                </div>

                <div class="mt-6 grid gap-3 sm:grid-cols-3">
                  <div
                    v-for="card in featureCards"
                    :key="card.title"
                    class="rounded-[1.5rem] border p-4"
                    :class="card.tone"
                  >
                    <p class="text-sm font-black text-slate-950">
                      {{ card.title }}
                    </p>
                    <p class="mt-2 text-sm font-semibold leading-5 text-slate-600">
                      {{ card.description }}
                    </p>
                  </div>
                </div>

                <div
                  id="workflow"
                  class="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <p class="text-sm font-black text-slate-950">
                    Receipt flow
                  </p>
                  <div class="mt-4 grid gap-3 sm:grid-cols-4">
                    <div
                      v-for="(item, index) in workflow"
                      :key="item"
                      class="rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <span class="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {{ index + 1 }}
                      </span>
                      <p class="mt-3 text-sm font-black leading-5 text-slate-800">
                        {{ item }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-end justify-center bg-[#edf8ef] p-6">
                <div class="w-full max-w-[19rem] rounded-[2.4rem] border-[10px] border-slate-950 bg-[#f8faf6] p-4 shadow-2xl shadow-emerald-200">
                  <div class="flex items-center justify-between">
                    <DuitLogo
                      size="sm"
                      compact
                    />
                    <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">Weekly</span>
                  </div>
                  <div class="mt-5 rounded-[1.5rem] bg-white p-4 shadow-sm">
                    <p class="text-xs font-black uppercase text-slate-500">
                      This week
                    </p>
                    <strong class="mt-2 block text-3xl font-black text-slate-950">RM 426.80</strong>
                    <p class="mt-2 text-sm font-semibold text-emerald-700">
                      Dining is down 8% from last week.
                    </p>
                  </div>
                  <div class="mt-4 grid grid-cols-2 gap-3">
                    <div class="rounded-2xl bg-white p-3 shadow-sm">
                      <p class="text-xs font-black text-slate-500">
                        Receipts
                      </p>
                      <strong class="mt-2 block text-xl font-black">6</strong>
                    </div>
                    <div class="rounded-2xl bg-white p-3 shadow-sm">
                      <p class="text-xs font-black text-slate-500">
                        Splits
                      </p>
                      <strong class="mt-2 block text-xl font-black">2</strong>
                    </div>
                  </div>
                  <div class="relative mt-5 grid h-16 grid-cols-5 items-center rounded-3xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <span class="text-center text-xs font-black text-slate-400">Home</span>
                    <span class="text-center text-xs font-black text-slate-400">Records</span>
                    <span class="-mt-7 mx-auto grid h-16 w-16 place-items-center rounded-full border-[6px] border-[#f8faf6] bg-emerald-500 text-white shadow-xl shadow-emerald-200">
                      <svg
                        class="h-7 w-7"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.4"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.25l1.1-1.45A1.5 1.5 0 0 1 10.05 4h3.9a1.5 1.5 0 0 1 1.2.55L16.25 6h1.25A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </span>
                    <span class="text-center text-xs font-black text-slate-400">Insights</span>
                    <span class="text-center text-xs font-black text-slate-400">Split</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:px-8 md:grid-cols-3 lg:px-12">
        <div
          v-for="card in featureCards"
          :key="card.title"
          class="rounded-[1.5rem] border bg-white p-6 shadow-sm"
          :class="card.tone"
        >
          <h2 class="text-xl font-black text-slate-950">
            {{ card.title }}
          </h2>
          <p class="mt-3 text-sm font-semibold leading-6 text-slate-600">
            {{ card.description }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>
