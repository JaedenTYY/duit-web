export interface TransactionOperationIdentity {
  key: string
  createdAtMs: number
}

export const TRANSACTION_OPERATION_RETENTION_MS = 24 * 60 * 60 * 1000

export function createTransactionOperationIdentity(
  nowMs = Date.now(),
): TransactionOperationIdentity {
  return {
    key: crypto.randomUUID(),
    createdAtMs: nowMs,
  }
}

export function transactionOperationExpired(
  operation: TransactionOperationIdentity,
  nowMs = Date.now(),
): boolean {
  return nowMs - operation.createdAtMs >= TRANSACTION_OPERATION_RETENTION_MS
}
