<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ApiErrorAlert from '@/components/shared/ApiErrorAlert.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import { useRetryAfterCooldown } from '@/composables/useRetryAfterCooldown'
import { apiFailureMessage, extractApiFailure } from '@/lib/apiError'
import {
  ACCOUNT_DELETION_PHRASE,
  deleteAccount,
  downloadPersonalData,
} from '@/lib/privacyTransport'
import { completeAccountDeletion } from '@/lib/sessionCoordinator'
import { useGmailStore } from '@/stores/gmail'

interface VisibleFailure {
  message: string
  requestId: string | null
}

const gmailStore = useGmailStore()
const exportPassword = ref('')
const exportPending = ref(false)
const exportFailure = ref<VisibleFailure | null>(null)
const exportStatus = ref('')
const exportCooldown = useRetryAfterCooldown()

const gmailMode = ref<'retain' | 'delete'>('retain')
const gmailDeletionConfirmed = ref(false)
const gmailFailure = ref<VisibleFailure | null>(null)
const gmailStatus = ref('')

const deletionPassword = ref('')
const deletionPhrase = ref('')
const deletionAcknowledged = ref(false)
const deletionPending = ref(false)
const deletionFailure = ref<VisibleFailure | null>(null)

const deletionReady = computed(() =>
  deletionPassword.value.length > 0 &&
  deletionPhrase.value === ACCOUNT_DELETION_PHRASE &&
  deletionAcknowledged.value &&
  !deletionPending.value
)

const gmailDisconnectReady = computed(() =>
  gmailStore.status?.connected &&
  !gmailStore.disconnecting &&
  (gmailMode.value === 'retain' || gmailDeletionConfirmed.value)
)

onMounted(() => {
  void gmailStore.initialise()
})

async function handleExport(): Promise<void> {
  if (exportPending.value || exportCooldown.active.value || !exportPassword.value) return
  exportPending.value = true
  exportFailure.value = null
  exportStatus.value = ''
  try {
    const filename = await downloadPersonalData(exportPassword.value)
    exportStatus.value = `${filename} was downloaded. Duit did not store the archive in this browser.`
  } catch (error: unknown) {
    const failure = extractApiFailure(error)
    exportCooldown.start(failure.status === 429 ? failure.retryAfterSeconds : null)
    exportFailure.value = {
      message: apiFailureMessage(failure, 'Your export could not be created.'),
      requestId: failure.requestId,
    }
  } finally {
    exportPassword.value = ''
    exportPending.value = false
  }
}

async function handleGmailDisconnect(): Promise<void> {
  if (!gmailDisconnectReady.value) return
  gmailFailure.value = null
  gmailStatus.value = ''
  const deleted = gmailMode.value === 'delete'
  const completed = await gmailStore.disconnect(deleted)
  if (completed) {
    gmailStatus.value = deleted
      ? 'Gmail was disconnected and attributable Gmail extraction records were deleted.'
      : 'Gmail was disconnected. Imported financial records were retained.'
    gmailDeletionConfirmed.value = false
    return
  }
  gmailFailure.value = {
    message: gmailStore.error ?? 'Gmail could not be disconnected.',
    requestId: gmailStore.errorRequestId,
  }
}

