<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLogoutMutation } from '@/composables/useAuthMutations'
import PageHeader from '@/components/shared/PageHeader.vue'

const router = useRouter()
const authStore = useAuthStore()
const logoutMutation = useLogoutMutation()

const user = computed(() => authStore.user)
const firstName = computed(() => user.value?.fullName?.split(' ')[0] ?? 'User')
const userInitial = computed(() => firstName.value.charAt(0).toUpperCase())
const logoutPending = computed(() => logoutMutation.isPending.value)

async function handleLogout() {
  const result = await logoutMutation.mutateAsync(undefined)
  await router.replace(result.revoked ? '/login' : { name: 'login', query: { reason: 'logout-local' } })
}
</script>

<template><div class="you-page"><PageHeader title="You" description="Your account, preferences, and money habits." /><section class="you-person"><span class="you-avatar">{{ userInitial }}</span><div><h2>{{ user?.fullName || 'Duit user' }}</h2><p>{{ user?.email || 'No email available' }}</p></div></section><section class="you-section"><h2>Your progress</h2><div class="you-progress"><span class="you-progress-icon" aria-hidden="true">○</span><div><strong>Build your money habits</strong><p>Review spending each week and keep your activity organised. XP and achievements will appear here when progression is available.</p></div></div></section><section class="you-section"><h2>Money tools</h2><RouterLink to="/insights" class="you-row"><span>Weekly review</span><b>›</b></RouterLink><RouterLink to="/inbox" class="you-row"><span>Import spending</span><b>›</b></RouterLink><RouterLink to="/statements" class="you-row"><span>Bank statements</span><b>›</b></RouterLink></section><section class="you-section"><h2>Account</h2><div class="you-row"><span>Default currency</span><strong>{{ user?.preferredCurrency || 'MYR' }}</strong></div><RouterLink to="/settings/privacy" class="you-row"><span>Privacy and data</span><b>›</b></RouterLink><button type="button" class="you-row you-signout" :disabled="logoutPending" @click="handleLogout"><span>{{ logoutPending ? 'Signing out…' : 'Sign out' }}</span><b>›</b></button></section></div></template>
<style scoped>.you-page{max-width:740px;padding-bottom:60px}.you-person{display:flex;align-items:center;gap:16px;padding:22px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}.you-avatar{display:grid;place-items:center;width:56px;height:56px;flex:none;border-radius:14px;background:var(--accent-tint);color:var(--accent);font-size:21px;font-weight:600}.you-person h2{margin:0;font-size:18px}.you-person p{margin:4px 0 0;color:var(--muted);font-size:13px}.you-section{margin-top:32px}.you-section h2{margin:0 0 12px;font-size:17px}.you-progress{display:flex;gap:14px;padding:18px;border:1px solid var(--rule);border-radius:12px;background:#fff}.you-progress-icon{display:grid;place-items:center;width:36px;height:36px;flex:none;border-radius:9px;background:#FAEFD6;color:#806327;font-size:23px}.you-progress strong{font-size:14px;font-weight:600}.you-progress p{margin:4px 0 0;color:var(--muted);font-size:13px;line-height:19px}.you-row{display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:54px;padding:10px 0;border:0;border-top:1px solid var(--rule);background:transparent;color:var(--ink);font-size:14px;text-align:left;text-decoration:none}.you-row:last-child{border-bottom:1px solid var(--rule)}.you-row b{color:var(--accent);font-size:22px;font-weight:400}.you-row strong{font-size:13px;font-weight:500}.you-signout{color:#A34437}.you-signout b{color:#A34437}</style>
