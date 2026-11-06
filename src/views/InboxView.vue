<script setup lang="ts">
import { ref } from 'vue'
import ReceiptUploadModal from '@/components/receipt/ReceiptUploadModal.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const showUpload = ref(false)

function handleUploadSuccess() {
  showUpload.value = false
}
</script>

<template><div class="import-page"><PageHeader title="Import spending" description="Bring spending into Duit and check the details before saving." /><section class="import-group"><button type="button" class="import-row" @click="showUpload = true"><span class="import-icon" aria-hidden="true">▣</span><span><strong>Scan receipt</strong><small>Add an expense from a photo.</small></span><b>›</b></button><RouterLink to="/statements" class="import-row"><span class="import-icon" aria-hidden="true">≡</span><span><strong>Import statement</strong><small>Review eligible expenses from a PDF.</small></span><b>›</b></RouterLink><RouterLink to="/gmail" class="import-row"><span class="import-icon" aria-hidden="true">✉</span><span><strong>Gmail eReceipts</strong><small>Review receipt emails before adding them.</small></span><b>›</b></RouterLink></section><p class="import-note">You can edit or remove an expense after it is saved.</p><ReceiptUploadModal v-if="showUpload" @close="showUpload = false" @success="handleUploadSuccess" /></div></template><style scoped>.import-page{max-width:700px}.import-group{padding:0 16px;border-radius:16px;background:#fff}.import-row{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:12px 0;border:0;border-bottom:1px solid var(--rule);background:transparent;color:var(--ink);text-align:left;text-decoration:none}.import-row:last-child{border-bottom:0}.import-icon{display:grid;place-items:center;width:42px;height:42px;flex:none;border-radius:10px;background:var(--accent-tint);color:var(--accent);font-size:20px}.import-row span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:4px}.import-row strong{font-size:14px;font-weight:600}.import-row small,.import-note{color:var(--muted);font-size:12px;line-height:18px}.import-row b{color:var(--accent);font-size:22px;font-weight:400}.import-note{margin:16px 0}</style>
