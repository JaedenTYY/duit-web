<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

const authStore = useAuthStore()
const recoveryTarget = computed(() => authStore.isAuthenticated ? '/dashboard' : '/login')
const recoveryLabel = computed(() => authStore.isAuthenticated ? 'Go to dashboard' : 'Go to login')
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-10 text-slate-700">
    <section class="mx-auto flex max-w-lg flex-col items-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
      <FriendlyAvatar
        tone="blue"
        size="md"
      />
      <p class="mt-6 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
        Page not found
      </p>
      <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-950">
        This Duit page does not exist.
      </h1>
      <p class="mt-3 text-sm font-semibold leading-6 text-slate-500">
        The link may be outdated or mistyped. No request was sent to the API for this unknown route.
      </p>
      <RouterLink
        :to="recoveryTarget"
        class="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
      >
        {{ recoveryLabel }}
      </RouterLink>
    </section>
  </main>
</template>
