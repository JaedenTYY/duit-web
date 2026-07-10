<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useGmailStore } from '@/stores/gmail'
import { useTransactionStore } from '@/stores/transaction'
import EmptyState from '@/components/shared/EmptyState.vue'
import ErrorBanner from '@/components/shared/ErrorBanner.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import PageHeader from '@/components/shared/PageHeader.vue'
import type { EmailExtraction } from '@/types'

const store = useGmailStore()
const transactionStore = useTransactionStore()
const categoryOverrides = reactive<Record<string, string>>({})

onMounted(async () => {
  await Promise.all([store.initialise(), transactionStore.fetchCategories()])
  for (const extraction of store.extractions) {
    categoryOverrides[extraction.id] = extraction.suggestedCategoryId ?? ''
  }
})

function money(extraction: EmailExtraction) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: extraction.currency,
  }).format(Number(extraction.amount))
}

async function sync() {
  await store.sync()
  for (const extraction of store.extractions) {
    categoryOverrides[extraction.id] = extraction.suggestedCategoryId ?? ''
  }
}
</script>

<template>
  <div class="pb-32">
    <PageHeader
      class="mb-8"
      eyebrow="eReceipt inbox"
      title="Gmail receipts"
      description="Connect Gmail with read-only access, sync receipt emails, and review every transaction before import."
    />

    <ErrorBanner
      class="mb-6"
      :message="store.error"
    />

    <LoadingSkeleton
      v-if="store.loading"
      :rows="2"
      variant="list"
    />

    <template v-else>
      <section class="mb-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
              <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div class="min-w-0">
              <h2 class="text-xl font-bold text-slate-900">
                {{ store.status?.connected ? 'Gmail connected' : 'Connect Gmail' }}
              </h2>
              <p v-if="store.status?.providerEmail" class="mt-1 truncate text-sm font-semibold text-slate-600">
                {{ store.status.providerEmail }}
              </p>
              <p class="mt-1 text-sm text-slate-500">
                {{ store.status?.connected
                  ? 'Read-only access. Duit cannot send, edit, or delete email.'
                  : 'Only the Gmail read-only scope will be requested.' }}
              </p>
              <span
                v-if="store.status?.provider === 'mock'"
                class="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"
              >
                Mock provider
              </span>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <button
              v-if="!store.status?.connected"
              type="button"
              class="min-h-11 rounded-2xl bg-rose-600 px-6 py-3 font-black text-white disabled:opacity-60"
              :disabled="store.connecting"
              @click="store.connect"
            >
              {{ store.connecting ? 'Connecting…' : 'Connect Gmail' }}
            </button>
            <template v-else>
              <button
                type="button"
                class="min-h-11 rounded-2xl bg-blue-600 px-6 py-3 font-black text-white disabled:opacity-60"
                :disabled="store.syncing"
                @click="sync"
              >
                {{ store.syncing ? 'Syncing…' : 'Sync eReceipts' }}
              </button>
              <button
                type="button"
                class="min-h-11 rounded-2xl border border-slate-200 px-5 py-3 font-black text-slate-600 hover:border-red-200 hover:text-red-600"
                @click="store.disconnect"
              >
                Disconnect
              </button>
            </template>
          </div>
        </div>
      </section>

      <section
        v-if="store.lastSync"
        class="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-800"
      >
        Found {{ store.lastSync.discoveredCount }} messages:
        {{ store.lastSync.createdCount }} new,
        {{ store.lastSync.duplicateCount }} already synced,
        {{ store.lastSync.ignoredCount }} ignored.
      </section>

      <section v-if="store.status?.connected">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Pending eReceipts</h2>
            <p class="text-sm text-slate-500">Nothing imports until you confirm it.</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
            {{ store.extractions.length }}
          </span>
        </div>

        <div
          v-if="store.extractions.length === 0"
        >
          <EmptyState
            title="No pending eReceipts"
            message="Sync Gmail to look for recent receipt emails. Nothing imports until you confirm it."
            tone="rose"
          />
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-2">
          <article
            v-for="extraction in store.extractions"
            :key="extraction.id"
            class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-400">
                  {{ extraction.sender }}
                </p>
                <h3 class="mt-1 truncate text-lg font-black text-slate-900">
                  {{ extraction.merchantName }}
                </h3>
                <p class="mt-1 truncate text-sm text-slate-500">
                  {{ extraction.subject }}
                </p>
              </div>
              <p class="shrink-0 text-right text-lg font-black tabular-nums text-slate-900">
                {{ money(extraction) }}
              </p>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="text-xs text-slate-400">Transaction date</p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ new Date(extraction.occurredAt).toLocaleDateString() }}
                </p>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <p class="text-xs text-slate-400">Confidence</p>
                <p class="mt-1 font-semibold text-slate-700">
                  {{ extraction.categorisationConfidence ?? 'No match' }}
                </p>
              </div>
            </div>

            <label class="mt-5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Category
              <select
                v-model="categoryOverrides[extraction.id]"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700"
              >
                <option value="">No category</option>
                <option
                  v-for="category in transactionStore.categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </label>

            <div class="mt-5 flex gap-3">
              <button
                type="button"
                class="min-h-11 flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-black text-slate-600 disabled:opacity-50"
                :disabled="store.actionIds.has(extraction.id)"
                @click="store.skip(extraction.id)"
              >
                Skip
              </button>
              <button
                type="button"
                class="min-h-11 flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50"
                :disabled="store.actionIds.has(extraction.id)"
                @click="store.confirm(extraction.id, categoryOverrides[extraction.id] || undefined)"
              >
                Confirm
              </button>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