async function handleAccountDeletion(): Promise<void> {
  if (!deletionReady.value) return
  deletionPending.value = true
  deletionFailure.value = null
  try {
    await deleteAccount(deletionPassword.value, deletionPhrase.value)
    deletionPassword.value = ''
    deletionPhrase.value = ''
    deletionAcknowledged.value = false
    completeAccountDeletion()
  } catch (error: unknown) {
    const failure = extractApiFailure(error)
    deletionFailure.value = {
      message: apiFailureMessage(failure, 'Your account could not be deleted.'),
      requestId: failure.requestId,
    }
  } finally {
    deletionPassword.value = ''
    deletionPending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 pb-28">
    <PageHeader
      eyebrow="Privacy"
      title="Your data and account"
      description="Download an allowlisted copy of your data, manage Gmail access, or permanently delete your Duit account."
    />

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 class="text-xl font-black text-slate-950">
        Download my data
      </h2>
      <p class="mt-2 text-sm font-semibold leading-6 text-slate-600">
        The ZIP contains your profile, transactions, receipts, statement imports, Gmail extraction records,
        bills, insights, anomaly results, merchant preferences, and payment QR configuration. Passwords,
        session tokens, OAuth credentials, bill access tokens, and internal anomaly model state are excluded.
      </p>

      <ApiErrorAlert
        v-if="exportFailure"
        class="mt-5"
        :message="exportFailure.message"
        :reference-id="exportFailure.requestId"
      />
      <p
        v-if="exportStatus"
        class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
        role="status"
      >
        {{ exportStatus }}
      </p>

      <form
        class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        :aria-busy="exportPending"
        @submit.prevent="handleExport"
      >
        <label class="flex-1 text-sm font-black text-slate-700">
          Current password
          <input
            v-model="exportPassword"
            data-testid="privacy-export-password"
            type="password"
            autocomplete="current-password"
            required
            maxlength="128"
            class="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
        </label>
        <button
          type="submit"
          data-testid="privacy-export-submit"
          class="min-h-12 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="exportPending || exportCooldown.active.value || !exportPassword"
        >
          {{ exportPending ? 'Preparing export…' : exportCooldown.active.value ? `Try again in ${exportCooldown.remainingSeconds.value}s` : 'Download ZIP' }}
        </button>
      </form>
      <p
        class="mt-3 text-xs font-semibold text-slate-500"
        aria-live="polite"
      >
        {{ exportCooldown.accessibleMessage.value }}
      </p>
    </section>

    <section class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-slate-950">
            Gmail connection
          </h2>
          <p class="mt-1 text-sm font-semibold text-slate-500">
            {{ gmailStore.status?.connected ? 'Connected with Gmail read-only access.' : 'Gmail is not connected.' }}
          </p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-xs font-black"
          :class="gmailStore.status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
        >
          {{ gmailStore.status?.connected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <ApiErrorAlert
        v-if="gmailFailure"
        class="mt-5"
        :message="gmailFailure.message"
        :reference-id="gmailFailure.requestId"
      />
      <p
        v-if="gmailStatus"
        class="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
        role="status"
      >
        {{ gmailStatus }}
      </p>

      <fieldset
        v-if="gmailStore.status?.connected"
        class="mt-5 space-y-3"
      >
        <legend class="text-sm font-black text-slate-700">
          What should happen to Gmail-derived records?
        </legend>
        <label class="flex gap-3 rounded-2xl border border-slate-200 p-4">
          <input
            v-model="gmailMode"
            type="radio"
            value="retain"
          >
          <span>
            <strong class="block text-sm text-slate-900">Disconnect and retain financial records</strong>
            <span class="mt-1 block text-sm text-slate-600">OAuth credentials are erased; imported transactions and extraction records remain.</span>
          </span>
        </label>
        <label class="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <input
            v-model="gmailMode"
            type="radio"
            value="delete"
          >
          <span>
            <strong class="block text-sm text-slate-900">Delete attributable Gmail extraction records</strong>
            <span class="mt-1 block text-sm text-slate-600">Only records proven by the schema to originate from Gmail are deleted. Ambiguous or imported transactions remain.</span>
          </span>
        </label>
        <label
          v-if="gmailMode === 'delete'"
          class="flex items-start gap-3 rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-900"
        >
          <input
            v-model="gmailDeletionConfirmed"
            type="checkbox"
            class="mt-1"
          >
          I understand Gmail extraction records will be permanently deleted.
        </label>
        <button
          type="button"
          data-testid="gmail-disconnect-submit"
          class="min-h-12 rounded-2xl border border-rose-300 px-5 py-3 text-sm font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!gmailDisconnectReady"
          @click="handleGmailDisconnect"
        >
          {{ gmailStore.disconnecting ? 'Disconnecting…' : 'Disconnect Gmail' }}
        </button>
      </fieldset>
    </section>

    <section class="rounded-[2rem] border-2 border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-7">
      <h2 class="text-xl font-black text-rose-950">
        Delete account
      </h2>
      <p class="mt-2 text-sm font-semibold leading-6 text-rose-900/80">
        This permanently deletes your account and user-owned Duit records and revokes indexed browser sessions.
        It does not promise immediate removal from backups or third-party provider systems.
      </p>

      <ApiErrorAlert
        v-if="deletionFailure"
        class="mt-5"
        :message="deletionFailure.message"
        :reference-id="deletionFailure.requestId"
      />

      <form
        class="mt-5 space-y-4"
        :aria-busy="deletionPending"
        @submit.prevent="handleAccountDeletion"
      >
        <label class="block text-sm font-black text-rose-950">
          Current password
          <input
            v-model="deletionPassword"
            data-testid="delete-account-password"
            type="password"
            autocomplete="current-password"
            required
            maxlength="128"
            class="mt-2 min-h-12 w-full rounded-2xl border border-rose-200 bg-white px-4 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
        </label>
        <label class="block text-sm font-black text-rose-950">
          Type <code>{{ ACCOUNT_DELETION_PHRASE }}</code>
          <input
            v-model="deletionPhrase"
            data-testid="delete-account-phrase"
            type="text"
            autocomplete="off"
            spellcheck="false"
            required
            maxlength="64"
            class="mt-2 min-h-12 w-full rounded-2xl border border-rose-200 bg-white px-4 font-mono outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
        </label>
        <label class="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-rose-950">
          <input
            v-model="deletionAcknowledged"
            data-testid="delete-account-acknowledgement"
            type="checkbox"
            class="mt-1"
          >
          I understand this action cannot be undone and active tabs will be signed out.
        </label>
        <button
          type="submit"
          data-testid="delete-account-submit"
          class="min-h-12 rounded-2xl bg-rose-700 px-6 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!deletionReady"
        >
          {{ deletionPending ? 'Deleting account…' : 'Permanently delete account' }}
        </button>
      </form>
    </section>
  </div>
</template>
