<script setup lang="ts">
withDefaults(defineProps<{
  compact?: boolean
  subtitle?: string
  size?: 'sm' | 'md'
}>(), {
  compact: false,
  subtitle: '',
  size: 'md'
})
</script>

<template>
  <span class="inline-flex items-center gap-3">
    <span
      class="relative grid shrink-0 place-items-center rounded-[1.1rem] bg-emerald-500 font-black text-white shadow-sm ring-1 ring-emerald-400/40"
      :class="size === 'sm' ? 'h-9 w-9 text-xl' : 'h-12 w-12 text-3xl'"
      aria-hidden="true"
    >
      d
      <span class="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-300" />
      <span class="absolute bottom-2 h-1 w-5 rounded-full bg-white/45" />
    </span>
    <span
      v-if="!compact"
      class="min-w-0"
    >
      <span
        class="block font-black leading-none text-slate-950"
        :class="size === 'sm' ? 'text-xl' : 'text-2xl'"
      >
        duit<span class="text-emerald-500">.</span>
      </span>
      <span
        v-if="subtitle"
        class="mt-1 block text-xs font-black uppercase text-emerald-700"
      >
        {{ subtitle }}
      </span>
    </span>
  </span>
</template>
