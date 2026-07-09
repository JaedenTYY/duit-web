<script setup lang="ts">
import { computed } from 'vue'
import type { CategorisationResult, Category } from '@/types'

const props = defineProps<{
  categorisation: CategorisationResult
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'apply', categoryId: string): void
}>()

const suggestedCategoryName = computed(() => {
  if (!props.categorisation.categoryId) return 'Unknown'
  const cat = props.categories.find(c => c.id === props.categorisation.categoryId)
  return cat ? `${cat.icon} ${cat.name}` : 'Unknown'
})

const confidenceColor = computed(() => {
  switch (props.categorisation.confidence) {
    case 'HIGH': return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
    case 'LOW': return 'text-red-500 bg-red-500/10 border-red-500/20'
    default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20'
  }
})
</script>

<template>
  <div class="mt-3 p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-3" :class="confidenceColor.split(' ')[2]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-widest text-slate-500">AI Suggestion</span>
        <span 
          class="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest border"
          :class="confidenceColor"
        >
          {{ categorisation.confidence }}
        </span>
      </div>
      <div class="text-[10px] font-bold text-slate-400 font-mono">
        Score: {{(categorisation.similarityScore * 100).toFixed(1)}}%
      </div>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="text-sm font-semibold text-slate-800">
        {{ suggestedCategoryName }}
      </div>
      
      <button
        v-if="categorisation.categoryId"
        type="button"
        class="text-xs font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
        @click="emit('apply', categorisation.categoryId)"
      >
        Correct Category
      </button>
    </div>
  </div>
</template>
