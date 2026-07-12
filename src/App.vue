<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLogoutMutation } from '@/composables/useAuthMutations'
import OnboardingWalkthrough from '@/components/shared/OnboardingWalkthrough.vue'
import AppIcon, { type AppIconName } from '@/components/shared/AppIcon.vue'
import DuitLogo from '@/components/shared/DuitLogo.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const logoutMutation = useLogoutMutation()
const darkMode = ref(false)
const showCaptureModal = ref(false)

const hideNav = computed(() => route.meta.hideNav === true)
const firstName = computed(() => authStore.user?.fullName?.split(' ')[0] ?? 'User')
const userInitial = computed(() => firstName.value.charAt(0).toUpperCase())

interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: AppIconName
  match: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: 'home', match: ['/dashboard'] },
  { to: '/inbox', label: 'Import spending', shortLabel: 'Import', icon: 'camera', match: ['/inbox', '/gmail', '/statements'] },
  { to: '/transactions', label: 'Transactions', shortLabel: 'Records', icon: 'card', match: ['/transactions'] },
  { to: '/insights', label: 'Insights', shortLabel: 'Insights', icon: 'insights', match: ['/insights', '/anomalies'] },
  { to: '/split-bill', label: 'Split bill', shortLabel: 'Split', icon: 'users', match: ['/split-bill'] },
]

const mobileNavItems = [
  navItems[0],
  navItems[2],
  navItems[3],
  navItems[4],
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

function openCaptureModal() {
  showCaptureModal.value = true
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
          <DuitLogo
            size="sm"
            aria-label="Duit"
          />
        </RouterLink>
        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-2.5 text-slate-700 shadow-sm"
          aria-label="Toggle dark mode"
          @click="toggleTheme"
        >
          <AppIcon :name="darkMode ? 'sun' : 'moon'" />
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
        <DuitLogo subtitle="personal finance" />
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
              Weekly progress
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
          :aria-current="activeNav(item) ? 'page' : undefined"
          class="flex min-h-14 items-center gap-3 rounded-3xl px-4 text-sm font-black text-slate-500 transition hover:bg-white hover:text-slate-950"
          :class="activeNav(item) ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : ''"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-2xl p-2.5"
            :class="activeNav(item) ? 'bg-emerald-100' : 'bg-white/70'"
          >
            <AppIcon :name="item.icon" />
          </span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="space-y-3">
        <button
          type="button"
          class="flex min-h-12 items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
          @click="openCaptureModal"
        >
          Scan receipt
        </button>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="flex min-h-11 items-center justify-center rounded-2xl bg-white p-3 text-slate-700 shadow-sm transition active:scale-[0.98]"
            aria-label="Toggle dark mode"
            @click="toggleTheme"
          >
            <AppIcon :name="darkMode ? 'sun' : 'moon'" />
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

    <main :class="hideNav ? '' : 'min-h-screen pb-24 pt-16 md:ml-72 md:pb-12 md:pt-0'">
      <div :class="hideNav ? 'min-h-screen w-full' : 'mx-auto max-w-6xl px-3 py-4 sm:px-6 md:px-8 md:py-8 xl:px-10'">
        <RouterView />
      </div>
    </main>

    <nav
      v-if="!hideNav"
      class="fixed bottom-3 left-0 right-0 z-50 px-3 md:hidden"
    >
      <div class="grid h-16 grid-cols-5 items-center rounded-3xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-200/60 backdrop-blur-2xl">
        <RouterLink
          v-for="item in mobileNavItems.slice(0, 2)"
          :key="item.to"
          :to="item.to"
          :aria-label="item.label"
          :aria-current="activeNav(item) ? 'page' : undefined"
          class="flex flex-col items-center justify-center rounded-2xl text-[0.68rem] font-black text-slate-400 transition"
          :class="activeNav(item) ? 'bg-emerald-100 text-emerald-800' : ''"
        >
          <span class="h-5 w-5"><AppIcon :name="item.icon" /></span>
          <span class="mt-0.5">{{ item.shortLabel }}</span>
        </RouterLink>
        <button
          type="button"
          class="-mt-7 mx-auto flex h-[4.3rem] w-[4.3rem] flex-col items-center justify-center rounded-full border-[6px] border-[#f7f8ef] bg-emerald-500 text-white shadow-xl shadow-emerald-200 transition active:scale-[0.96]"
          aria-label="Scan receipt"
          @click="openCaptureModal"
        >
          <span class="h-7 w-7"><AppIcon name="camera" /></span>
          <span class="mt-0.5 text-[0.62rem] font-black">Scan</span>
        </button>
        <RouterLink
          v-for="item in mobileNavItems.slice(2)"
          :key="item.to"
          :to="item.to"
          :aria-label="item.label"
          :aria-current="activeNav(item) ? 'page' : undefined"
          class="flex flex-col items-center justify-center rounded-2xl text-[0.68rem] font-black text-slate-400 transition"
          :class="activeNav(item) ? 'bg-emerald-100 text-emerald-800' : ''"
        >
          <span class="h-5 w-5"><AppIcon :name="item.icon" /></span>
          <span class="mt-0.5">{{ item.shortLabel }}</span>
        </RouterLink>
      </div>
    </nav>

    <OnboardingWalkthrough v-if="!hideNav && authStore.isAuthenticated" />
    <ReceiptUploadModal
      v-if="showCaptureModal"
      @close="showCaptureModal = false"
      @success="showCaptureModal = false"
    />
  </div>
</template>
