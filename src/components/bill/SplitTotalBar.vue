<script setup lang="ts">
import { formatCurrency } from '@/utils/currency'

defineProps<{
  currency: string
  subtotal: string
  tax: string
  service: string
  total: string
  disabled?: boolean
  loading?: boolean
  actionLabel?: string
}>()

const emit = defineEmits<{
  (event: 'submit'): void
}>()
</script>

<template><aside class="split-total"><div class="split-total-main"><span>Your share <small>Includes tax and service</small></span><strong>{{ formatCurrency(total, currency) }}</strong></div><details><summary>See breakdown</summary><dl><div><dt>Items</dt><dd>{{ formatCurrency(subtotal, currency) }}</dd></div><div><dt>Tax</dt><dd>{{ formatCurrency(tax, currency) }}</dd></div><div><dt>Service</dt><dd>{{ formatCurrency(service, currency) }}</dd></div></dl></details><button v-if="actionLabel" type="button" :disabled="disabled || loading" @click="emit('submit')">{{ loading ? 'Saving…' : actionLabel }}</button><p>Duit records your share. Pay through your own bank or wallet.</p></aside></template>
<style scoped>
.split-total { position:fixed; z-index:30; left:0; right:0; bottom:0; max-width:620px; margin:auto; padding:15px 20px calc(15px + env(safe-area-inset-bottom)); border:1px solid var(--rule); border-bottom:0; border-radius:16px 16px 0 0; background:#fff; box-shadow:0 -8px 30px rgb(28 27 25 / 8%); }
.split-total-main { display:flex; justify-content:space-between; align-items:center; gap:16px; }
.split-total-main span { font-size:14px; font-weight:600; }
.split-total-main small { display:block; margin-top:3px; color:var(--muted); font-size:11px; font-weight:400; }
.split-total-main strong { font-size:23px; font-weight:600; font-variant-numeric:tabular-nums; }
.split-total details { margin:8px 0; color:var(--muted); font-size:12px; }
.split-total summary { cursor:pointer; }
.split-total dl { margin:7px 0; }
.split-total dl div { display:flex; justify-content:space-between; padding:3px 0; }
.split-total dd { margin:0; }
.split-total button { width:100%; min-height:48px; border:0; border-radius:9px; background:var(--accent); color:#fff; font-size:14px; font-weight:600; }
.split-total button:disabled { opacity:.5; }
.split-total p { margin:7px 0 0; color:var(--muted); font-size:11px; text-align:center; }
</style>
