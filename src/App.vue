<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import OnboardingWalkthrough from '@/components/shared/OnboardingWalkthrough.vue'
import AppIcon, { type AppIconName } from '@/components/shared/AppIcon.vue'
import DuitLogo from '@/components/shared/DuitLogo.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'

const route = useRoute()
const authStore = useAuthStore()
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
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: 'settings', match: ['/settings'] },
]

const mobileNavItems = [
  navItems[0],
  navItems[2],
  navItems[3],
  navItems[4],
]

const activeNav = (item: typeof navItems[number]) =>
  item.match.some(path => route.path === path || route.path.startsWith(`${path}/`))

function openCaptureModal() {
  showCaptureModal.value = true
}
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
        <RouterLink
          to="/settings"
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-2.5 text-slate-700 shadow-sm"
          aria-label="Settings"
        >
          <AppIcon name="settings" />
        </RouterLink>
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

      <RouterLink
        to="/settings"
        class="mt-6 block rounded-3xl border border-amber-100 bg-amber-50 p-4 transition hover:border-amber-200 hover:bg-amber-100/70"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-amber-600 shadow-sm">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-black text-slate-950">
              {{ firstName }}
            </p>
            <p class="text-xs font-black uppercase text-amber-700">
              Account settings
            </p>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-xs font-black text-slate-500">
          <span>Profile and logout</span>
          <span class="h-4 w-4 text-amber-700"><AppIcon name="settings" /></span>
        </div>
      </RouterLink>

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
        <RouterLink
          to="/settings"
          class="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition active:scale-[0.98]"
        >
          <span class="h-4 w-4"><AppIcon name="settings" /></span>
          Settings
        </RouterLink>
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
