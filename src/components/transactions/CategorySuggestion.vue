<script setup lang="ts">
import { computed } from 'vue'
import type { CategorisationResult, Category } from '@/types'

const props = defineProps<{
  categorisation: CategorisationResult
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'apply', categoryId: string): void
  (e: 'forget', merchantId: string): void
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

const heading = computed(() => {
  switch (props.categorisation.source) {
    case 'USER_PREFERENCE': return 'Your saved category'
    case 'SYSTEM_MERCHANT': return 'Merchant category'
    case 'SEMANTIC_SIMILARITY': return 'Suggested from similar merchants'
    case 'NONE': return ''
    default: return ''
  }
})

const description = computed(() => {
  switch (props.categorisation.source) {
    case 'USER_PREFERENCE': return 'Duit remembered your previous choice for this merchant.'
    case 'SYSTEM_MERCHANT': return 'This is Duit’s baseline category for the exact merchant.'
    case 'SEMANTIC_SIMILARITY': return 'This suggestion is based on globally similar merchants.'
    case 'NONE': return ''
    default: return ''
  }
})

const canForget = computed(() =>
  props.categorisation.source === 'USER_PREFERENCE' && Boolean(props.categorisation.merchantId)
)
</script>

<template>
  <div
    v-if="categorisation.source !== 'NONE' && categorisation.categoryId"
    class="mt-3 p-4 rounded-xl border bg-slate-50/50 flex flex-col gap-3"
    :class="confidenceColor.split(' ')[2]"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-widest text-slate-500">{{ heading }}</span>
        <span
          v-if="categorisation.source === 'SEMANTIC_SIMILARITY' && categorisation.confidence"
          class="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest border"
          :class="confidenceColor"
        >
          {{ categorisation.confidence }}
        </span>
      </div>
      <div
        v-if="categorisation.source === 'SEMANTIC_SIMILARITY' && categorisation.similarityScore !== null"
        class="text-[10px] font-bold text-slate-400 font-mono"
      >
        Score: {{ (categorisation.similarityScore * 100).toFixed(1) }}%
      </div>
    </div>

    <p class="text-xs text-slate-500">
      {{ description }}
    </p>

    <div class="flex items-center justify-between">
      <div class="text-sm font-semibold text-slate-800">
        {{ suggestedCategoryName }}
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="text-xs font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
          :aria-label="`Use ${suggestedCategoryName} category`"
          @click="emit('apply', categorisation.categoryId!)"
        >
          Use category
        </button>
        <button
          v-if="canForget"
          type="button"
          class="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2"
          aria-label="Forget saved category for this merchant"
          @click="emit('forget', categorisation.merchantId!)"
        >
          Forget
        </button>
      </div>
    </div>
  </div>
</template>
