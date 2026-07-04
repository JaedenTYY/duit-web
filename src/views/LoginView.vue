<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

type Mode = 'login' | 'register'
const mode = ref<Mode>('login')

const email = ref('')
const password = ref('')
const fullName = ref('')
const isLogin = computed(() => mode.value === 'login')

async function handleSubmit() {
  try {
    if (isLogin.value) {
      await authStore.login({ email: email.value, password: password.value })
    } else {
      await authStore.register({
        email: email.value,
        password: password.value,
        fullName: fullName.value,
      })
    }
    router.push('/dashboard')
  } catch {
    // Error is already set in authStore.error
  }
}

function toggleMode() {
  mode.value = isLogin.value ? 'register' : 'login'
  authStore.error = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-500/20 selection:text-blue-900">
    <!-- Premium Ambient Background Gradients -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
    <div class="absolute -bottom-64 -right-64 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] opacity-40 pointer-events-none" />

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="text-center mb-10 animate-fade-in">
        <h1 class="text-4xl font-bold tracking-tight mb-2">
          duit<span class="text-blue-500">.</span>
        </h1>
        <p class="text-slate-500 font-medium text-sm">
          {{ isLogin ? 'Welcome back.' : 'Create your account.' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50">
        <!-- Error Response -->
        <div 
          v-if="authStore.error"
          class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-3"
        >
          <svg
            class="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          /></svg>
          {{ authStore.error }}
        </div>

        <form
          class="space-y-5"
          @submit.prevent="handleSubmit"
        >
          <div
            v-if="!isLogin"
            class="space-y-2 animate-slide-up"
          >
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Full Name</label>
            <input
              v-model="fullName"
              type="text"
              placeholder="Steve Jobs"
              required
              class="premium-input"
            >
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              required
              class="premium-input"
            >
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="premium-input"
            >
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-4 bg-blue-600 text-white font-bold rounded-xl 
                   hover:bg-blue-500 active:scale-[0.98] transition-all shadow-lg shadow-blue-500/30 
                   disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex justify-center items-center gap-2"
          >
            <span v-if="authStore.loading">
              <svg
                class="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            <span v-else>
              {{ isLogin ? 'Sign In' : 'Sign Up' }}
            </span>
          </button>
        </form>

        <!-- Toggle mode -->
        <div class="text-center mt-8 pt-6 border-t border-slate-100">
          <p class="text-sm text-slate-500">
            {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
            <button
              class="font-bold text-blue-600 hover:text-blue-500 transition-colors"
              type="button"
              @click="toggleMode"
            >
              {{ isLogin ? 'Sign up' : 'Sign in' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.premium-input {
  @apply w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium 
         placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
         focus:border-blue-500 transition-all shadow-sm;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; height: 0; transform: translateY(-10px); }
  to { opacity: 1; height: auto; transform: translateY(0); }
}
</style>
