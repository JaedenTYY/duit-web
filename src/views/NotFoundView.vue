<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const recoveryTarget = computed(() => authStore.isAuthenticated ? '/dashboard' : '/login')
const recoveryLabel = computed(() => authStore.isAuthenticated ? 'Go home' : 'Sign in')
</script>

<template><main class="notfound"><section><p>Page not found</p><h1>We couldn't find that page.</h1><span>The link may be outdated or mistyped.</span><RouterLink :to="recoveryTarget">{{ recoveryLabel }}</RouterLink></section></main></template><style scoped>.notfound{min-height:100dvh;padding:80px 20px;background:var(--paper);color:var(--ink)}.notfound section{max-width:500px;margin:auto}.notfound p{margin:0 0 8px;color:var(--accent);font-size:13px;font-weight:600}.notfound h1{margin:0;font-size:28px}.notfound span{display:block;margin-top:12px;color:var(--muted);font-size:14px}.notfound a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;margin-top:26px;padding:0 18px;border-radius:9px;background:var(--accent);color:#fff;font-size:14px;font-weight:600;text-decoration:none}</style>
