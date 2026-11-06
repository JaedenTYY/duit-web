<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppIcon, { type AppIconName } from '@/components/shared/AppIcon.vue'
import AddActionSheet from '@/components/shared/AddActionSheet.vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import OnboardingWalkthrough from '@/components/shared/OnboardingWalkthrough.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const showAddSheet = ref(false)
const showCaptureModal = ref(false)
const hideNav = computed(() => route.meta.hideNav === true)
const items: { to: string; label: string; icon: AppIconName }[] = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/transactions', label: 'Activity', icon: 'card' },
  { to: '/split-bill', label: 'Split', icon: 'users' },
  { to: '/settings', label: 'You', icon: 'user' },
]
const active = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

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
  <div class="duit-app">
    <a v-if="!hideNav" href="#main-content" class="skip-link">Skip to content</a>
    <aside v-if="!hideNav" class="desktop-sidebar">
      <RouterLink to="/dashboard" class="wordmark" aria-label="Duit home">
        du<span class="wordmark-i" aria-hidden="true">ı</span>t
      </RouterLink>
      <button type="button" class="sidebar-add" @click="showAddSheet = true">
        <AppIcon name="plus" /> Add spending
      </button>
      <nav aria-label="Main navigation" class="desktop-links">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ selected: active(item.to) }"
          :aria-current="active(item.to) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" />{{ item.label }}
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <p>{{ auth.user?.fullName || 'Your account' }}</p>
        <small>Keep your spending in view.</small>
      </div>
    </aside>

    <main id="main-content" :class="hideNav ? '' : 'app-content'" tabindex="-1">
      <RouterView />
    </main>

    <nav v-if="!hideNav" class="mobile-navigation" aria-label="Main navigation">
      <RouterLink
        v-for="item in items.slice(0, 2)"
        :key="item.to"
        :to="item.to"
        :class="{ selected: active(item.to) }"
        :aria-current="active(item.to) ? 'page' : undefined"
      >
        <span><AppIcon :name="item.icon" /></span>{{ item.label }}
      </RouterLink>
      <button type="button" class="mobile-scan" aria-label="Add spending" @click="showAddSheet = true">
        <span><AppIcon name="plus" /></span>
      </button>
      <RouterLink
        v-for="item in items.slice(2)"
        :key="item.to"
        :to="item.to"
        :class="{ selected: active(item.to) }"
        :aria-current="active(item.to) ? 'page' : undefined"
      >
        <span><AppIcon :name="item.icon" /></span>{{ item.label }}
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
