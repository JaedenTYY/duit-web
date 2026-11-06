<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useLoginMutation, useRegisterMutation } from '@/composables/useAuthMutations'
import ApiErrorAlert from '@/components/shared/ApiErrorAlert.vue'
import { extractApiFailure, type ApiFailureDetails } from '@/lib/apiError'
import { useRetryAfterCooldown } from '@/composables/useRetryAfterCooldown'
import { resolveSafeInternalRedirect } from '@/router/safeRedirect'

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
const apiError = ref<ApiFailureDetails | null>(sessionExpiryFailure())
const loginMutation = useLoginMutation()
const registerMutation = useRegisterMutation()
const cooldown = useRetryAfterCooldown()

const isLogin = computed(() => mode.value === 'login')
const isSubmitting = computed(() => loginMutation.isPending.value || registerMutation.isPending.value)
const submitDisabled = computed(() => isSubmitting.value || cooldown.active.value)
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
    await router.replace(resolveSafeInternalRedirect(route.query.redirect, router) ?? '/dashboard')
  } catch (err: unknown) {
    const failure = extractApiFailure(err)
    apiError.value = failure
    if (failure.status === 429) cooldown.start(failure.retryAfterSeconds)
  }
})

function toggleMode() {
  const nextMode = isLogin.value ? 'register' : 'login'
  mode.value = nextMode
  apiError.value = null
  cooldown.clear()
  router.replace({ name: nextMode })
}

function sessionExpiryFailure(): ApiFailureDetails | null {
  if (route.query.reason !== 'session-expired' && route.query.reason !== 'logout-local') return null
  return {
    message: route.query.reason === 'logout-local'
      ? 'You are signed out locally. Duit could not confirm server revocation, so sign in again only if this device is trusted.'
      : 'Your session has expired. Please sign in again.',
    requestId: null,
    code: null,
    fields: null,
    status: 401,
    retryAfterSeconds: null,
    rateLimitResetAt: null,
    supportWorthy: false,
  }
}

watch(
  () => route.name,
  (name) => {
    mode.value = name === 'register' ? 'register' : 'login'
    apiError.value = sessionExpiryFailure()
    resetForm()
  },
)
</script>

<template>
  <div class="auth-page">
    <nav class="auth-nav"><RouterLink to="/" class="auth-wordmark">duit<span>.</span></RouterLink><button type="button" @click="toggleMode">{{ isLogin ? 'Create account' : 'Sign in' }}</button></nav>
    <main class="auth-layout">
      <section class="auth-intro"><p class="auth-kicker">A clearer view of your money</p><h1>Make sense of<br>what you spend.</h1><p>Keep everyday spending, shared bills, and useful insights together.</p><div class="auth-intro-rule" /><div class="auth-proof"><span>01</span>Record what matters</div><div class="auth-proof"><span>02</span>Spot what changed</div><div class="auth-proof"><span>03</span>Split fairly</div></section>
      <section class="auth-form-panel"><div class="auth-form-heading"><h2>{{ isLogin ? 'Welcome back' : 'Start with Duit' }}</h2><p>{{ isLogin ? 'Sign in to see your spending.' : 'Create an account to keep your spending in view.' }}</p></div>
        <ApiErrorAlert v-if="apiError" :message="apiError.message" :reference-id="apiError.supportWorthy ? apiError.requestId : null" />
        <form class="auth-form" @submit.prevent="onSubmit">
          <div v-if="!isLogin"><label for="auth-name">Full name</label><input id="auth-name" v-model="fullName" v-bind="fullNameAttrs" type="text" autocomplete="name" placeholder="Aina Rahman" :aria-invalid="!!errors.fullName"><p v-if="errors.fullName" class="auth-error">{{ errors.fullName }}</p></div>
          <div><label for="auth-email">Email</label><input id="auth-email" v-model="email" v-bind="emailAttrs" type="email" autocomplete="email" placeholder="you@example.com" :aria-invalid="!!errors.email"><p v-if="errors.email" class="auth-error">{{ errors.email }}</p></div>
          <div><label for="auth-password">Password</label><input id="auth-password" v-model="password" v-bind="passwordAttrs" type="password" :autocomplete="isLogin ? 'current-password' : 'new-password'" placeholder="Your password" :aria-invalid="!!errors.password"><p v-if="errors.password" class="auth-error">{{ errors.password }}</p></div>
          <button data-testid="auth-submit" type="submit" :disabled="submitDisabled" class="auth-submit">{{ isSubmitting ? 'Please wait…' : cooldown.active.value ? `Try again in ${cooldown.remainingSeconds.value}s` : isLogin ? 'Sign in' : 'Create account' }}</button>
          <p v-if="cooldown.active.value" role="status" aria-live="polite" class="auth-cooldown">{{ cooldown.accessibleMessage.value }}</p>
        </form>
        <p class="auth-switch">{{ isLogin ? "New to Duit?" : "Already have an account?" }} <button type="button" @click="toggleMode">{{ isLogin ? 'Create account' : 'Sign in' }}</button></p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-page { min-height:100dvh; background:var(--paper); color:var(--ink); }
