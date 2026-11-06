<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template><header class="page-heading"><div><p v-if="eyebrow" class="page-eyebrow">{{ eyebrow }}</p><h1>{{ title }}</h1><p v-if="description" class="page-description">{{ description }}</p></div><div v-if="$slots.actions" class="page-actions"><slot name="actions" /></div></header></template><style scoped>.page-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:26px}.page-heading h1{margin:0;font-size:28px;line-height:34px;font-weight:600;letter-spacing:-.02em}.page-eyebrow{margin:0 0 4px;color:var(--muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}.page-description{margin:6px 0 0;max-width:610px;color:var(--muted);font-size:13px;line-height:19px;font-weight:400}.page-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:600px){.page-heading{flex-direction:column}.page-heading h1{font-size:28px}.page-actions{width:100%}}</style>
