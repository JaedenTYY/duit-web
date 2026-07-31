import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import { useAuthStore } from '@/stores/auth'
import {
  configureSessionLifecycle,
  initializeSession,
} from '@/lib/sessionCoordinator'

const app = createApp(App)
const pinia = createPinia()
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

app.use(pinia)

useAuthStore(pinia)
configureSessionLifecycle()
const sessionBootstrap = initializeSession()

app.use(VueQueryPlugin, { queryClient })
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})
void sessionBootstrap.finally(() => {
  app.use(router)
  app.mount('#app')
})
