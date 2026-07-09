<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  shareUrl: string
}>()

const emit = defineEmits<{
  (event: 'copied'): void
}>()

const qrSvg = ref('')
const copyState = ref<'idle' | 'copied'>('idle')

async function renderQr() {
  if (!props.shareUrl) {
    qrSvg.value = ''
    return
  }
  qrSvg.value = await QRCode.toString(props.shareUrl, {
    type: 'svg',
    margin: 1,
    width: 220,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })
}

async function copyLink() {
  await navigator.clipboard.writeText(props.shareUrl)
  copyState.value = 'copied'
  emit('copied')
  window.setTimeout(() => {
    copyState.value = 'idle'
  }, 1500)
}

onMounted(renderQr)
watch(() => props.shareUrl, renderQr)
</script>

<template>
  <section class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-black text-slate-900">
          Share with guests
        </h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">
          Friends scan this QR or open the link to join without an account.
        </p>
      </div>
    </div>

    <div class="mt-6 flex flex-col items-center gap-6 sm:flex-row">
      <div
        class="flex h-48 w-48 shrink-0 items-center justify-center rounded-3xl border-2 border-slate-100 bg-white p-3 shadow-inner"
        v-html="qrSvg"
      />
      <div class="min-w-0 flex-1 w-full">
        <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <p class="truncate text-sm font-semibold text-slate-600">
            {{ shareUrl }}
          </p>
        </div>
        <button
          type="button"
          class="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
          @click="copyLink"
        >
          {{ copyState === 'copied' ? 'Copied' : 'Copy share link' }}
        </button>
      </div>
    </div>
  </section>
</template>
