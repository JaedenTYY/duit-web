<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'blue' | 'mint' | 'purple' | 'peach' | 'dark'
}>(), {
  tone: 'blue',
})

const toneClasses = {
  blue: 'from-blue-600 via-cyan-500 to-emerald-400 text-white shadow-blue-200/70',
  mint: 'from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 shadow-emerald-200/70',
  purple: 'from-violet-500 via-fuchsia-400 to-cyan-400 text-white shadow-violet-200/70',
  peach: 'from-orange-300 via-rose-300 to-violet-400 text-slate-950 shadow-rose-200/70',
  dark: 'from-slate-950 via-blue-950 to-slate-800 text-white shadow-slate-300/60',
}
</script>

<template>
  <section
    class="overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 shadow-xl sm:p-7"
    :class="toneClasses[tone]"
  >
    <slot />
  </section>
</template>
