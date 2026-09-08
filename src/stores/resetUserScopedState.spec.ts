import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { captureUserScopeEpoch, resetUserScopedFrontendState } from './resetUserScopedState'
import { useAnomalyStore } from '@/stores/anomaly'
import { useBillStore } from '@/stores/bill'
import { useGmailStore } from '@/stores/gmail'
import { useInsightStore } from '@/stores/insight'
import { useReceiptStore } from '@/stores/receipt'
import { useStatementStore } from '@/stores/statement'
import { useTransactionStore } from '@/stores/transaction'
import type {
  AnomalyAlert,
  Bill,
  EmailExtraction,
  GmailStatus,
  Insight,
  PaymentQrProfile,
  ReceiptExtractionResponse,
  StatementUpload,
  Transaction,
} from '@/types'

describe('resetUserScopedFrontendState', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    setActivePinia(createPinia())
  })

  it('clears authenticated user-owned stores without deleting unrelated guest capabilities', () => {
    const transactionStore = useTransactionStore()
    const receiptStore = useReceiptStore()
    const statementStore = useStatementStore()
    const gmailStore = useGmailStore()
    const insightStore = useInsightStore()
    const anomalyStore = useAnomalyStore()
    const billStore = useBillStore()

    transactionStore.transactions = [sampleTransaction]
    transactionStore.categories = [{ id: 'cat-user-a', name: 'Dining' }]
    transactionStore.monthlySummary = {
      totalSpend: '99.0000',
      currency: 'MYR',
      transactionCount: 1,
      byCategory: [],
    }
    transactionStore.loading = true
    transactionStore.submitting = true
    transactionStore.error = 'User A transaction error'

    receiptStore.extraction = sampleReceipt
    receiptStore.uploading = true
    receiptStore.confirming = true
    receiptStore.error = 'User A receipt error'

    statementStore.upload = sampleStatementUpload
    statementStore.result = {
      importedCount: 1,
      skippedCount: 0,
      transactionIds: ['tx-user-a'],
      uploadId: 'statement-user-a',
    }
    statementStore.uploading = true
    statementStore.confirming = true
    statementStore.error = 'User A statement error'
    statementStore.refreshError = 'User A refresh error'

    gmailStore.status = sampleGmailStatus
    gmailStore.extractions = [sampleEmailExtraction]
    gmailStore.lastSync = {
      discoveredCount: 1,
      createdCount: 1,
      duplicateCount: 0,
      ignoredCount: 0,
    }
    gmailStore.actionIds = new Set(['mail-user-a'])
    gmailStore.error = 'User A Gmail error'

    insightStore.insights = [sampleInsight]
    insightStore.loading = true
    insightStore.generating = true
    insightStore.error = 'User A insight error'

    anomalyStore.anomalies = [sampleAnomaly]
    anomalyStore.loading = true
    anomalyStore.resolvingIds = new Set(['anomaly-user-a'])
    anomalyStore.error = 'User A anomaly error'

    billStore.bill = sampleBill
    billStore.paymentProfiles = [samplePaymentProfile]
    billStore.participantToken = 'in-memory-guest-token'
    billStore.guestShareToken = 'guest-share-token'
    billStore.loading = true
    billStore.uploading = true
    billStore.saving = true
    billStore.error = 'User A bill error'
    localStorage.setItem('duit_guest_participant_guest-share-token', 'persisted-guest-token')

    resetUserScopedFrontendState('logout')

    expect(transactionStore.transactions).toEqual([])
    expect(transactionStore.categories).toEqual([])
    expect(transactionStore.monthlySummary).toBeNull()
    expect(transactionStore.monthlySummaryStatus).toBe('idle')
    expect(transactionStore.loading).toBe(false)
    expect(transactionStore.submitting).toBe(false)
    expect(transactionStore.error).toBeNull()

    expect(receiptStore.extraction).toBeNull()
    expect(receiptStore.uploading).toBe(false)
    expect(receiptStore.confirming).toBe(false)
    expect(receiptStore.error).toBeNull()

    expect(statementStore.upload).toBeNull()
    expect(statementStore.result).toBeNull()
    expect(statementStore.uploading).toBe(false)
    expect(statementStore.confirming).toBe(false)
    expect(statementStore.error).toBeNull()
    expect(statementStore.refreshError).toBeNull()

    expect(gmailStore.status).toBeNull()
    expect(gmailStore.extractions).toEqual([])
    expect(gmailStore.lastSync).toBeNull()
    expect(gmailStore.actionIds.size).toBe(0)
    expect(gmailStore.error).toBeNull()

    expect(insightStore.insights).toEqual([])
    expect(insightStore.loading).toBe(false)
    expect(insightStore.generating).toBe(false)
    expect(insightStore.error).toBeNull()

    expect(anomalyStore.anomalies).toEqual([])
    expect(anomalyStore.loading).toBe(false)
    expect(anomalyStore.resolvingIds.size).toBe(0)
    expect(anomalyStore.error).toBeNull()

    expect(billStore.bill).toBeNull()
    expect(billStore.paymentProfiles).toEqual([])
    expect(billStore.participantToken).toBeNull()
    expect(billStore.guestShareToken).toBeNull()
    expect(billStore.loading).toBe(false)
    expect(billStore.uploading).toBe(false)
    expect(billStore.saving).toBe(false)
    expect(billStore.error).toBeNull()
    expect(localStorage.getItem('duit_guest_participant_guest-share-token')).toBe('persisted-guest-token')
  })

  it('advances the in-memory user-scope epoch before clearing store state', () => {
    const insightStore = useInsightStore()
    insightStore.insights = [sampleInsight]
    const before = captureUserScopeEpoch()

    resetUserScopedFrontendState('user-switch')

    expect(captureUserScopeEpoch()).toBe(before + 1)
    expect(insightStore.insights).toEqual([])
  })
})

