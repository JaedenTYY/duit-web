import { describe, expect, it, vi } from 'vitest'
import {
  TRANSACTION_OPERATION_RETENTION_MS,
  createTransactionOperationIdentity,
  transactionOperationExpired,
} from './transactionOperation'

describe('transaction operation identity', () => {
  it('creates one UUID that remains valid throughout the 24 hour retry window', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111')
    const operation = createTransactionOperationIdentity(1_000)

    expect(operation).toEqual({
      key: '11111111-1111-4111-8111-111111111111',
      createdAtMs: 1_000,
    })
    expect(transactionOperationExpired(operation, 1_000 + TRANSACTION_OPERATION_RETENTION_MS - 1)).toBe(false)
    expect(transactionOperationExpired(operation, 1_000 + TRANSACTION_OPERATION_RETENTION_MS)).toBe(true)
  })
})
