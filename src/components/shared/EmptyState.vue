<script setup lang="ts">

withDefaults(defineProps<{
  title: string
  message: string
  actionLabel?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'rose'
}>(), {
  tone: 'blue',
})

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template><section class="duit-empty"><span class="duit-empty-icon" aria-hidden="true">○</span><h2>{{ title }}</h2><p>{{ message }}</p><button v-if="actionLabel" type="button" @click="emit('action')">{{ actionLabel }}</button><div v-if="$slots.actions" class="duit-empty-actions"><slot name="actions" /></div></section></template><style scoped>.duit-empty{padding:34px 20px;border-radius:14px;background:#fff;text-align:center}.duit-empty-icon{display:grid;place-items:center;width:42px;height:42px;margin:0 auto 14px;border-radius:11px;background:var(--accent-tint);color:var(--accent);font-size:25px}.duit-empty h2{margin:0;font-size:17px}.duit-empty p{max-width:360px;margin:7px auto 0;color:var(--muted);font-size:13px;line-height:20px}.duit-empty button{min-height:44px;margin-top:17px;padding:0 16px;border:0;border-radius:9px;background:var(--accent);color:#fff;font-size:13px;font-weight:600}.duit-empty-actions{margin-top:16px}</style>
