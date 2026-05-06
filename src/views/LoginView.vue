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
    router.push('/')
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
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-0 left-0 w-full h-full">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="text-center mb-12 animate-fade-in">
        <h1 class="text-5xl font-black text-white tracking-tighter italic italic">DUIT<span class="text-emerald-500">.</span></h1>
        <p class="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">
          {{ isLogin ? 'Accessing Secure Ledger' : 'Initializing New Identity' }}
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl shadow-black/50">
        
        <!-- Error Response -->
        <div 
          v-if="authStore.error"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
          {{ authStore.error }}
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div v-if="!isLogin" class="space-y-2 animate-slide-up">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Full Name</label>
            <input
              v-model="fullName"
              type="text"
              placeholder="JAEDEN TING"
              required
              class="cyber-input"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Identity (Email)</label>
            <input
              v-model="email"
              type="email"
              placeholder="USER@DUIT.TECH"
              required
              class="cyber-input"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Access Key (Password)</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="cyber-input"
            />
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl 
                   hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 
                   disabled:opacity-30 disabled:cursor-not-allowed mt-8"
          >
            <span v-if="authStore.loading">
              {{ isLogin ? 'Verifying...' : 'Processing...' }}
            </span>
            <span v-else>
              {{ isLogin ? 'Authenticate' : 'Authorize Identity' }}
            </span>
          </button>
        </form>

        <!-- Toggle mode -->
        <div class="text-center mt-8">
          <button
            class="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            @click="toggleMode"
          >
            {{ isLogin ? '[ No Account? Register ]' : '[ Existing Identity? Sign In ]' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cyber-input {
  @apply w-full bg-slate-800/30 border border-slate-800/50 rounded-2xl px-5 py-4 text-white font-bold 
         placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
         focus:bg-slate-800/50 transition-all;
}

.animate-fade-in {
  animation: fadeIn 1s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
