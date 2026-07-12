<script setup lang="ts">
export type AppIconName = 'home' | 'camera' | 'card' | 'insights' | 'users' | 'receipt' | 'link' | 'check' | 'settings' | 'logout' | 'user'

withDefaults(defineProps<{
  name: AppIconName
  strokeWidth?: number
}>(), {
  strokeWidth: 2.25
})
</script>

<template>
  <svg
    class="h-full w-full"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      v-if="name === 'home'"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z"
    />
    <g v-else-if="name === 'camera'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.25l1.1-1.45A1.5 1.5 0 0 1 10.05 4h3.9a1.5 1.5 0 0 1 1.2.55L16.25 6h1.25A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 12.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </g>
    <g v-else-if="name === 'card'">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2.5"
      />
      <path
        stroke-linecap="round"
        d="M3 10h18M7 15h4"
      />
    </g>
    <g v-else-if="name === 'insights'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 19V5M8 19v-7M12 19V8M16 19v-4M20 19V9"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m8 12 4-4 4 7 4-6"
      />
    </g>
    <g v-else-if="name === 'users'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"
      />
      <circle
        cx="10"
        cy="7"
        r="4"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M17 3.2a4 4 0 0 1 0 7.6M21 20v-2a4 4 0 0 0-3-3.87"
      />
    </g>
    <g v-else-if="name === 'receipt'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6 3h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 0 1 1-1Z"
      />
      <path
        stroke-linecap="round"
        d="M8 7h8M8 11h8M8 15h4"
      />
    </g>
    <g v-else-if="name === 'link'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10 13a5 5 0 0 0 7.07 0l1.42-1.42a5 5 0 0 0-7.07-7.07L10.6 5.33"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M14 11a5 5 0 0 0-7.07 0l-1.42 1.42a5 5 0 0 0 7.07 7.07l.82-.82"
      />
    </g>
    <path
      v-else-if="name === 'check'"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m5 12 4.5 4.5L19 7"
    />
    <g v-else-if="name === 'settings'">
      <circle
        cx="12"
        cy="12"
        r="3"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.22 3.43l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.45.18.82.48 1 .86.17.32.37.52.6.54H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.41.2Z"
      />
    </g>
    <g v-else-if="name === 'logout'">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 8l4 4-4 4M19 12H9"
      />
    </g>
    <g v-else-if="name === 'user'">
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4 21a8 8 0 0 1 16 0"
      />
    </g>
  </svg>
</template>
