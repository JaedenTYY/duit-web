import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { hideNav: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { hideNav: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/LoginView.vue'),
      meta: { hideNav: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('@/views/TransactionsView.vue'),
    },
    {
      path: '/statements',
      name: 'statements',
      component: () => import('@/views/StatementImportView.vue'),
    },
    {
      path: '/inbox',
      name: 'inbox',
      component: () => import('@/views/InboxView.vue'),
    },
    {
      path: '/gmail',
      name: 'gmail-receipts',
      component: () => import('@/views/GmailReceiptsView.vue'),
    },
    {
      path: '/insights',
      name: 'insights',
      component: () => import('../views/InsightsView.vue')
    },
    {
      path: '/anomalies',
      name: 'anomalies',
      component: () => import('../views/InsightsView.vue')
    },
    {
      path: '/tax',
      name: 'tax',
      redirect: '/dashboard'
    },
    {
      path: '/goals',
      name: 'goals',
      redirect: '/dashboard'
    },
    {
      path: '/split-bill',
      name: 'split-bill',
      component: () => import('../views/SplitBillView.vue')
    },
    {
      path: '/split-bill/:id',
      name: 'owner-bill-split',
      component: () => import('../views/OwnerBillSplitView.vue')
    },
    {
      path: '/guest/bills/:shareToken',
      name: 'guest-bill-split',
      component: () => import('../views/GuestBillSplitView.vue'),
      meta: { hideNav: true }
    }
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (!to.meta.hideNav && !authStore.isAuthenticated) {
    next({ name: 'landing' })
  } else if ((to.name === 'landing' || to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
