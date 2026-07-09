<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useStatementStore } from '@/stores/statement'
import { useTransactionStore } from '@/stores/transaction'
import type { StatementRow } from '@/types'

const store = useStatementStore()
const transactionStore = useTransactionStore()
const selectedIds = ref<Set<string>>(new Set())
const categoryOverrides = reactive<Record<string, string>>({})
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => transactionStore.fetchCategories())

watch(
  () => store.upload,
  (upload) => {
    selectedIds.value = new Set(
      upload?.rows
        .filter((row) => row.status === 'pending' && row.direction === 'debit')
        .map((row) => row.id) ?? [],
    )
    for (const row of upload?.rows ?? []) {
      categoryOverrides[row.id] = row.suggestedCategoryId ?? ''
    }
  },
)

const pendingRows = computed(() => store.upload?.rows.filter((row) => row.status === 'pending') ?? [])
const selectedTotal = computed(() =>
  pendingRows.value
    .filter((row) => selectedIds.value.has(row.id) && row.direction === 'debit')
    .reduce((total, row) => total + Number(row.amount), 0),
)

async function handleFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
  try {
    await store.uploadStatement(file)
  } catch {
    // Store exposes the API error.
  }
}

function toggle(rowId: string) {
  const next = new Set(selectedIds.value)
  next.has(rowId) ? next.delete(rowId) : next.add(rowId)
  selectedIds.value = next
}

async function confirmImport() {
  const rows = pendingRows.value
    .filter((row) => selectedIds.value.has(row.id))
    .map((row) => ({
      rowId: row.id,
      categoryId: categoryOverrides[row.id] || undefined,
    }))
  try {
    await store.confirmRows(rows)
  } catch {
    // Store exposes the API error.
  }
}

function money(row: StatementRow) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: row.currency,
  }).format(Number(row.amount))
}
</script>

<template>
  <div class="pb-32">
    <header class="mb-10">
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
        PDF import
      </p>
      <h1 class="mt-2 text-4xl font-bold tracking-tight text-slate-900">
        Bank statements
      </h1>
      <p class="mt-2 max-w-2xl text-slate-500">
        Upload a statement, review every parsed row, then import only the transactions you choose.
      </p>
    </header>

    <div
      v-if="store.error"
      class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
    >
      {{ store.error }}
    </div>

    <section
      v-if="!store.upload"
      class="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center md:p-14"
    >
      <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
        📄
      </div>
      <h2 class="text-xl font-bold text-slate-900">
        Choose a PDF statement
      </h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Maximum 10 MB. Raw PDF text is discarded after draft rows are created.
      </p>
      <input
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        class="hidden"
        @change="handleFile"
      >
      <button
        type="button"
        class="mt-6 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 disabled:opacity-60"
        :disabled="store.uploading"
        @click="fileInput?.click()"
      >
        {{ store.uploading ? 'Extracting statement…' : 'Upload PDF' }}
      </button>
    </section>

    <template v-else>
      <section
        v-if="store.result"
        class="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6"
      >
        <h2 class="text-lg font-bold text-emerald-800">
          Import complete
        </h2>
        <p class="mt-1 text-sm text-emerald-700">
          {{ store.result.importedCount }} transactions imported and
          {{ store.result.skippedCount }} rows skipped.
        </p>
      </section>

      <div class="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-bold text-slate-900">
            {{ store.upload.fileName }}
          </p>
          <p class="text-sm text-slate-500">
            {{ store.upload.rows.length }} parsed rows · {{ selectedIds.size }} selected
          </p>
        </div>
        <button
          type="button"
          class="text-sm font-bold text-slate-500 hover:text-red-600"
          @click="store.discardUpload"
        >
          {{ store.upload.status === 'pending' ? 'Discard draft' : 'Import another' }}
        </button>
      </div>

      <div class="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
        <table class="w-full text-left">
          <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th class="p-4">Import</th>
              <th class="p-4">Transaction</th>
              <th class="p-4">Category</th>
              <th class="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="row in store.upload.rows"
              :key="row.id"
              :class="{ 'opacity-50': row.status !== 'pending' }"
            >
              <td class="p-4">
                <input
                  type="checkbox"
                  class="h-5 w-5 rounded border-slate-300"
                  :checked="selectedIds.has(row.id)"
                  :disabled="row.status !== 'pending'"
                  @change="toggle(row.id)"
                >
              </td>
              <td class="p-4">
                <p class="font-semibold text-slate-900">{{ row.merchantName }}</p>
                <p class="max-w-xs truncate text-xs text-slate-500">{{ row.description }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ new Date(row.occurredAt).toLocaleDateString() }}</p>
              </td>
              <td class="p-4">
                <select
                  v-model="categoryOverrides[row.id]"
                  class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  :disabled="row.status !== 'pending'"
                >
                  <option value="">No category</option>
                  <option v-for="category in transactionStore.categories" :key="category.id" :value="category.id">
                    {{ category.icon }} {{ category.name }}
                  </option>
                </select>
                <p v-if="row.categorisationConfidence" class="mt-1 text-xs text-slate-400">
                  {{ row.categorisationConfidence }} confidence
                </p>
              </td>
              <td class="p-4 text-right">
                <p
                  class="font-bold"
                  :class="row.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'"
                >
                  {{ row.direction === 'credit' ? '+' : '−' }}{{ money(row) }}
                </p>
                <span class="text-xs uppercase text-slate-400">{{ row.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-4 md:hidden">
        <article
          v-for="row in store.upload.rows"
          :key="row.id"
          class="rounded-3xl border border-slate-200 bg-white p-5"
          :class="{ 'opacity-50': row.status !== 'pending' }"
        >
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 h-5 w-5 rounded border-slate-300"
              :checked="selectedIds.has(row.id)"
              :disabled="row.status !== 'pending'"
              @change="toggle(row.id)"
            >
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <p class="font-bold text-slate-900">{{ row.merchantName }}</p>
                <p :class="row.direction === 'credit' ? 'text-emerald-600' : 'text-slate-900'" class="font-bold">
                  {{ row.direction === 'credit' ? '+' : '−' }}{{ money(row) }}
                </p>
              </div>
              <p class="mt-1 text-sm text-slate-500">{{ row.description }}</p>
              <p class="mt-1 text-xs text-slate-400">{{ new Date(row.occurredAt).toLocaleDateString() }}</p>
              <select
                v-model="categoryOverrides[row.id]"
                class="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                :disabled="row.status !== 'pending'"
              >
                <option value="">No category</option>
                <option v-for="category in transactionStore.categories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
              <p v-if="row.categorisationConfidence" class="mt-1 text-xs text-slate-400">
                {{ row.categorisationConfidence }} confidence suggestion
              </p>
            </div>
          </div>
        </article>
      </div>

      <div
        v-if="store.upload.status === 'pending'"
        class="sticky bottom-20 mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between md:bottom-4"
      >
        <div>
          <p class="text-sm text-slate-500">Selected debit total</p>
          <p class="text-xl font-bold text-slate-900">
            RM {{ selectedTotal.toFixed(2) }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="selectedIds.size === 0 || store.confirming"
          @click="confirmImport"
        >
          {{ store.confirming ? 'Importing…' : `Import ${selectedIds.size} rows` }}
        </button>
      </div>
    </template>
  </div>
</template>
