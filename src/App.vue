<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLogoutMutation } from '@/composables/useAuthMutations'
import OnboardingWalkthrough from '@/components/shared/OnboardingWalkthrough.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const logoutMutation = useLogoutMutation()
const darkMode = ref(false)

const hideNav = computed(() => route.meta.hideNav === true)
const firstName = computed(() => authStore.user?.fullName?.split(' ')[0] ?? 'Player')
const userInitial = computed(() => firstName.value.charAt(0).toUpperCase())

const navItems = [
  { to: '/dashboard', label: 'Home', icon: '🏠', match: ['/dashboard'] },
  { to: '/inbox', label: 'Quests', icon: '📸', match: ['/inbox', '/gmail', '/statements'] },
  { to: '/transactions', label: 'Coins', icon: '💳', match: ['/transactions'] },
  { to: '/insights', label: 'Coach', icon: '🧠', match: ['/insights', '/anomalies'] },
  { to: '/split-bill', label: 'Party', icon: '🤝', match: ['/split-bill'] },
]

const activeNav = (item: typeof navItems[number]) =>
  item.match.some(path => route.path === path || route.path.startsWith(`${path}/`))

async function handleLogout() {
  await logoutMutation.mutateAsync()
  router.push('/login')
}

function toggleTheme() {
  darkMode.value = !darkMode.value
}

watch(darkMode, (enabled) => {
  document.documentElement.classList.toggle('duit-dark', enabled)
  localStorage.setItem('duit:theme', enabled ? 'dark' : 'light')
})

onMounted(() => {
  darkMode.value = localStorage.getItem('duit:theme') === 'dark'
})
</script>

<template>
  <div class="min-h-screen bg-[#f7f8ef] text-slate-800 selection:bg-emerald-200 selection:text-emerald-950">
    <header
      v-if="!hideNav"
      class="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-[#f7f8ef]/90 px-4 py-3 backdrop-blur-2xl md:hidden"
    >
      <div class="flex items-center justify-between">
        <RouterLink
          to="/dashboard"
          class="flex items-center gap-2"
        >
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-black text-white shadow-sm">
            d
          </span>
          <span class="text-xl font-black text-slate-950">duit</span>
        </RouterLink>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm"
          aria-label="Toggle dark mode"
          @click="toggleTheme"
        >
          {{ darkMode ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <aside
      v-if="!hideNav"
      class="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col border-r border-slate-200 bg-[#f7f8ef]/95 p-5 backdrop-blur-2xl md:flex"
    >
      <RouterLink
        to="/dashboard"
        class="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm"
      >
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black text-white">
          d
        </span>
        <span>
          <span class="block text-2xl font-black text-slate-950">duit</span>
          <span class="block text-xs font-black uppercase text-emerald-600">money adventure</span>
        </span>
      </RouterLink>

      <div class="mt-6 rounded-3xl border border-amber-100 bg-amber-50 p-4">
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-amber-600 shadow-sm">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-black text-slate-950">
              {{ firstName }}
            </p>
            <p class="text-xs font-black uppercase text-amber-700">
              Level 3 saver
            </p>
          </div>
        </div>
        <div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div class="h-full w-[62%] rounded-full bg-gradient-to-r from-emerald-400 to-amber-300" />
        </div>
      </div>

      <nav class="mt-6 flex-1 space-y-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-14 items-center gap-3 rounded-3xl px-4 text-sm font-black text-slate-500 transition hover:bg-white hover:text-slate-950"
          :class="activeNav(item) ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : ''"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-2xl text-xl"
            :class="activeNav(item) ? 'bg-emerald-100' : 'bg-white/70'"
          >
            {{ item.icon }}
          </span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="space-y-3">
        <RouterLink
          to="/inbox"
          class="flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
        >
          Scan for XP
        </RouterLink>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="min-h-11 rounded-2xl bg-white text-lg shadow-sm transition active:scale-[0.98]"
            aria-label="Toggle dark mode"
            @click="toggleTheme"
          >
            {{ darkMode ? '☀️' : '🌙' }}
          </button>
          <button
            type="button"
            class="min-h-11 rounded-2xl bg-white text-sm font-black text-rose-600 shadow-sm transition active:scale-[0.98]"
            @click="handleLogout"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>

    <main :class="hideNav ? '' : 'min-h-screen pb-28 pt-20 md:ml-72 md:pb-12 md:pt-0'">
      <div :class="hideNav ? 'min-h-screen w-full' : 'mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8 xl:px-10'">
        <RouterView />
      </div>
    </main>

    <nav
      v-if="!hideNav"
      class="fixed bottom-3 left-0 right-0 z-50 px-3 md:hidden"
    >
      <div class="grid h-20 grid-cols-5 rounded-[2rem] border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-200/70 backdrop-blur-2xl">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center rounded-3xl text-xs font-black text-slate-400 transition"
          :class="activeNav(item) ? 'bg-emerald-100 text-emerald-800' : ''"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span class="mt-1">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <OnboardingWalkthrough v-if="!hideNav && authStore.isAuthenticated" />
  </div>
</template>
