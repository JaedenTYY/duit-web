<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import { formatCurrency } from '@/utils/currency'

const billStore = useBillStore()
const { bill, uploading, error } = storeToRefs(billStore)
const selectedFile = ref<File | null>(null)

function selectFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function uploadReceipt() {
  if (!selectedFile.value) return

  try {
    await billStore.createFromReceipt(selectedFile.value)
  } catch {
    // The store exposes the API error for rendering below.
  }
}
</script>

<template>
  <section>
    <h1 class="text-2xl font-bold text-slate-900">
      Split a bill
    </h1>
    <p class="mt-1 text-slate-600">
      Upload a receipt to create a draft bill.
    </p>

    <form
      class="mt-6 flex flex-col items-start gap-3"
      @submit.prevent="uploadReceipt"
    >
      <input
        type="file"
        accept="image/*"
        required
        @change="selectFile"
      >
      <button
        type="submit"
        :disabled="!selectedFile || uploading"
        class="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ uploading ? 'Reading receipt…' : 'Create bill' }}
      </button>
    </form>

    <p
      v-if="error"
      class="mt-4 text-red-600"
      role="alert"
    >
      {{ error }}
    </p>

    <section
      v-if="bill"
      class="mt-8"
    >
      <h2 class="text-xl font-semibold text-slate-900">
        {{ bill.merchantName || 'Unknown merchant' }}
      </h2>
      <p class="mt-1">
        Total: {{ formatCurrency(bill.totalAmount, bill.currency) }}
      </p>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr>
              <th class="border p-2">
                Item
              </th>
              <th class="border p-2">
                Quantity
              </th>
              <th class="border p-2">
                Unit price
              </th>
              <th class="border p-2">
                Line total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in bill.items"
              :key="item.id"
            >
              <td class="border p-2">
                {{ item.name }}
              </td>
              <td class="border p-2">
                {{ item.quantity }}
              </td>
              <td class="border p-2">
                {{ formatCurrency(item.unitPrice, bill.currency) }}
              </td>
              <td class="border p-2">
                {{ formatCurrency(item.lineTotal, bill.currency) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
