<script setup lang="ts">
import { computed } from 'vue'
import type { CategorySummary } from '@/api/generated/model'
import { toPresentationNumber } from '@/utils/financialDecimal'

const props = defineProps<{ categories: CategorySummary[]; currency?: string }>()
const palette = ['#C9772E', '#A0566E', '#4C8466', '#3F6C98', '#B5AFA4']
const breakdown = computed(() => {
  const primary = props.categories.slice(0, 4).map((category, index) => ({
    name: category.categoryName,
    percentage: Math.max(0, toPresentationNumber(category.percentage)),
    color: palette[index],
  }))
  const rest = props.categories.slice(4).reduce((sum, category) => sum + Math.max(0, toPresentationNumber(category.percentage)), 0)
  if (rest > 0) primary.push({ name: 'Other', percentage: rest, color: palette[4] })
  return primary
})
const description = computed(() => breakdown.value.map(category => `${category.name} ${Math.round(category.percentage)}%`).join(', '))
</script>

<template>
  <div v-if="breakdown.length" class="spending-breakdown">
    <div class="spending-bar" role="img" :aria-label="description">
      <span v-for="category in breakdown" :key="category.name" :style="{ width: `${category.percentage}%`, backgroundColor: category.color }" />
    </div>
    <div class="spending-legend">
      <div v-for="category in breakdown" :key="category.name" class="spending-legend-item">
        <span class="spending-dot" :style="{ backgroundColor: category.color }" />
        <span>{{ category.name }}</span>
        <b>{{ Math.round(category.percentage) }}%</b>
      </div>
    </div>
  </div>
  <p v-else class="home-quiet">Your category breakdown will appear when spending is recorded.</p>
</template>
