<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  shareUrl: string
}>()

const emit = defineEmits<{
  (event: 'copied'): void
}>()

const qrDataUrl = ref('')
const qrLoading = ref(false)
const qrError = ref('')
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let qrGeneration = 0

async function renderQr() {
  const generation = ++qrGeneration
  if (!props.shareUrl) {
    qrDataUrl.value = ''
    qrError.value = ''
    return
  }
  qrLoading.value = true
  qrError.value = ''
  try {
    const dataUrl = await QRCode.toDataURL(props.shareUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
    if (generation === qrGeneration && props.shareUrl) {
      qrDataUrl.value = dataUrl
    }
  } catch {
    if (generation === qrGeneration) {
      qrDataUrl.value = ''
      qrError.value = 'QR image could not be generated. The share link is still available to copy.'
    }
  } finally {
    if (generation === qrGeneration) qrLoading.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.shareUrl)
    copyState.value = 'copied'
    emit('copied')
    window.setTimeout(() => {
      copyState.value = 'idle'
    }, 1500)
  } catch {
    copyState.value = 'error'
  }
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
      >
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="QR code for the guest bill share link"
          class="h-full w-full"
        >
        <p
          v-else-if="qrLoading"
          class="text-center text-sm font-bold text-slate-500"
        >
          Generating QR…
        </p>
        <p
          v-else
          class="text-center text-xs font-bold leading-5 text-slate-500"
        >
          {{ qrError || 'Share link QR will appear when the bill link is ready.' }}
        </p>
      </div>
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
          {{ copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy share link' }}
        </button>
      </div>
    </div>
  </section>
</template>
