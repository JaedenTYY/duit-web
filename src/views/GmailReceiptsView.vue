<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useGmailStore } from '@/stores/gmail'
import { useTransactionStore } from '@/stores/transaction'
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
    <header class="mb-10">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
        eReceipt inbox
      </p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-slate-900">
        Gmail receipts
      </h1>
      <p class="mt-2 max-w-2xl text-slate-500">
        Connect Gmail with read-only access, sync receipt emails, and review every transaction before import.
      </p>
    </header>

    <div
      v-if="store.error"
      class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
    >
      {{ store.error }}
    </div>

    <div
      v-if="store.loading"
      class="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500"
    >
      Loading Gmail connection…
    </div>

    <template v-else>
      <section class="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
              ✉️
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-900">
                {{ store.status?.connected ? 'Gmail connected' : 'Connect Gmail' }}
              </h2>
              <p v-if="store.status?.providerEmail" class="mt-1 text-sm text-slate-600">
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
              class="rounded-2xl bg-red-600 px-6 py-3 font-bold text-white disabled:opacity-60"
              :disabled="store.connecting"
              @click="store.connect"
            >
              {{ store.connecting ? 'Connecting…' : 'Connect Gmail' }}
            </button>
            <template v-else>
              <button
                type="button"
                class="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-60"
                :disabled="store.syncing"
                @click="sync"
              >
                {{ store.syncing ? 'Syncing…' : 'Sync eReceipts' }}
              </button>
              <button
                type="button"
                class="rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:border-red-200 hover:text-red-600"
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
        class="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"
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
          class="rounded-3xl border border-slate-200 bg-white p-12 text-center"
        >
          <p class="text-3xl">📭</p>
          <h3 class="mt-3 font-bold text-slate-900">No pending eReceipts</h3>
          <p class="mt-1 text-sm text-slate-500">Sync Gmail to look for recent receipt emails.</p>
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-2">
          <article
            v-for="extraction in store.extractions"
            :key="extraction.id"
            class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-400">
                  {{ extraction.sender }}
                </p>
                <h3 class="mt-1 text-lg font-bold text-slate-900">
                  {{ extraction.merchantName }}
                </h3>
                <p class="mt-1 truncate text-sm text-slate-500">
                  {{ extraction.subject }}
                </p>
              </div>
              <p class="shrink-0 text-lg font-bold text-slate-900">
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
                class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700"
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
                class="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600 disabled:opacity-50"
                :disabled="store.actionIds.has(extraction.id)"
                @click="store.skip(extraction.id)"
              >
                Skip
              </button>
              <button
                type="button"
                class="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
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
