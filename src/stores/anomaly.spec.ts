import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnomalyStore } from './anomaly'
import {
  list1,
  resolve,
} from '@/api/generated/anomaly-controller/anomaly-controller'
import type { AnomalyAlertResponse } from '@/api/generated/model'

vi.mock('@/api/generated/anomaly-controller/anomaly-controller', () => ({
  list1: vi.fn(),
  resolve: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn(), log: vi.fn(), warn: vi.fn() } }))

describe('anomaly store generated contract behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches active anomalies and records an empty list', async () => {
    vi.mocked(list1).mockResolvedValue({ data: [], meta: meta() })
    const store = useAnomalyStore()

    await store.fetchAnomalies()

    expect(list1).toHaveBeenCalledWith()
    expect(store.anomalies).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('resolves an anomaly with the generated status payload and updates the matching alert', async () => {
    const pending = generatedAnomaly({ id: 'alert-1', status: 'pending' })
    const dismissed = generatedAnomaly({ id: 'alert-1', status: 'dismissed' })
    vi.mocked(list1).mockResolvedValue({ data: [pending], meta: meta() })
    vi.mocked(resolve).mockResolvedValue({ data: dismissed, meta: meta() })
    const store = useAnomalyStore()
    await store.fetchAnomalies()

    await store.resolveAnomaly('alert-1', 'dismiss')

    expect(resolve).toHaveBeenCalledWith('alert-1', { status: 'dismissed' })
    expect(store.anomalies).toEqual([dismissed])
    expect(store.resolvingIds.has('alert-1')).toBe(false)
  })

  it('deduplicates concurrent resolve clicks while the first request is pending', async () => {
    const deferred = createDeferred<{ data: AnomalyAlertResponse; meta: ReturnType<typeof meta> }>()
    vi.mocked(resolve).mockReturnValue(deferred.promise)
    const store = useAnomalyStore()

    const first = store.resolveAnomaly('alert-1', 'confirm')
    const second = store.resolveAnomaly('alert-1', 'confirm')

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(store.resolvingIds.has('alert-1')).toBe(true)
    deferred.resolve({ data: generatedAnomaly({ id: 'alert-1', status: 'confirmed' }), meta: meta() })
    await Promise.all([first, second])
    expect(store.resolvingIds.has('alert-1')).toBe(false)
  })

  it('throws and records the stable API error message on resolve failure', async () => {
    vi.mocked(resolve).mockRejectedValue(apiError('ERR_ANOMALY_CONFLICT_409', 'Anomaly already resolved', 409))
    const store = useAnomalyStore()

    await expect(store.resolveAnomaly('alert-1', 'confirm'))
      .rejects.toMatchObject({ response: { status: 409 } })

    expect(store.error).toBe('Anomaly already resolved')
    expect(store.resolvingIds.has('alert-1')).toBe(false)
  })
})

function generatedAnomaly(overrides: Partial<AnomalyAlertResponse> = {}): AnomalyAlertResponse {
  return {
    id: 'alert-1',
    transactionId: '11111111-1111-4111-8111-111111111111',
    amount: '99.9900',
    currency: 'MYR',
    merchantName: 'Coffee House',
    categoryName: 'Food & Dining',
    title: 'Unusual spending',
    reason: 'Amount is higher than normal.',
    explanation: 'This transaction is outside recent behavior.',
    anomalyScore: 0.97,
    threshold: 0.95,
    status: 'pending',
    createdAt: '2026-08-11T00:00:00.000Z',
    features: {
      amount: '99.9900',
      amountDeviation: 0.25,
      categoryName: 'Food & Dining',
      categoryRarity: 0.1,
      currency: 'MYR',
      dayCos: 0.5,
      hourOfDay: 10,
      dayOfWeek: 2,
      daySin: 0.5,
      feedbackSignature: 'none',
      gradualDrift: 0,
      hourCos: 0.5,
      hourSin: 0.5,
      merchantName: 'Coffee House',
      merchantRarity: 0.1,
      reasonCodes: ['amount'],
      recentSpendTotal: '199.9800',
      spendingVelocity: 0.2,
      timeRarity: 0.1,
    },
    ...overrides,
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function meta() {
  return { timestamp: '2026-08-11T00:00:00.000Z', requestId: REQUEST_ID }
}

function apiError(code: string, message: string, statusCode = 422) {
  return {
    response: {
      status: statusCode,
      data: { error: { code, message, requestId: REQUEST_ID } },
      headers: {},
    },
  }
}

const REQUEST_ID = '44444444-4444-4444-8444-444444444444'
