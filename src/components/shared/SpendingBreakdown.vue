<script setup lang="ts">
import { computed } from 'vue'
import type { CategorySummary } from '@/api/generated/model'
import { toPresentationNumber } from '@/utils/financialDecimal'

const props = defineProps<{
  categories: CategorySummary[]
  currency?: string
}>()

const palette = ['#C9772E', '#A0566E', '#4C8466', '#3F6C98', '#B5AFA4']

const breakdown = computed(() => {
  if (!props.categories || props.categories.length === 0) return []
  const primary = props.categories.slice(0, 4).map((category, index) => ({
    name: category.categoryName,
    percentage: Math.max(0, toPresentationNumber(category.percentage)),
    color: palette[index % palette.length],
  }))
  const rest = props.categories
    .slice(4)
    .reduce(
      (sum, category) =>
        sum + Math.max(0, toPresentationNumber(category.percentage)),
      0
    )
  if (rest > 0) {
    primary.push({ name: 'Other', percentage: rest, color: palette[4] })
  }
  return primary
})

const description = computed(() =>
  breakdown.value
    .map((c) => `${c.name} ${Math.round(c.percentage)}%`)
    .join(', ')
)
</script>

<template>
  <div v-if="breakdown.length" class="spending-breakdown">
    <div
      class="spending-bar"
      role="img"
      :aria-label="description"
      style="
        display: flex;
        height: 10px;
        border-radius: 5px;
        overflow: hidden;
        gap: 2px;
        margin-top: 14px;
      "
    >
      <div
        v-for="cat in breakdown"
        :key="cat.name"
        :style="{
          flex: `${Math.max(1, Math.round(cat.percentage))}`,
          backgroundColor: cat.color,
        }"
      />
    </div>
    <div
      class="spending-legend num"
      style="
        display: flex;
        flex-wrap: wrap;
        column-gap: 14px;
        row-gap: 4px;
        font-size: 12px;
        line-height: 18px;
        color: #57534c;
        margin-top: 8px;
      "
      aria-hidden="true"
    >
      <span v-for="cat in breakdown" :key="cat.name">
        <strong style="color: #1c1b19; font-weight: 600">{{ cat.name }}</strong>
        {{ Math.round(cat.percentage) }}%
      </span>
    </div>
  </div>
  <p
    v-else
    class="home-quiet"
    style="margin-top: 12px; color: #57534c; font-size: 13px"
  >
    Your category breakdown will appear when spending is recorded.
  </p>
</template>
