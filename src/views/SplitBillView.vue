<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useBillStore } from '@/stores/bill'
import BillUploadCard from '@/components/bill/BillUploadCard.vue'
import ErrorBanner from '@/components/bill/ErrorBanner.vue'
import PageHeader from '@/components/shared/PageHeader.vue'

const router = useRouter()
const billStore = useBillStore()
const { uploading, error } = storeToRefs(billStore)

async function uploadReceipt(file: File) {
  try {
    const bill = await billStore.createFromReceipt(file)
    router.push({ name: 'owner-bill-split', params: { id: bill.id } })
  } catch {
    // Store renders the API error.
  }
}
</script>

<template>
  <div class="split-start">
    <PageHeader title="Split a bill" description="One receipt. A clear share for everyone." />
    <div class="split-start-grid">
      <section class="split-start-main">
        <p class="split-step">01 / Start with a receipt</p>
        <ErrorBanner :message="error" />
        <BillUploadCard :uploading="uploading" @upload="uploadReceipt" />
      </section>
      <aside class="split-how"><h2>How it works</h2><ol><li><span>1</span><div><strong>Add the receipt</strong><p>We find the items and amounts for you to review.</p></div></li><li><span>2</span><div><strong>Share the link</strong><p>Friends join without an account and choose their items.</p></div></li><li><span>3</span><div><strong>Track settlement</strong><p>Show your own payment details and mark who has paid.</p></div></li></ol><p class="split-note">Duit records the split. Payment happens through your own bank or wallet.</p></aside>
    </div>
  </div>
</template>
<style scoped>
.split-start { max-width:980px; }
.split-start-grid { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr); gap:48px; }
.split-step { margin-bottom:14px; color:var(--accent); font-size:12px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
.split-how { padding-top:34px; }
.split-how h2 { margin:0 0 20px; font-size:17px; }
.split-how ol { margin:0; padding:0; list-style:none; }
.split-how li { display:flex; gap:14px; padding:16px 0; border-top:1px solid var(--rule); }
.split-how li span { display:grid; place-items:center; width:30px; height:30px; flex:none; border-radius:9px; background:var(--accent-tint); color:var(--accent); font-size:13px; font-weight:600; }
.split-how strong { font-size:14px; font-weight:600; }
.split-how li p,.split-note { margin:4px 0 0; color:var(--muted); font-size:13px; line-height:19px; }
.split-note { margin-top:25px; }
@media(max-width:760px){.split-start-grid{grid-template-columns:1fr;gap:24px}.split-how{padding-top:0}}
</style>
