<script setup lang="ts">
export type AppIconName = 'home' | 'camera' | 'card' | 'insights' | 'users' | 'receipt' | 'link' | 'check' | 'moon' | 'sun'

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
    <path
      v-else-if="name === 'moon'"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M20 15.2A8 8 0 0 1 8.8 4a7 7 0 1 0 11.2 11.2Z"
    />
    <g v-else-if="name === 'sun'">
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path
        stroke-linecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"
      />
    </g>
  </svg>
</template>
