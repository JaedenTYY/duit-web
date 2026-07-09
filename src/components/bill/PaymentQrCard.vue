<script setup lang="ts">
import type { GuestPaymentQrProfile, PaymentQrProfile } from '@/types'

defineProps<{
  profile: PaymentQrProfile | GuestPaymentQrProfile | null
}>()
</script>

<template>
  <section class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <h2 class="text-xl font-black text-slate-900">
      Payment QR
    </h2>

    <div
      v-if="profile"
      class="mt-5"
    >
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-base font-black text-slate-900">
            {{ profile.displayName }}
          </p>
          <p class="mt-1 text-[10px] font-black uppercase tracking-widest text-blue-500">
            {{ profile.provider }}
          </p>
        </div>
      </div>

      <img
        v-if="profile.qrImageUrl"
        :src="profile.qrImageUrl"
        alt="Payment QR"
        class="mt-5 aspect-square w-full max-w-64 rounded-3xl border-2 border-slate-100 object-contain shadow-sm"
      >
      <p
        v-else-if="profile.qrPayload"
        class="mt-5 break-all rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600 border border-slate-100"
      >
        {{ profile.qrPayload }}
      </p>
    </div>

    <p
      v-else
      class="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold leading-6 text-slate-500"
    >
      No payment QR selected yet.
    </p>
  </section>
</template>
