<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  useLoginMutation,
  useRegisterMutation,
} from '@/composables/useAuthMutations'
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
const isSubmitting = computed(
  () => loginMutation.isPending.value || registerMutation.isPending.value
)
const submitDisabled = computed(
  () => isSubmitting.value || cooldown.active.value
)
const validationSchema = computed(() =>
  toTypedSchema(isLogin.value ? loginSchema : registerSchema)
)

const { defineField, errors, handleSubmit, resetForm } =
  useForm<AuthFormValues>({
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
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      })
    } else {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      })
    }
    await router.replace(
      resolveSafeInternalRedirect(route.query.redirect, router) ?? '/dashboard'
    )
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
  void router.replace({ name: nextMode })
}

function sessionExpiryFailure(): ApiFailureDetails | null {
  if (
    route.query.reason !== 'session-expired' &&
    route.query.reason !== 'logout-local'
  )
    return null
  return {
    message:
      route.query.reason === 'logout-local'
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
  }
)
</script>

<template>
  <div class="auth-page">
    <nav class="auth-nav">
      <RouterLink to="/" class="wordmark" aria-label="Duit home">
        du<span class="wordmark-i" aria-hidden="true">ı</span>t
      </RouterLink>
      <button type="button" class="auth-switch-btn" @click="toggleMode">
        {{ isLogin ? 'Create account' : 'Sign in' }}
      </button>
    </nav>

    <main class="auth-layout">
      <section class="auth-intro">
        <span class="auth-kicker">A clearer view of everyday money</span>
        <h1>Make sense of<br />what you spend.</h1>
        <p>
          Keep everyday spending, shared bills, and useful insights together
          without spreadsheets.
        </p>
        <div class="auth-intro-rule" />
        <div class="auth-proof">
          <span>01</span>Record what matters with receipts & statements
        </div>
        <div class="auth-proof">
          <span>02</span>Spot what changed with online anomaly alerts
        </div>
        <div class="auth-proof">
          <span>03</span>Split bills fairly with zero guest friction
        </div>
      </section>

      <section class="auth-form-panel">
        <div class="auth-form-heading">
          <h2>{{ isLogin ? 'Welcome back' : 'Start with Duit' }}</h2>
          <p>
            {{
              isLogin
                ? 'Sign in to review your spending and activity.'
                : 'Create an account to keep your spending in view.'
            }}
          </p>
        </div>

        <ApiErrorAlert
          v-if="apiError"
          :message="apiError.message"
          :reference-id="apiError.supportWorthy ? apiError.requestId : null"
        />

        <form class="auth-form" @submit.prevent="onSubmit">
          <div v-if="!isLogin">
            <label for="auth-name">Full name</label>
            <input
              id="auth-name"
              v-model="fullName"
              v-bind="fullNameAttrs"
              type="text"
              autocomplete="name"
              placeholder="Aina Rahman"
              :aria-invalid="!!errors.fullName"
            />
            <p v-if="errors.fullName" class="auth-error">
              {{ errors.fullName }}
            </p>
          </div>

          <div>
            <label for="auth-email">Email</label>
            <input
              id="auth-email"
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              :aria-invalid="!!errors.email"
            />
            <p v-if="errors.email" class="auth-error">{{ errors.email }}</p>
          </div>

          <div>
            <label for="auth-password">Password</label>
            <input
              id="auth-password"
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              :autocomplete="isLogin ? 'current-password' : 'new-password'"
              placeholder="Your password"
              :aria-invalid="!!errors.password"
            />
            <p v-if="errors.password" class="auth-error">
              {{ errors.password }}
            </p>
          </div>

          <button
            data-testid="auth-submit"
            type="submit"
            :disabled="submitDisabled"
            class="auth-submit"
          >
            {{
              isSubmitting
                ? 'Please wait…'
                : cooldown.active.value
                  ? `Try again in ${cooldown.remainingSeconds.value}s`
                  : isLogin
                    ? 'Sign in'
                    : 'Create account'
            }}
          </button>

          <p
            v-if="cooldown.active.value"
            role="status"
            aria-live="polite"
            class="auth-cooldown"
          >
            {{ cooldown.accessibleMessage.value }}
          </p>
        </form>

        <p class="auth-switch">
          {{ isLogin ? 'New to Duit?' : 'Already have an account?' }}
          <button type="button" @click="toggleMode">
            {{ isLogin ? 'Create account' : 'Sign in' }}
          </button>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  background: var(--paper);
  color: var(--ink);
}

