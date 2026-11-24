<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBillStore } from '@/stores/bill'
import AppIcon, { type AppIconName } from '@/components/shared/AppIcon.vue'
import AddActionSheet from '@/components/shared/AddActionSheet.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import OnboardingWalkthrough from '@/components/shared/OnboardingWalkthrough.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const billStore = useBillStore()
const showAddSheet = ref(false)
const showCaptureModal = ref(false)
const hideNav = computed(() => route.meta.hideNav === true)

interface NavItem {
  to: string
  label: string
  icon: AppIconName
  badge?: number
}

const navItems = computed<NavItem[]>(() => [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/transactions', label: 'Activity', icon: 'list' },
  {
    to: '/split-bill',
    label: 'Split',
    icon: 'users',
    badge: billStore.bill ? 1 : undefined,
  },
  { to: '/settings', label: 'You', icon: 'user' },
])

const active = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`)

function openScan() {
  showAddSheet.value = false
  showCaptureModal.value = true
}

function openManual() {
  showAddSheet.value = false
  void router.push({ path: '/transactions', query: { add: '1' } })
}

function openSplit() {
  showAddSheet.value = false
  void router.push('/split-bill')
}
</script>

<template>
  <div class="duit-app" :class="{ 'duit-app--with-nav': !hideNav }">
    <a v-if="!hideNav" href="#main-content" class="skip-link"
      >Skip to content</a
    >

    <!-- Desktop Sidebar -->
    <aside v-if="!hideNav" class="desktop-sidebar">
      <RouterLink to="/dashboard" class="wordmark" aria-label="Duit home">
        du<span class="wordmark-i" aria-hidden="true">ı</span>t
      </RouterLink>

      <button
        type="button"
        class="sidebar-add"
        aria-label="Add spending"
        @click="showAddSheet = true"
      >
        <AppIcon name="plus" /> Add
      </button>

      <nav aria-label="Main navigation" class="desktop-links">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ selected: active(item.to) }"
          :aria-current="active(item.to) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-user">
        {{ auth.user?.fullName || 'Your account' }}
      </div>
    </aside>

    <!-- Main Content -->
    <RouterView v-if="hideNav" />
    <main v-else id="main-content" class="app-content" tabindex="-1">
      <RouterView />
    </main>

    <!-- Mobile Navigation (5 Slots: Home, Activity, Add, Split, You) -->
    <nav v-if="!hideNav" class="mobile-navigation" aria-label="Main navigation">
      <RouterLink
        :to="navItems[0].to"
        :class="{ selected: active(navItems[0].to) }"
        :aria-current="active(navItems[0].to) ? 'page' : undefined"
      >
        <AppIcon :name="navItems[0].icon" />
        <span>{{ navItems[0].label }}</span>
      </RouterLink>

      <RouterLink
        :to="navItems[1].to"
        :class="{ selected: active(navItems[1].to) }"
        :aria-current="active(navItems[1].to) ? 'page' : undefined"
      >
        <AppIcon :name="navItems[1].icon" />
        <span>{{ navItems[1].label }}</span>
      </RouterLink>

      <button
        type="button"
        class="mobile-scan"
        aria-label="Add spending"
        @click="showAddSheet = true"
      >
        <span><AppIcon name="plus" /></span>
      </button>

      <RouterLink
        :to="navItems[2].to"
        :class="{ selected: active(navItems[2].to) }"
        :aria-current="active(navItems[2].to) ? 'page' : undefined"
      >
        <AppIcon :name="navItems[2].icon" />
        <span>{{ navItems[2].label }}</span>
      </RouterLink>

      <RouterLink
        :to="navItems[3].to"
        :class="{ selected: active(navItems[3].to) }"
        :aria-current="active(navItems[3].to) ? 'page' : undefined"
      >
        <AppIcon :name="navItems[3].icon" />
        <span>{{ navItems[3].label }}</span>
      </RouterLink>
    </nav>

    <OnboardingWalkthrough v-if="!hideNav && auth.isAuthenticated" />

    <AddActionSheet
      v-if="showAddSheet"
      @close="showAddSheet = false"
      @scan="openScan"
      @manual="openManual"
      @split="openSplit"
    />

    <ReceiptUploadModal
      v-if="showCaptureModal"
      @close="showCaptureModal = false"
      @success="showCaptureModal = false"
    />
  </div>
</template>
