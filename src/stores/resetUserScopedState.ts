import { useAnomalyStore } from '@/stores/anomaly'
import { useBillStore } from '@/stores/bill'
import { useGmailStore } from '@/stores/gmail'
import { useInsightStore } from '@/stores/insight'
import { useReceiptStore } from '@/stores/receipt'
import { useStatementStore } from '@/stores/statement'
import { useTransactionStore } from '@/stores/transaction'

export type UserScopedResetReason =
  | 'login'
  | 'logout'
  | 'refresh-failed'
  | 'revoked'
  | 'account-deleted'
  | 'user-switch'

type CacheResetter = (reason: UserScopedResetReason) => void

const cacheResetters = new Set<CacheResetter>()

export function registerUserScopedCacheResetter(resetter: CacheResetter): () => void {
  cacheResetters.add(resetter)
  return () => {
    cacheResetters.delete(resetter)
  }
}

export function resetUserScopedFrontendState(reason: UserScopedResetReason): void {
  useTransactionStore().reset()
  useReceiptStore().reset()
  useStatementStore().reset()
  useGmailStore().reset()
  useInsightStore().reset()
  useAnomalyStore().reset()
  useBillStore().resetAuthenticatedState()

  for (const resetter of cacheResetters) {
    resetter(reason)
  }
}
