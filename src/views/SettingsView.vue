<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLogoutMutation } from '@/composables/useAuthMutations'
import AppIcon from '@/components/shared/AppIcon.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const logoutMutation = useLogoutMutation()

const user = computed(() => authStore.user)
const firstName = computed(() => user.value?.fullName?.split(' ')[0] ?? 'User')
const userInitial = computed(() => firstName.value.charAt(0).toUpperCase())
const logoutPending = computed(() => logoutMutation.isPending.value)

async function handleLogout() {
  await logoutMutation.mutateAsync()
  router.push('/login')
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 pb-28">
    <PageHeader
      eyebrow="Settings"
      title="Account and profile"
      description="Profile actions are grouped here so the main navigation stays focused on spending tasks."
    />

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-amber-50 text-2xl font-black text-amber-700">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-2xl font-black text-slate-950">
              {{ user?.fullName || 'Duit user' }}
            </p>
            <p class="mt-1 truncate text-sm font-semibold text-slate-500">
              {{ user?.email || 'No email available' }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          {{ user?.preferredCurrency || 'MYR' }}
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2">
      <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <AppIcon name="user" />
          </span>
          <div>
            <h2 class="text-lg font-black text-slate-950">
              Profile
            </h2>
            <p class="text-sm font-semibold text-slate-500">
              Name, email, and default currency.
            </p>
          </div>
        </div>

        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <dt class="font-black text-slate-500">
              Name
            </dt>
            <dd class="truncate font-black text-slate-950">
              {{ user?.fullName || 'Not set' }}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
            <dt class="font-black text-slate-500">
              Currency
            </dt>
            <dd class="font-black text-slate-950">
              {{ user?.preferredCurrency || 'MYR' }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 p-2.5 text-slate-700">
            <AppIcon name="settings" />
          </span>
          <div>
            <h2 class="text-lg font-black text-slate-950">
              App settings
            </h2>
            <p class="text-sm font-semibold text-slate-500">
              Account-level controls only.
            </p>
          </div>
        </div>

        <div class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p class="text-sm font-black text-slate-950">
            Light mode only
          </p>
          <p class="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Duit now uses one bright minimalist theme so the interface stays consistent across mobile and desktop.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 shadow-sm">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-black text-slate-950">
            Session
          </h2>
          <p class="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Sign out from this browser. Your spending records stay saved on the backend.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="logoutPending"
          @click="handleLogout"
        >
          <span class="h-4 w-4"><AppIcon name="logout" /></span>
          {{ logoutPending ? 'Logging out...' : 'Log out' }}
        </button>
      </div>
    </section>
  </div>
</template>
