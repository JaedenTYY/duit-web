<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { useRouter, useRoute } from 'vue-router'

const routerViewContainer = ref<HTMLElement | null>(null)
const route = useRoute()

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
  <div class="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
    <!-- Premium Sidebar (Desktop) -->
    <nav class="hidden md:flex fixed top-0 left-0 h-full w-72 flex-col bg-slate-900/40 backdrop-blur-3xl border-r border-slate-800/40 z-40 p-10">
      <div class="mb-14">
        <h1 class="text-2xl font-bold text-white tracking-tight">duit<span class="text-blue-500">.</span></h1>
      </div>
      <div class="space-y-2">
        <router-link to="/" class="nav-link-desktop" :class="{ 'active': route.path === '/' }">
          <div class="icon-box"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg></div>
          Dashboard
        </router-link>
        <router-link to="/transactions" class="nav-link-desktop" :class="{ 'active': route.path === '/transactions' }">
          <div class="icon-box"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
          Transactions
        </router-link>
        <router-link to="/insights" class="nav-link-desktop" :class="{ 'active': route.path === '/insights' }">
          <div class="icon-box"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6z"/></svg></div>
          Insights
        </router-link>
      </div>
    </nav>

    <!-- Content Area -->
    <main class="md:ml-72 pb-28 md:pb-12 min-h-screen">
      <div ref="routerViewContainer" class="max-w-4xl mx-auto px-6 pt-10 md:px-12 md:pt-14">
        <RouterView />
      </div>
    </main>

    <!-- Mobile Bottom Navigation (Floating Style) -->
    <nav class="md:hidden fixed bottom-6 left-0 right-0 z-50 px-6">
      <div class="bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-around h-20 px-2 shadow-2xl shadow-black/40">
        <router-link to="/" class="nav-link-mobile" :class="{ 'active': route.path === '/' }">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span class="text-[11px] font-bold">Home</span>
        </router-link>
        
        <router-link to="/transactions" class="nav-link-mobile" :class="{ 'active': route.path === '/transactions' }">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-[11px] font-bold">Activity</span>
        </router-link>

        <router-link to="/insights" class="nav-link-mobile" :class="{ 'active': route.path === '/insights' }">
          <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span class="text-[11px] font-bold">Insights</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.nav-link-desktop {
  @apply flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 font-semibold transition-all duration-300 hover:text-white hover:bg-white/5;
}
.nav-link-desktop.active {
  @apply bg-white text-slate-900 shadow-[0_10px_25px_rgba(255,255,255,0.1)];
}
.nav-link-desktop.active .icon-box { @apply text-blue-600; }
.icon-box { @apply transition-colors duration-300; }

.nav-link-mobile {
  @apply flex flex-col items-center justify-center flex-1 h-full text-slate-500 transition-all duration-300;
}
.nav-link-mobile.active {
  @apply text-white;
}

.v-enter-active, .v-leave-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.v-enter-from, .v-leave-to {
  opacity: 0;
}
</style>
