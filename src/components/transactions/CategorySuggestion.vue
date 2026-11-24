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
  return cat ? cat.name : 'Unknown'
})

const heading = computed(() => {
  switch (props.categorisation.source) {
    case 'USER_PREFERENCE': return 'Your saved category'
    case 'SYSTEM_MERCHANT': return 'Merchant category'
    case 'SEMANTIC_SIMILARITY': return 'Suggested category'
    case 'NONE': return ''
    default: return ''
  }
})

const description = computed(() => {
  switch (props.categorisation.source) {
    case 'USER_PREFERENCE': return 'Duit remembered your previous choice for this merchant.'
    case 'SYSTEM_MERCHANT': return 'This merchant usually belongs here.'
    case 'SEMANTIC_SIMILARITY': return 'This looks similar to other merchants in this category.'
    case 'NONE': return ''
    default: return ''
  }
})

const canForget = computed(() =>
  props.categorisation.source === 'USER_PREFERENCE' && Boolean(props.categorisation.merchantId)
)

</script>

<template><div v-if="categorisation.source !== 'NONE' && categorisation.categoryId" class="category-suggestion"><p class="category-eyebrow">{{ heading }}</p><div class="category-main"><div><strong>{{ suggestedCategoryName }}</strong><small>{{ description }}</small></div><button type="button" :aria-label="`Use ${suggestedCategoryName} category`" @click="emit('apply', categorisation.categoryId!)">Use this</button></div><button v-if="canForget" type="button" class="category-forget" aria-label="Forget saved category for this merchant" @click="emit('forget', categorisation.merchantId!)">Forget saved choice</button></div></template><style scoped>.category-suggestion{margin-top:10px;padding:13px;border-radius:10px;background:var(--accent-tint)}.category-eyebrow{margin:0 0 7px;color:var(--accent);font-size:12px;font-weight:600}.category-main{display:flex;align-items:center;justify-content:space-between;gap:12px}.category-main strong,.category-main small{display:block}.category-main strong{font-size:14px;font-weight:600}.category-main small{margin-top:3px;color:var(--muted);font-size:12px;line-height:17px}.category-main button{min-height:40px;flex:none;padding:0 10px;border:1px solid var(--accent);border-radius:8px;background:#fff;color:var(--accent);font-size:12px;font-weight:600}.category-forget{min-height:36px;margin-top:5px;padding:0;border:0;background:transparent;color:var(--muted);font-size:11px;text-decoration:underline}</style>
