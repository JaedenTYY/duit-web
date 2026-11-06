<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template><section class="bill-empty"><span aria-hidden="true">○</span><div><h3>{{ title }}</h3><p>{{ message }}</p></div></section></template><style scoped>.bill-empty{display:flex;align-items:flex-start;gap:12px;padding:18px;border-radius:12px;background:#fff}.bill-empty>span{display:grid;place-items:center;width:36px;height:36px;flex:none;border-radius:9px;background:var(--accent-tint);color:var(--accent);font-size:22px}.bill-empty h3{margin:0;font-size:14px;font-weight:600}.bill-empty p{margin:4px 0 0;color:var(--muted);font-size:13px;line-height:19px}</style>
