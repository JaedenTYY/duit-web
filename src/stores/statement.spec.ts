import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { useStatementStore } from './statement'
import {
  _delete as deleteStatementUpload,
  confirm,
  get,
  upload,
} from '@/api/generated/statement-controller/statement-controller'
import type {
  ConfirmStatementRequest,
  StatementImportResponse,
  StatementRowResponse,
  StatementUploadResponse,
} from '@/api/generated/model'

vi.mock('@/api/generated/statement-controller/statement-controller', () => ({
  _delete: vi.fn(),
  confirm: vi.fn(),
  get: vi.fn(),
  upload: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({ logger: { error: vi.fn(), log: vi.fn(), warn: vi.fn() } }))

describe('statement store generated contract behavior', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('uploads a PDF through the generated statement contract and stores generated rows', async () => {
    const file = new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' })
    const row = generatedStatementRow({ direction: 'debit', amount: '18.4000' })
    const uploaded = generatedStatementUpload({ rows: [row] })
    vi.mocked(upload).mockResolvedValue({ data: uploaded, meta: meta() })
    const store = useStatementStore()

    await expect(store.uploadStatement(file)).resolves.toEqual(uploaded)

    expect(upload).toHaveBeenCalledWith({ file })
    expect(store.upload).toEqual(uploaded)
    expect(store.upload?.rows[0]).toEqual(row)
    expectTypeOf<StatementRowResponse['amount']>().toEqualTypeOf<string>()
  })

  it('confirms selected rows with explicit remember flags and stores the generated import result', async () => {
    const pending = generatedStatementUpload({
      rows: [
        generatedStatementRow({ id: 'row-1', direction: 'debit' }),
        generatedStatementRow({ id: 'row-2', direction: 'credit', status: 'skipped' }),
      ],
    })
    const imported = generatedImportResult()
    const refreshed = { ...pending, status: 'confirmed' as const, confirmedAt: '2026-08-11T00:01:00.000Z' }
    vi.mocked(upload).mockResolvedValue({ data: pending, meta: meta() })
    vi.mocked(confirm).mockResolvedValue({ data: imported, meta: meta() })
    vi.mocked(get).mockResolvedValue({ data: refreshed, meta: meta() })
    const store = useStatementStore()
    await store.uploadStatement(new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' }))

    await store.confirmRows([{ rowId: 'row-1', categoryId: 'category-1' }])

    const expectedRequest: ConfirmStatementRequest = {
      rows: [{ rowId: 'row-1', categoryId: 'category-1', rememberMerchantCategory: false }],
    }
    expect(confirm).toHaveBeenCalledWith(pending.id, expectedRequest)
    expect(store.result).toEqual(imported)
    expect(store.upload).toEqual(refreshed)
  })

  it('records upload failures without inventing a frontend transport schema', async () => {
    vi.mocked(upload).mockRejectedValue(apiError('ERR_STATEMENT_001', 'Statement upload failed'))
    const store = useStatementStore()

    await expect(store.uploadStatement(new File(['bad'], 'statement.pdf', { type: 'application/pdf' })))
      .rejects.toMatchObject({ response: { status: 422 } })

    expect(store.error).toBe('Statement upload failed')
    expect(store.upload).toBeNull()
  })

  it('records confirmation failures while retaining pending upload state', async () => {
    const pending = generatedStatementUpload()
    vi.mocked(upload).mockResolvedValue({ data: pending, meta: meta() })
    vi.mocked(confirm).mockRejectedValue(apiError('ERR_STATEMENT_001', 'Statement import failed'))
    const store = useStatementStore()
    await store.uploadStatement(new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' }))

    await expect(store.confirmRows([{ rowId: 'row-1' }]))
      .rejects.toMatchObject({ response: { status: 422 } })

    expect(store.upload).toEqual(pending)
    expect(store.result).toBeNull()
    expect(store.error).toBe('Statement import failed')
  })

  it('deletes only pending uploads during discard and reset clears transient state', async () => {
    const pending = generatedStatementUpload({ status: 'pending' })
    vi.mocked(upload).mockResolvedValue({ data: pending, meta: meta() })
    vi.mocked(deleteStatementUpload).mockResolvedValue(undefined)
    const store = useStatementStore()
    await store.uploadStatement(new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' }))

    await store.discardUpload()

    expect(deleteStatementUpload).toHaveBeenCalledWith(pending.id)
    expect(store.upload).toBeNull()
    expect(store.result).toBeNull()
    expect(store.error).toBeNull()
  })

  it('does not call the generated delete operation for confirmed uploads', async () => {
    vi.mocked(upload).mockResolvedValue({
      data: generatedStatementUpload({ status: 'confirmed' }),
      meta: meta(),
    })
    const store = useStatementStore()
    await store.uploadStatement(new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' }))

    await store.discardUpload()

    expect(deleteStatementUpload).not.toHaveBeenCalled()
  })
})

function generatedStatementUpload(overrides: Partial<StatementUploadResponse> = {}): StatementUploadResponse {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    fileName: 'statement.pdf',
    status: 'pending',
    createdAt: '2026-08-11T00:00:00.000Z',
    rows: [generatedStatementRow()],
    ...overrides,
  }
}

function generatedStatementRow(overrides: Partial<StatementRowResponse> = {}): StatementRowResponse {
  return {
    id: 'row-1',
    sourceRowIndex: 0,
    occurredAt: '2026-08-10T00:00:00.000Z',
    description: 'Debit row',
    merchantName: 'Coffee House',
    amount: '18.4000',
    currency: 'MYR',
    direction: 'debit',
    status: 'pending',
    ...overrides,
  }
}

function generatedImportResult(overrides: Partial<StatementImportResponse> = {}): StatementImportResponse {
  return {
    uploadId: '11111111-1111-4111-8111-111111111111',
    importedCount: 1,
    skippedCount: 1,
    transactionIds: ['22222222-2222-4222-8222-222222222222'],
    ...overrides,
  }
}

function meta() {
  return { timestamp: '2026-08-11T00:00:00.000Z', requestId: REQUEST_ID }
}

function apiError(code: string, message: string) {
  return {
    response: {
      status: 422,
      data: { error: { code, message, requestId: REQUEST_ID } },
      headers: {},
    },
  }
}

const REQUEST_ID = '44444444-4444-4444-8444-444444444444'
