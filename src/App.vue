<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { gsap } from 'gsap'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routerViewContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const hideNav = computed(() => route.meta.hideNav === true)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (routerViewContainer.value) {
    const ctx = gsap.context(() => {
      gsap.from(routerViewContainer.value, {
        opacity: 0,
        y: 15,
        duration: 0.6,
        ease: 'power2.out'
      })
    }, routerViewContainer.value)

    return () => ctx.revert()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-700 font-sans selection:bg-blue-500/20 selection:text-blue-900">
    <!-- Mobile Top Header -->
    <header
      v-if="!hideNav"
      class="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-3xl border-b border-slate-200 z-40 flex items-center justify-between px-6"
    >
      <h1 class="text-xl font-bold text-slate-900 tracking-tight">
        duit<span class="text-blue-500">.</span>
      </h1>
      <button
        class="text-slate-400 hover:text-red-500 transition-colors"
        @click="handleLogout"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        /></svg>
      </button>
    </header>

    <!-- Premium Sidebar (Desktop) -->
    <nav
      v-if="!hideNav"
      class="hidden md:flex fixed top-0 left-0 h-full w-72 flex-col overflow-y-auto bg-white backdrop-blur-3xl border-r border-slate-200 z-40 p-10"
    >
      <div class="mb-14">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
          duit<span class="text-blue-500">.</span>
        </h1>
      </div>
      <div class="space-y-2 flex-1">
        <router-link
          to="/dashboard"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/dashboard' || route.path === '/' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            /></svg>
          </div>
          Dashboard
        </router-link>
        <router-link
          to="/inbox"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/inbox' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            /></svg>
          </div>
          Magic Inbox
        </router-link>
        <router-link
          to="/transactions"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/transactions' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            /></svg>
          </div>
          Transactions
        </router-link>
        <router-link
          to="/statements"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/statements' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 3h7l5 5v13H7V3zm7 0v6h5M10 13h6m-6 4h6"
            /></svg>
          </div>
          Bank Import
        </router-link>
        <router-link
          to="/insights"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/insights' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6z"
            /></svg>
          </div>
          Insights
        </router-link>
        <router-link
          to="/tax"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/tax' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            /></svg>
          </div>
          Tax Export
        </router-link>
        <router-link
          to="/goals"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/goals' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            /></svg>
          </div>
          Goals
        </router-link>
        <router-link
          to="/split-bill"
          class="nav-link-desktop"
          :class="{ 'active': route.path === '/split-bill' }"
        >
          <div class="icon-box">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 14l6-6m-5.5-.5h.01m4.99 7h.01M5 5h14v14H5z"
            /></svg>
          </div>
          Split Bill
        </router-link>
      </div>
      <div class="mt-auto space-y-4">
        <router-link
          to="/inbox"
          class="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          /><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          /></svg>
          Scan Receipt
        </router-link>
        <button
          class="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold py-4 rounded-2xl transition-colors"
          @click="handleLogout"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          /></svg>
          Log Out
        </button>
      </div>
    </nav>

    <!-- Content Area -->
    <main :class="hideNav ? '' : 'md:ml-72 pb-28 md:pb-12 min-h-screen'">
      <div
        ref="routerViewContainer"
        :class="hideNav ? 'w-full min-h-screen' : 'max-w-4xl mx-auto px-6 pt-10 md:px-12 md:pt-14'"
      >
        <RouterView />
      </div>
    </main>

    <!-- Mobile Bottom Navigation (Floating Style) -->
    <nav
      v-if="!hideNav"
      class="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4"
    >
      <div class="bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-full flex items-center justify-between h-16 px-6 shadow-xl shadow-slate-200/50">
        <router-link
          to="/dashboard"
          class="nav-link-mobile"
          :class="{ 'active': route.path === '/dashboard' || route.path === '/' }"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          /></svg>
        </router-link>
        
        <router-link
          to="/transactions"
          class="nav-link-mobile"
          :class="{ 'active': route.path === '/transactions' }"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg>
        </router-link>

        <!-- Floating Camera Button -->
        <router-link
          to="/inbox"
          class="relative -top-5 bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-slate-50 transition-transform active:scale-90"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          /><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          /></svg>
        </router-link>

        <router-link
          to="/tax"
          class="nav-link-mobile"
          :class="{ 'active': route.path === '/tax' }"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          /></svg>
        </router-link>

        <router-link
          to="/goals"
          class="nav-link-mobile"
          :class="{ 'active': route.path === '/goals' }"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          /></svg>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.nav-link-desktop {
  @apply flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 font-semibold transition-all duration-300 hover:text-slate-900 hover:bg-slate-50;
}
.nav-link-desktop.active {
  @apply bg-slate-100 text-slate-900 shadow-sm;
}
.nav-link-desktop.active .icon-box { @apply text-blue-600; }
.icon-box { @apply transition-colors duration-300; }

.nav-link-mobile {
  @apply flex flex-col items-center justify-center flex-1 h-full text-slate-400 transition-all duration-300;
}
.nav-link-mobile.active {
  @apply text-slate-900;
}

.v-enter-active, .v-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>
