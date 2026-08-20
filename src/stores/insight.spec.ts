import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInsightStore } from './insight'
import {
  generate,
  list,
} from '@/api/generated/insight-controller/insight-controller'
import type { Insight } from '@/api/generated/model'

vi.mock('@/api/generated/insight-controller/insight-controller', () => ({
  generate: vi.fn(),
  list: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn(), log: vi.fn(), warn: vi.fn() } }))

describe('insight store generated contract behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches insight history and records empty results', async () => {
    vi.mocked(list).mockResolvedValue({ data: [], meta: meta() })
    const store = useInsightStore()

    await store.fetchInsights()

    expect(list).toHaveBeenCalledWith()
    expect(store.insights).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('exposes loading while a generated list request is pending', async () => {
    const deferred = createDeferred<{ data: Insight[]; meta: ReturnType<typeof meta> }>()
    vi.mocked(list).mockReturnValue(deferred.promise)
    const store = useInsightStore()

    const request = store.fetchInsights()

    expect(store.loading).toBe(true)
    deferred.resolve({ data: [generatedInsight()], meta: meta() })
    await request
    expect(store.loading).toBe(false)
    expect(store.insights).toHaveLength(1)
  })

  it('generates one insight and deduplicates the existing item by generated ID', async () => {
    const existing = generatedInsight({ id: 'insight-1', generatedAt: '2026-08-01T00:00:00.000Z' })
    const refreshed = generatedInsight({ id: 'insight-1', generatedAt: '2026-08-08T00:00:00.000Z' })
    vi.mocked(list).mockResolvedValue({ data: [existing], meta: meta() })
    vi.mocked(generate).mockResolvedValue({ data: refreshed, meta: meta() })
    const store = useInsightStore()
    await store.fetchInsights()

    await store.generateWeeklyInsight()

    expect(generate).toHaveBeenCalledWith()
    expect(store.insights).toEqual([refreshed])
  })

  it('records API errors without replacing the last good insights', async () => {
    const existing = generatedInsight()
    vi.mocked(list).mockResolvedValue({ data: [existing], meta: meta() })
    vi.mocked(generate).mockRejectedValue(apiError('ERR_PROVIDER_503', 'Insight generation unavailable', 503))
    const store = useInsightStore()
    await store.fetchInsights()

    await store.generateWeeklyInsight()

    expect(store.insights).toEqual([existing])
    expect(store.error).toBe('Insight generation unavailable')
    expect(store.generating).toBe(false)
  })
})

function generatedInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    id: 'insight-1',
    userId: '11111111-1111-4111-8111-111111111111',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-08',
    generatedAt: '2026-08-08T00:00:00.000Z',
    content: {
      headline: 'Weekly insight',
      summary: 'Spending was steady.',
      totalSpent: '12.3400',
      currency: 'MYR',
      comparisonPercentage: 0,
      topCategories: [],
      topMerchants: [],
      largestTransactions: [],
      unusualIncreases: [],
      spendingTrend: {
        direction: 'STABLE',
        currentTotal: '12.3400',
        previousTotal: '12.3400',
        changePercentage: 0,
      },
      billSplitSettlements: undefined,
      findings: [],
      recommendation: 'Keep reviewing receipts.',
      recommendations: ['Keep reviewing receipts.'],
      positiveNote: 'You are up to date.',
      riskLevel: 'LOW',
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