.auth-nav { display:flex; align-items:center; justify-content:space-between; max-width:1160px; min-height:76px; margin:auto; padding:0 24px; }
.auth-wordmark { color:var(--accent); font-size:27px; font-weight:700; letter-spacing:-.06em; text-decoration:none; }
.auth-wordmark span { color:#D9A23A; }
.auth-nav button { min-height:44px; border:0; background:transparent; color:var(--accent); font-size:14px; font-weight:600; }
.auth-layout { display:grid; grid-template-columns:1fr minmax(340px,420px); align-items:center; gap:12%; max-width:1080px; min-height:calc(100dvh - 76px); margin:auto; padding:48px 24px 100px; }
.auth-intro { align-self:center; }
.auth-kicker { margin-bottom:18px; color:var(--accent); font-size:13px; font-weight:600; }
.auth-intro h1 { margin:0; font-size:clamp(42px,5vw,64px); line-height:1.08; letter-spacing:-.05em; }
.auth-intro > p:not(.auth-kicker) { max-width:390px; margin:22px 0; color:var(--muted); font-size:17px; line-height:1.55; }
.auth-intro-rule { width:50px; height:3px; margin:34px 0 22px; background:#D9A23A; }
.auth-proof { display:flex; align-items:center; gap:15px; padding:10px 0; color:var(--muted); font-size:14px; }
.auth-proof span { color:var(--accent); font-size:12px; font-weight:600; }
.auth-form-panel { padding:34px; border:1px solid var(--rule); border-radius:16px; background:#fff; }
.auth-form-heading { margin-bottom:28px; }
.auth-form-heading h2 { margin:0; font-size:25px; line-height:32px; }
.auth-form-heading p { margin:6px 0 0; color:var(--muted); font-size:14px; }
.auth-form { display:flex; flex-direction:column; gap:18px; }
.auth-form label { display:block; margin-bottom:7px; font-size:13px; font-weight:600; }
.auth-form input { width:100%; min-height:52px; padding:12px 14px; border:1px solid #D2CEC5; border-radius:10px; background:#fff; color:var(--ink); font-size:15px; }
.auth-form input::placeholder { color:#8D8880; }
.auth-form input[aria-invalid=true] { border-color:#A34437; }
.auth-error { margin:5px 0 0; color:#A34437; font-size:12px; }
.auth-submit { min-height:52px; margin-top:6px; border:0; border-radius:10px; background:var(--accent); color:#fff; font-size:15px; font-weight:600; }
.auth-submit:disabled { opacity:.55; }
.auth-switch { margin:24px 0 0; color:var(--muted); font-size:13px; text-align:center; }
.auth-switch button { min-height:44px; border:0; background:transparent; color:var(--accent); font-size:13px; font-weight:600; }
.auth-cooldown { color:#806327; font-size:13px; }
@media(max-width:760px) { .auth-nav { min-height:66px; padding:0 20px; } .auth-layout { display:block; min-height:auto; padding:38px 20px 60px; } .auth-intro { margin-bottom:35px; } .auth-intro h1 { font-size:38px; } .auth-intro > p:not(.auth-kicker) { font-size:15px; } .auth-intro-rule,.auth-proof { display:none; } .auth-form-panel { padding:24px 20px; } }
</style>
