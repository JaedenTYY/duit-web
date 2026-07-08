<script setup lang="ts">
import type { GuestPaymentQrProfile, PaymentQrProfile } from '@/types'

defineProps<{
  profile: PaymentQrProfile | GuestPaymentQrProfile | null
}>()
</script>

<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-5">
    <h2 class="text-lg font-bold text-slate-900">
      Payment QR
    </h2>

    <div
      v-if="profile"
      class="mt-4"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-black text-slate-900">
            {{ profile.displayName }}
          </p>
          <p class="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            {{ profile.provider }}
          </p>
        </div>
      </div>

      <img
        v-if="profile.qrImageUrl"
        :src="profile.qrImageUrl"
        alt="Payment QR"
        class="mt-4 aspect-square w-full max-w-64 rounded-2xl border border-slate-200 object-contain"
      >
      <p
        v-else-if="profile.qrPayload"
        class="mt-4 break-all rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600"
      >
        {{ profile.qrPayload }}
      </p>
    </div>

    <p
      v-else
      class="mt-4 text-sm leading-6 text-slate-500"
    >
      No payment QR selected yet.
    </p>
  </section>
</template>
