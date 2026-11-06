<script setup lang="ts">

defineProps<{
  eyebrow: string
  title: string
  description: string
  progress: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
  primaryLabel: string
  backDisabled?: boolean
  isLast?: boolean
}>()

const emit = defineEmits<{
  (event: 'next'): void
  (event: 'back'): void
  (event: 'skip'): void
}>()
</script>

<template><section class="walkthrough"><div class="walkthrough-top"><span>{{ progress }}</span><button type="button" @click="emit('skip')">Skip</button></div><p class="walkthrough-eyebrow">{{ eyebrow }}</p><h2 id="onboarding-title">{{ title }}</h2><p class="walkthrough-description">{{ description }}</p><div class="walkthrough-actions"><button type="button" :disabled="backDisabled" @click="emit('back')">Back</button><button type="button" @click="emit('next')">{{ isLast ? 'Finish' : primaryLabel }}</button></div></section></template><style scoped>.walkthrough{pointer-events:auto;width:100%;max-width:460px;padding:24px;border-radius:16px;background:#fff;box-shadow:0 12px 40px rgb(28 27 25 / 15%)}.walkthrough-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:26px}.walkthrough-top span{color:var(--accent);font-size:12px;font-weight:600}.walkthrough-top button{min-height:44px;border:0;background:transparent;color:var(--muted);font-size:13px}.walkthrough-eyebrow{margin:0 0 6px;color:var(--accent);font-size:12px;font-weight:600}.walkthrough h2{margin:0;font-size:23px}.walkthrough-description{margin:10px 0 26px;color:var(--muted);font-size:14px;line-height:22px}.walkthrough-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.walkthrough-actions button{min-height:48px;border:1px solid var(--rule);border-radius:9px;background:#fff;color:var(--ink);font-size:14px;font-weight:600}.walkthrough-actions button:disabled{opacity:.4}.walkthrough-actions button:last-child{border-color:var(--accent);background:var(--accent);color:#fff}</style>
