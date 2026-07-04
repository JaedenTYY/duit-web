<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string // YYYY-MM-DD
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'close'): void
}>()

const currentDate = ref(props.modelValue ? new Date(props.modelValue) : new Date())
const currentMonth = ref(currentDate.value.getMonth())
const currentYear = ref(currentDate.value.getFullYear())

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const calendarDays = computed(() => {
  const days: { date: number, isCurrentMonth: boolean, fullDate: string }[] = []
  
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear.value, currentMonth.value, 0).getDate()
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const m = currentMonth.value === 0 ? 11 : currentMonth.value - 1
    const y = currentMonth.value === 0 ? currentYear.value - 1 : currentYear.value
    days.push({ 
      date: d, 
      isCurrentMonth: false,
      fullDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ 
      date: i, 
      isCurrentMonth: true,
      fullDate: `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    })
  }
  
  // Next month days to complete 6 rows
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const m = currentMonth.value === 11 ? 0 : currentMonth.value + 1
    const y = currentMonth.value === 11 ? currentYear.value + 1 : currentYear.value
    days.push({ 
      date: i, 
      isCurrentMonth: false,
      fullDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    })
  }
  
  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const selectDate = (fullDate: string) => {
  emit('update:modelValue', fullDate)
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[60] flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      @click="emit('close')"
    />
    
    <!-- Dialog -->
    <div class="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"
          @click="prevMonth"
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
            d="M15 19l-7-7 7-7"
          /></svg>
        </button>
        
        <h2 class="text-lg font-bold text-slate-900">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </h2>
        
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"
          @click="nextMonth"
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
            d="M9 5l7 7-7 7"
          /></svg>
        </button>
      </div>
      
      <!-- Days of Week -->
      <div class="grid grid-cols-7 mb-2">
        <div
          v-for="day in daysOfWeek"
          :key="day"
          class="text-center text-xs font-bold text-slate-400 tracking-wider"
        >
          {{ day }}
        </div>
      </div>
      
      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-y-2">
        <button 
          v-for="(day, idx) in calendarDays" 
          :key="idx"
          class="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-semibold transition-all"
          :class="[
            day.fullDate === props.modelValue 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold scale-110' 
              : day.isCurrentMonth 
                ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-600' 
                : 'text-slate-300 hover:text-slate-400',
            day.fullDate === new Date().toISOString().split('T')[0] && day.fullDate !== props.modelValue 
              ? 'bg-slate-100 text-blue-600' 
              : ''
          ]"
          @click="selectDate(day.fullDate)"
        >
          {{ day.date }}
        </button>
      </div>
    </div>
  </div>
</template>
