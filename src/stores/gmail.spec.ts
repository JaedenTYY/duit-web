import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { useGmailStore } from './gmail'
import { disconnectGmail } from '@/lib/privacyTransport'
import {
  confirm1,
  connect,
  extractions,
  skip,
  status,
  sync,
} from '@/api/generated/gmail-controller/gmail-controller'
import type {
  EmailExtractionResponse,
  GmailStatusResponse,
  GmailSyncResponse,
} from '@/api/generated/model'

vi.mock('@/api/generated/gmail-controller/gmail-controller', () => ({
  confirm1: vi.fn(),
  connect: vi.fn(),
  extractions: vi.fn(),
  skip: vi.fn(),
  status: vi.fn(),
  sync: vi.fn(),
}))

vi.mock('@/lib/privacyTransport', () => ({ disconnectGmail: vi.fn() }))
vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn(), log: vi.fn(), warn: vi.fn() } }))

describe('gmail store generated contract behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches connected status and pending extractions using generated models', async () => {
    const extraction = generatedExtraction({ status: 'pending' })
    vi.mocked(status).mockResolvedValue({ data: generatedStatus({ connected: true }), meta: meta() })
    vi.mocked(extractions).mockResolvedValue({ data: [extraction], meta: meta() })
    const store = useGmailStore()

    await store.initialise()

    expect(status).toHaveBeenCalledWith()
    expect(extractions).toHaveBeenCalledWith({ status: 'pending' })
    expect(store.status?.connected).toBe(true)
    expect(store.extractions).toEqual([extraction])
    expectTypeOf<EmailExtractionResponse['amount']>().toEqualTypeOf<string>()
  })

  it('starts OAuth by assigning the generated authorization URL', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { assign })
    vi.mocked(connect).mockResolvedValue({
      data: { authorizationUrl: 'https://accounts.example.test/oauth', connected: false },
      meta: meta(),
    })
    const store = useGmailStore()

    await store.connect()

    expect(connect).toHaveBeenCalledWith()
    expect(assign).toHaveBeenCalledWith('https://accounts.example.test/oauth')
  })

  it('syncs and refreshes pending extractions without duplicating a handwritten Gmail schema', async () => {
    const syncResult: GmailSyncResponse = {
      discoveredCount: 2,
      createdCount: 1,
      duplicateCount: 1,
      ignoredCount: 0,
    }
    vi.mocked(sync).mockResolvedValue({ data: syncResult, meta: meta() })
    vi.mocked(extractions).mockResolvedValue({ data: [generatedExtraction()], meta: meta() })
    const store = useGmailStore()

    await store.sync()

    expect(sync).toHaveBeenCalledWith()
    expect(extractions).toHaveBeenCalledWith({ status: 'pending' })
    expect(store.lastSync).toEqual(syncResult)
    expect(store.extractions).toHaveLength(1)
  })

  it('confirms and skips pending extractions through generated operations', async () => {
    const first = generatedExtraction({ id: 'email-1', status: 'pending' })
    const second = generatedExtraction({ id: 'email-2', status: 'pending' })
    vi.mocked(status).mockResolvedValue({ data: generatedStatus({ connected: true }), meta: meta() })
    vi.mocked(extractions).mockResolvedValue({ data: [first, second], meta: meta() })
    vi.mocked(confirm1).mockResolvedValue({ data: { ...first, status: 'confirmed' }, meta: meta() })
    vi.mocked(skip).mockResolvedValue({ data: { ...second, status: 'skipped' }, meta: meta() })
    const store = useGmailStore()
    await store.initialise()

    await store.confirm(first.id, 'category-1')
    await store.skip(second.id)

    expect(confirm1).toHaveBeenCalledWith(first.id, {
      categoryId: 'category-1',
      rememberMerchantCategory: false,
    })
    expect(skip).toHaveBeenCalledWith(second.id)
    expect(store.extractions).toEqual([])
  })

  it('disconnect resets local Gmail state through the approved privacy transport', async () => {
    vi.mocked(disconnectGmail).mockResolvedValue(undefined)
    const store = useGmailStore()
    store.status = generatedStatus({ connected: true })
    store.extractions = [generatedExtraction()]
    store.lastSync = { discoveredCount: 1, createdCount: 1, duplicateCount: 0, ignoredCount: 0 }

    await expect(store.disconnect(true)).resolves.toBe(true)

    expect(disconnectGmail).toHaveBeenCalledWith(true)
    expect(store.status?.connected).toBe(false)
    expect(store.extractions).toEqual([])
    expect(store.lastSync).toBeNull()
  })

  it('records stable API failure details without throwing from initialisation', async () => {
    vi.mocked(status).mockRejectedValue(apiError('ERR_AUTH_001', 'Authentication required', 401))
    const store = useGmailStore()

    await store.initialise()

    expect(store.loading).toBe(false)
    expect(store.error).toBe('Authentication required')
    expect(store.errorRequestId).toBe(REQUEST_ID)
  })
})

function generatedStatus(overrides: Partial<GmailStatusResponse> = {}): GmailStatusResponse {
  return {
    connected: false,
    provider: 'google',
    providerEmail: undefined,
    scopes: [],
    connectedAt: undefined,
    ...overrides,
  }
}

function generatedExtraction(overrides: Partial<EmailExtractionResponse> = {}): EmailExtractionResponse {
  return {
    id: 'email-1',
    sender: 'receipt@example.test',
    subject: 'Receipt',
    receivedAt: '2026-08-11T00:00:00.000Z',
    merchantName: 'Coffee House',
    amount: '12.3400',
    currency: 'MYR',
    occurredAt: '2026-08-11T00:00:00.000Z',
    status: 'pending',
    createdAt: '2026-08-11T00:00:01.000Z',
    ...overrides,
  }
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
