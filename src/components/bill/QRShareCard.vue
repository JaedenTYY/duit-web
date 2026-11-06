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
        dark: '#0E5A52',
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

<template><section class="share-card"><h2>Invite people</h2><p>Guests can open this link or scan the code. No account needed.</p><div class="share-inner"><div class="share-qr"><img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code for the guest bill share link"><span v-else>{{ qrLoading ? 'Preparing QR…' : qrError || 'QR appears when link is ready.' }}</span></div><div class="share-actions"><p class="share-url">{{ shareUrl }}</p><button type="button" :disabled="!shareUrl" @click="copyLink">{{ copyState === 'copied' ? 'Link copied' : copyState === 'error' ? 'Try copying again' : 'Copy invite link' }}</button></div></div></section></template><style scoped>.share-card{padding:20px;border:1px solid var(--rule);border-radius:14px;background:#fff}.share-card h2{margin:0;font-size:17px}.share-card>p{margin:6px 0 18px;color:var(--muted);font-size:13px;line-height:19px}.share-inner{display:flex;align-items:center;gap:18px}.share-qr{display:grid;place-items:center;width:120px;height:120px;flex:none;padding:7px;border:1px solid var(--rule);border-radius:9px}.share-qr img{width:100%;height:100%}.share-qr span{color:var(--muted);font-size:11px;text-align:center}.share-actions{min-width:0;flex:1}.share-url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted);font-size:12px}.share-actions button{width:100%;min-height:44px;margin-top:12px;border:0;border-radius:9px;background:var(--accent);color:#fff;font-size:13px;font-weight:600}.share-actions button:disabled{opacity:.5}@media(max-width:420px){.share-inner{align-items:stretch;flex-direction:column}.share-qr{margin:auto}}</style>