.auth-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1140px;
  min-height: 80px;
  margin: auto;
  padding: 0 24px;
}

.auth-switch-btn {
  min-height: 44px;
  border: 0;
  background: transparent;
  color: #0e5a52;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.auth-layout {
  display: grid;
  grid-template-columns: 1fr minmax(340px, 440px);
  align-items: center;
  gap: 10%;
  max-width: 1080px;
  min-height: calc(100dvh - 80px);
  margin: auto;
  padding: 48px 24px 96px;
}

.auth-intro {
  align-self: center;
}

.auth-kicker {
  display: block;
  margin-bottom: 16px;
  color: #0e5a52;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.auth-intro h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 56px);
  line-height: 1.1;
  letter-spacing: -0.04em;
  font-weight: 700;
  color: #1c1b19;
}

.auth-intro > p:not(.auth-kicker) {
  max-width: 420px;
  margin: 20px 0;
  color: #57534c;
  font-size: 16px;
  line-height: 1.55;
}

.auth-intro-rule {
  width: 40px;
  height: 3px;
  margin: 30px 0 20px;
  background: #d9a23a;
  border-radius: 2px;
}

.auth-proof {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  color: #57534c;
  font-size: 14px;
}

.auth-proof span {
  color: #0e5a52;
  font-size: 12px;
  font-weight: 700;
}

.auth-form-panel {
  padding: 36px 32px;
  border: 1px solid #e4e0d7;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(28, 27, 25, 0.04);
}

.auth-form-heading {
  margin-bottom: 24px;
}

.auth-form-heading h2 {
  margin: 0;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
  color: #1c1b19;
}

.auth-form-heading p {
  margin: 6px 0 0;
  color: #57534c;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-form label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1c1b19;
}

.auth-form input {
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  border: 1px solid #d6d1c6;
  border-radius: 10px;
  background: #ffffff;
  color: #1c1b19;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
}

.auth-form input:focus {
  border-color: #0e5a52;
}

.auth-form input::placeholder {
  color: #8d8880;
}

.auth-form input[aria-invalid='true'] {
  border-color: #a3421a;
}

.auth-error {
  margin: 5px 0 0;
  color: #a3421a;
  font-size: 12px;
}

.auth-submit {
  width: 100%;
  min-height: 52px;
  margin-top: 8px;
  border: 0;
  border-radius: 12px;
  background: #0e5a52;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.auth-submit:hover {
  background: #0a4540;
}

.auth-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-switch {
  margin: 24px 0 0;
  color: #57534c;
  font-size: 13px;
  text-align: center;
}

.auth-switch button {
  min-height: 44px;
  border: 0;
  background: transparent;
  color: #0e5a52;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 4px;
}

.auth-cooldown {
  color: #8f5b00;
  font-size: 13px;
  margin-top: 6px;
}

@media (max-width: 800px) {
  .auth-nav {
    min-height: 68px;
    padding: 0 20px;
  }
  .auth-layout {
    display: block;
    min-height: auto;
    padding: 32px 20px 60px;
  }
  .auth-intro {
    margin-bottom: 32px;
  }
  .auth-intro h1 {
    font-size: 36px;
  }
  .auth-intro-rule,
  .auth-proof {
    display: none;
  }
  .auth-form-panel {
    padding: 24px 20px;
  }
}
</style>
