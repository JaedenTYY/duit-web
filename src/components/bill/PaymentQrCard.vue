<script setup lang="ts">
import type { GuestPaymentQrProfile, PaymentQrProfile } from '@/types'

defineProps<{
  profile: PaymentQrProfile | GuestPaymentQrProfile | null
}>()
</script>

<template><section class="payment-qr"><h2>Payment details</h2><div v-if="profile"><p><strong>{{ profile.displayName }}</strong><small>{{ profile.provider }}</small></p><img v-if="profile.qrImageUrl" :src="profile.qrImageUrl" alt="Payment QR provided by the bill owner"><p v-else-if="profile.qrPayload" class="payment-note">{{ profile.qrPayload }}</p></div><p v-else class="payment-empty">The bill owner has not added payment details yet.</p></section></template><style scoped>.payment-qr{padding:18px;border:1px solid var(--rule);border-radius:12px;background:#fff}.payment-qr h2{margin:0 0 14px;font-size:16px}.payment-qr p{margin:0;font-size:14px}.payment-qr strong,.payment-qr small{display:block}.payment-qr small{margin-top:3px;color:var(--muted);font-size:12px}.payment-qr img{display:block;width:min(220px,100%);height:auto;margin:16px auto;border:1px solid var(--rule);border-radius:8px}.payment-note{margin-top:12px!important;overflow-wrap:anywhere;color:var(--muted)}.payment-empty{color:var(--muted);font-size:13px!important;line-height:19px}</style>