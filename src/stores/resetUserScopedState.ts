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
let userScopeEpoch = 0

export class UserScopeStaleError extends Error {
  constructor() {
    super('Authenticated user scope changed while this operation was in flight')
    this.name = 'UserScopeStaleError'
  }
}

export function captureUserScopeEpoch(): number {
  return userScopeEpoch
}

export function isCurrentUserScope(epoch: number): boolean {
  return epoch === userScopeEpoch
}

export function throwIfUserScopeStale(epoch: number): void {
  if (!isCurrentUserScope(epoch)) {
    throw new UserScopeStaleError()
  }
}

export function isUserScopeStaleError(error: unknown): error is UserScopeStaleError {
  return error instanceof UserScopeStaleError
}

export function registerUserScopedCacheResetter(resetter: CacheResetter): () => void {
  cacheResetters.add(resetter)
  return () => {
    cacheResetters.delete(resetter)
  }
}

export function resetUserScopedFrontendState(reason: UserScopedResetReason): void {
  userScopeEpoch += 1

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
