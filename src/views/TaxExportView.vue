<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaxStore } from '@/stores/tax'
import { formatCurrency } from '@/utils/currency'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const taxStore = useTaxStore()
const { summary, loading } = storeToRefs(taxStore)

const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)
const years = [currentYear, currentYear - 1, currentYear - 2]

onMounted(() => {
  taxStore.fetchTaxSummary(selectedYear.value)
})

watch(selectedYear, (newYear) => {
  taxStore.fetchTaxSummary(newYear)
})

const chartData = computed(() => {
  const categories = summary.value?.businessDeductionsByCategory || []
  if (!categories.length) {
    return {
      labels: ['No Data'],
      datasets: [{ backgroundColor: ['#1e293b'], data: [1], borderWidth: 0 }]
    }
  }
  return {
    labels: categories.map(c => c.categoryName),
    datasets: [
      {
        backgroundColor: categories.map(() => '#4f46e5'),
        data: categories.map(c => parseFloat(c.totalAmount as unknown as string)),
        borderWidth: 0,
        hoverOffset: 10,
        borderRadius: 4
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '80%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: function(context: any) {
          return ' RM ' + context.parsed.toFixed(2);
        }
      }
    }
  }
}

const handleExport = () => {
  window.print()
}
</script>

<template>
  <div class="space-y-8 pb-20">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
          Tax Export
        </h1>
        <p class="text-slate-400 mt-1 text-sm">
          LHDN-ready business deductions
        </p>
      </div>
      <div class="relative">
        <select 
          v-model="selectedYear"
          class="appearance-none bg-white border border-slate-700 text-slate-900 py-2 pl-4 pr-10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option
            v-for="year in years"
            :key="year"
            :value="year"
          >
            {{ year }}
          </option>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          /></svg>
        </div>
      </div>
    </header>

    <div
      v-if="loading"
      class="text-center py-20 text-slate-400 font-medium"
    >
      Calculating deductions...
    </div>

    <div
      v-else-if="summary"
      class="space-y-8"
    >
      <!-- High-Level Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50">
          <p class="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-2">
            Total Business Deductions
          </p>
          <h2 class="text-4xl font-bold text-slate-900 tracking-tight">
            {{ formatCurrency(summary.totalBusinessExpenses, 'MYR') }}
          </h2>
          <p class="text-indigo-400/80 text-sm mt-2 font-medium">
            Eligible for tax relief
          </p>
        </div>
        <div class="bg-white backdrop-blur-xl border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 opacity-80">
          <p class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">
            Personal Expenses
          </p>
          <h2 class="text-3xl font-bold text-slate-600 tracking-tight">
            {{ formatCurrency(summary.totalPersonalExpenses, 'MYR') }}
          </h2>
          <p class="text-slate-400 text-sm mt-2">
            Not deductible
          </p>
        </div>
      </div>

      <!-- Action Bar -->
      <button 
        class="w-full flex items-center justify-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-slate-200/50 shadow-white/10"
        @click="handleExport"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        /></svg>
        Export PDF for LHDN
      </button>

      <!-- Category Breakdown -->
      <div class="bg-white backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-12">
        <div class="w-full md:w-1/3 flex flex-col items-center">
          <h3 class="text-xl font-bold text-slate-900 mb-6 self-start w-full">
            Deductions by Category
          </h3>
          <div class="relative w-64 h-64 shrink-0">
            <Doughnut
              :data="chartData"
              :options="chartOptions"
            />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span class="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Deductible</span>
              <span class="text-2xl font-black text-slate-900">{{ formatCurrency(summary.totalBusinessExpenses, 'MYR') }}</span>
            </div>
          </div>
        </div>
        
        <div
          v-if="summary.businessDeductionsByCategory.length === 0"
          class="text-center py-10 text-slate-400 w-full md:w-2/3"
        >
          No business expenses tagged this year.
        </div>
        
        <div
          v-else
          class="space-y-4 w-full md:w-2/3"
        >
          <div 
            v-for="(cat, idx) in summary.businessDeductionsByCategory" 
            :key="idx"
            class="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-50"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                :style="{ backgroundColor: '#4f46e520', color: '#4f46e5' }"
              >
                <template v-if="cat.categoryIcon">
                  {{ cat.categoryIcon }}
                </template>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                /></svg>
              </div>
              <div>
                <p class="text-slate-900 font-bold">
                  {{ cat.categoryName }}
                </p>
                <p class="text-slate-400 text-xs">
                  {{ cat.transactionCount }} transactions
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-slate-900 font-mono font-bold">
                {{ formatCurrency(cat.totalAmount, 'MYR') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
