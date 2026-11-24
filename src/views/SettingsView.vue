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
  await router.replace(
    result.revoked
      ? '/login'
      : { name: 'login', query: { reason: 'logout-local' } }
  )
}
</script>

<template>
  <div class="you-page">
    <PageHeader
      title="You"
      description="Manage your account and spending tools."
    />

    <!-- User Profile Header -->
    <section class="you-person" aria-label="Your profile">
      <span class="you-avatar" aria-hidden="true">{{ userInitial }}</span>
      <div class="you-person-details">
        <h2>{{ user?.fullName || 'Duit user' }}</h2>
        <p>{{ user?.email || 'No email available' }}</p>
      </div>
    </section>

    <div class="you-grid">
      <section class="you-section">
        <h2>Money tools</h2>
        <div class="grp">
          <RouterLink to="/insights" class="row">
            <div class="rt">
              <b>Weekly review & AI insights</b>
              <span>Evidence-based spending changes</span>
            </div>
            <span style="color: #0e5a52; font-size: 20px">›</span>
          </RouterLink>
          <RouterLink to="/inbox" class="row">
            <div class="rt">
              <b>Import spending</b>
              <span>Receipts, statements, and Gmail eReceipts</span>
            </div>
            <span style="color: #0e5a52; font-size: 20px">›</span>
          </RouterLink>
          <RouterLink to="/statements" class="row">
            <div class="rt">
              <b>Bank statements</b>
              <span>Import PDF statements from Maybank, CIMB</span>
            </div>
            <span style="color: #0e5a52; font-size: 20px">›</span>
          </RouterLink>
          <RouterLink to="/gmail" class="row">
            <div class="rt">
              <b>Gmail eReceipts</b>
              <span>Grab, Shopee, and food delivery extraction</span>
            </div>
            <span style="color: #0e5a52; font-size: 20px">›</span>
          </RouterLink>
        </div>
      </section>

      <section class="you-section">
        <h2>Account & preferences</h2>
        <div class="grp">
          <div class="row" style="cursor: default">
            <div class="rt">
              <b>Reporting cycle</b>
              <span>Spending totals reset each calendar month</span>
            </div>
            <strong style="font-size: 14px; font-weight: 600; color: #1c1b19"
              >1st of month</strong
            >
          </div>
          <div class="row" style="cursor: default">
            <div class="rt">
              <b>Default currency</b>
              <span>Used for overview figures</span>
            </div>
            <strong style="font-size: 14px; font-weight: 600; color: #1c1b19">{{
              user?.preferredCurrency || 'MYR'
            }}</strong>
          </div>
          <RouterLink to="/settings/privacy" class="row">
            <div class="rt">
              <b>Privacy & data</b>
              <span>Export records or manage stored credentials</span>
            </div>
            <span style="color: #0e5a52; font-size: 20px">›</span>
          </RouterLink>
          <button
            type="button"
            class="row"
            style="color: #a3421a; cursor: pointer"
            :disabled="logoutPending"
            @click="handleLogout"
          >
            <div class="rt">
              <b style="color: #a3421a">{{
                logoutPending ? 'Signing out…' : 'Sign out'
              }}</b>
              <span>Leave this session on this device</span>
            </div>
            <span style="color: #a3421a; font-size: 20px">›</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.you-person {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: var(--panel);
}

.you-avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 14px;
  background: #e2eeea;
  color: #0e5a52;
  font-size: 22px;
  font-weight: 600;
}

.you-person-details {
  min-width: 0;
  overflow-wrap: anywhere;
}

.you-person h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 600;
  color: #1c1b19;
}

.you-person p {
  margin: 3px 0 0;
  color: #57534c;
  font-size: 13px;
}

.you-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  margin-top: 28px;
}

.you-section {
  min-width: 0;
}

.you-section h2 {
  margin: 0 0 12px;
  font-size: 17px;
  font-weight: 600;
  color: #1c1b19;
}

@media (min-width: 1080px) {
  .you-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px;
    margin-top: 32px;
  }
}
</style>