const sampleTransaction = {
  id: 'tx-user-a',
  userId: 'user-a',
  amount: '99.0000',
  amountMyr: '99.0000',
  currency: 'MYR',
  fxRate: '1.000000',
  merchantName: 'USER_A_PRIVATE_MERCHANT',
  source: 'manual',
  occurredAt: '2026-08-01T00:00:00Z',
  version: 1,
  createdAt: '2026-08-01T00:00:00Z',
} as Transaction

const sampleReceipt = {
  extractionId: 'receipt-user-a',
  extractedData: {
    total: '99.0000',
    currency: 'MYR',
    lineItems: [],
  },
} as unknown as ReceiptExtractionResponse

const sampleStatementUpload = {
  id: 'statement-user-a',
  fileName: 'user-a.pdf',
  status: 'pending',
  rows: [],
} as unknown as StatementUpload

const sampleGmailStatus = {
  connected: true,
  provider: 'google',
  providerEmail: 'user-a@example.test',
  scopes: [],
} as GmailStatus

const sampleEmailExtraction = {
  id: 'mail-user-a',
  merchantName: 'USER_A_PRIVATE_EMAIL_MERCHANT',
  amount: '99.0000',
  currency: 'MYR',
  occurredAt: '2026-08-01T00:00:00Z',
  receivedAt: '2026-08-01T00:00:00Z',
  createdAt: '2026-08-01T00:00:00Z',
  sender: 'receipts@example.test',
  subject: 'Receipt',
  status: 'pending',
} as EmailExtraction

const sampleInsight = {
  id: 'insight-user-a',
  title: 'USER_A_PRIVATE_INSIGHT',
} as unknown as Insight

const sampleAnomaly = {
  id: 'anomaly-user-a',
  merchantName: 'USER_A_PRIVATE_ANOMALY',
} as unknown as AnomalyAlert

const sampleBill = {
  id: 'bill-user-a',
  shareToken: 'guest-share-token',
  status: 'active',
  currency: 'MYR',
  allocationVersion: 1,
  items: [],
  participants: [],
} as unknown as Bill

const samplePaymentProfile = {
  id: 'qr-user-a',
  displayName: 'USER_A_PRIVATE_QR',
  provider: 'DuitNow',
  isDefault: true,
  createdAt: '2026-08-01T00:00:00Z',
} as PaymentQrProfile

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}
