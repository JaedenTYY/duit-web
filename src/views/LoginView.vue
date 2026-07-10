<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useLoginMutation, useRegisterMutation } from '@/composables/useAuthMutations'
import FriendlyAvatar from '@/components/shared/FriendlyAvatar.vue'

const router = useRouter()
const route = useRoute()

type Mode = 'login' | 'register'
interface AuthFormValues {
  fullName: string
  email: string
  password: string
}

const loginSchema = z.object({
  fullName: z.string(),
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

const mode = ref<Mode>(route.name === 'register' ? 'register' : 'login')
const apiError = ref<string | null>(null)
const loginMutation = useLoginMutation()
const registerMutation = useRegisterMutation()

const isLogin = computed(() => mode.value === 'login')
const isSubmitting = computed(() => loginMutation.isPending.value || registerMutation.isPending.value)
const validationSchema = computed(() => toTypedSchema(isLogin.value ? loginSchema : registerSchema))

const { defineField, errors, handleSubmit, resetForm } = useForm<AuthFormValues>({
  validationSchema,
  initialValues: {
    fullName: '',
    email: '',
    password: '',
  },
})

const [fullName, fullNameAttrs] = defineField('fullName')
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  apiError.value = null
  try {
    if (isLogin.value) {
      await loginMutation.mutateAsync({ email: values.email, password: values.password })
    } else {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      })
    }
    router.push('/dashboard')
  } catch (err: unknown) {
    apiError.value = extractApiError(err)
  }
})

function toggleMode() {
  const nextMode = isLogin.value ? 'register' : 'login'
  mode.value = nextMode
  apiError.value = null
  router.replace({ name: nextMode })
}

function extractApiError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
    return axiosErr.response?.data?.error?.message ?? 'An unexpected error occurred'
  }
  return 'An unexpected error occurred'
}

watch(
  () => route.name,
  (name) => {
    mode.value = name === 'register' ? 'register' : 'login'
    apiError.value = null
    resetForm()
  },
)
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-[#f6f9ff] text-slate-950 selection:bg-blue-500/20 selection:text-blue-900">
    <div
      class="absolute inset-0 auth-scene"
      aria-hidden="true"
    />

    <nav class="relative z-10 flex h-16 items-center justify-between px-4 sm:px-8">
      <button
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/70 bg-white/80 px-4 text-sm font-black text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        @click="router.push('/')"
      >
        Back to Duit
      </button>
      <button
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-300/60 transition hover:bg-blue-700"
        @click="toggleMode"
      >
        {{ isLogin ? 'Create account' : 'Sign in' }}
      </button>
    </nav>

    <main class="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_0.85fr] lg:px-8">
      <section class="hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-cyan-400 to-emerald-300 p-8 text-white shadow-2xl shadow-blue-200/70 lg:block">
        <div class="flex items-center gap-4">
          <FriendlyAvatar
            tone="blue"
            size="md"
          />
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-blue-50">
              Friendly finance companion
            </p>
            <h1 class="mt-2 text-5xl font-black tracking-tight">
              Duit helps money feel less messy.
            </h1>
          </div>
        </div>
        <div class="mt-10 grid gap-4">
          <div class="auth-preview-card">
            <span>Receipt captured</span>
            <strong>RM 18.40</strong>
            <small>Food & Dining suggested</small>
          </div>
          <div class="auth-preview-card ml-12">
            <span>AI insight</span>
            <strong>Dining up 12%</strong>
            <small>Recommendation ready</small>
          </div>
          <div class="auth-preview-card">
            <span>Split bill</span>
            <strong>4 friends joined</strong>
            <small>Payment tracked manually</small>
          </div>
        </div>
      </section>

      <section class="mx-auto w-full max-w-md">
        <div class="mb-6 flex flex-col items-center text-center">
          <FriendlyAvatar
            tone="blue"
            size="md"
          />
          <h1 class="mt-5 text-4xl font-black tracking-tight">
            duit<span class="text-blue-600">.</span>
          </h1>
          <p class="mt-2 max-w-xs text-sm font-semibold leading-6 text-slate-600">
            {{ isLogin ? 'Welcome back. Continue organising your spending with Duit.' : 'Create your Duit account and start tracking with context.' }}
          </p>
        </div>

        <div class="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-2xl shadow-blue-100/70 backdrop-blur-xl sm:p-7">
          <div
            v-if="apiError"
            class="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            <span class="h-2 w-2 shrink-0 rounded-full bg-red-500" />
            {{ apiError }}
          </div>

          <form
            class="space-y-5"
            @submit.prevent="onSubmit"
          >
            <div
              v-if="!isLogin"
              class="space-y-2"
            >
              <label class="auth-label">Full Name</label>
              <input
                v-model="fullName"
                v-bind="fullNameAttrs"
                type="text"
                placeholder="Aina Rahman"
                class="auth-input"
                :aria-invalid="!!errors.fullName"
              >
              <p
                v-if="errors.fullName"
                class="auth-error"
              >
                {{ errors.fullName }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="auth-label">Email</label>
              <input
                v-model="email"
                v-bind="emailAttrs"
                type="email"
                placeholder="you@example.com"
                class="auth-input"
                :aria-invalid="!!errors.email"
              >
              <p
                v-if="errors.email"
                class="auth-error"
              >
                {{ errors.email }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="auth-label">Password</label>
              <input
                v-model="password"
                v-bind="passwordAttrs"
                type="password"
                placeholder="Password"
                class="auth-input"
                :aria-invalid="!!errors.password"
              >
              <p
                v-if="errors.password"
                class="auth-error"
              >
                {{ errors.password }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="mt-7 flex min-h-13 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-4 text-base font-black text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isSubmitting ? 'Please wait...' : isLogin ? 'Sign in to Duit' : 'Create Duit account' }}
            </button>
          </form>

          <div class="mt-7 border-t border-slate-100 pt-5 text-center">
            <p class="text-sm font-semibold text-slate-500">
              {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
              <button
                class="font-black text-blue-600 transition hover:text-blue-700"
                type="button"
                @click="toggleMode"
              >
                {{ isLogin ? 'Sign up' : 'Sign in' }}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-scene {
  background:
    radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.18), transparent 28%),
    radial-gradient(circle at 85% 20%, rgba(45, 212, 191, 0.22), transparent 30%),
    radial-gradient(circle at 50% 85%, rgba(251, 146, 60, 0.16), transparent 32%),
    linear-gradient(135deg, #f6f9ff, #eefdf8 48%, #fff7ed);
}

.auth-preview-card {
  width: min(26rem, 100%);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.22);
  padding: 1.2rem;
  backdrop-filter: blur(18px);
}

.auth-preview-card span,
.auth-preview-card strong,
.auth-preview-card small {
  display: block;
}

.auth-preview-card span {
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.74);
}

.auth-preview-card strong {
  margin-top: 0.45rem;
  font-size: 1.7rem;
  font-weight: 900;
}

.auth-preview-card small {
  margin-top: 0.25rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.78);
}

.auth-label {
  @apply block px-1 text-xs font-black uppercase tracking-wider text-slate-500;
}

.auth-input {
  @apply w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-semibold text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100;
}

.auth-error {
  @apply px-1 text-xs font-bold text-red-600;
}
</style>
