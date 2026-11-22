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
    void router.push({ name: 'owner-bill-split', params: { id: bill.id } })
  } catch {
    // Store renders the API error.
  }
}
</script>

<template>
  <div>
    <PageHeader
      title="Split a bill"
      description="One receipt. A clear share for everyone without forcing friends to install an app."
    />

    <div class="split-start-grid">
      <section class="split-start-main">
        <ErrorBanner :message="error" />
        <BillUploadCard :uploading="uploading" @upload="uploadReceipt" />
      </section>

      <aside class="split-how">
        <h2>How it works</h2>
        <ol>
          <li>
            <span>1</span>
            <div>
              <strong>Snap the receipt</strong>
              <p>
                We find the items, taxes, service charges, and amounts for you
                to review.
              </p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Share the guest link</strong>
              <p>
                Friends join in their browser without an account and pick their
                dishes.
              </p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Track settlement</strong>
              <p>Show your DuitNow QR or bank details and mark who has paid.</p>
            </div>
          </li>
        </ol>

        <p class="split-note">
          Duit calculates everyone's share but does not process payments.
          Settlement happens directly through your own bank or eWallet.
        </p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.split-start-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 32px;
  margin-top: 24px;
}

.split-how {
  padding: 24px;
  border: 1px solid var(--rule);
  border-radius: 16px;
  background: var(--panel);
}

.split-how h2 {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #1c1b19;
}

.split-how ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.split-how li {
  display: flex;
  gap: 14px;
  padding: 16px 0;
  border-top: 1px solid #e4e0d7;
}

.split-how li span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 9px;
  background: #e2eeea;
  color: #0e5a52;
  font-size: 13px;
  font-weight: 600;
}

.split-how strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1c1b19;
}

.split-how li p,
.split-note {
  margin: 4px 0 0;
  color: #57534c;
  font-size: 13px;
  line-height: 20px;
}

.split-note {
  margin-top: 28px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e4e0d7;
  border-radius: 12px;
  font-size: 12px;
  line-height: 18px;
}

@media (max-width: 1079px) {
  .split-start-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
