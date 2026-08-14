import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, expectTypeOf, it, vi, beforeEach } from 'vitest'
import api from '@/lib/api'
import { createFromReceipt } from '@/api/generated/bill-controller/bill-controller'
import { uploadReceipt } from '@/api/generated/receipt-controller/receipt-controller'
import { upload as uploadStatement } from '@/api/generated/statement-controller/statement-controller'
import { RECEIPT_IMAGE_ACCEPT } from '@/utils/receiptFile'
import { extractApiFailure } from '@/lib/apiError'
import type { BillPaymentQrProfileRequest } from '@/api/generated/model/billPaymentQrProfileRequest'
import type { CreateTransactionHeaders } from '@/api/generated/model/createTransactionHeaders'
import type { JoinHeaders } from '@/api/generated/model/joinHeaders'
import type { ListTransactionsParams } from '@/api/generated/model/listTransactionsParams'
import type { MarkPaidRequest } from '@/api/generated/model/markPaidRequest'
import type { SelectBillItemsRequest } from '@/api/generated/model/selectBillItemsRequest'
import type { SummaryHeaders } from '@/api/generated/model/summaryHeaders'
import type { UpdateTransactionRequest } from '@/api/generated/model/updateTransactionRequest'

vi.mock('@/lib/api', () => ({
  default: {
    request: vi.fn(),
  },
}))

const apiRequest = vi.mocked(api.request)

describe('API contract integration points', () => {
  beforeEach(() => {
    apiRequest.mockReset()
    apiRequest.mockResolvedValue({ data: { data: {} } })
  })

  it.each([
    ['receipt upload', uploadReceipt],
    ['bill-from-receipt upload', createFromReceipt],
    ['statement upload', uploadStatement],
  ])('%s generated caller sends multipart FormData field named file', async (_name, upload) => {
    const file = new File(['payload'], 'upload.bin')

    await upload({ file })

    const config = apiRequest.mock.calls[0][0]
    expect(config.method).toBe('POST')
    expect(config.data).toBeInstanceOf(FormData)
    expect((config.data as FormData).get('file')).toBe(file)
  })

  it('receipt upload contract advertises only runtime-supported image types', () => {
    expect(RECEIPT_IMAGE_ACCEPT).toBe('image/jpeg,image/png,image/webp')
    expect(RECEIPT_IMAGE_ACCEPT).not.toContain('heic')
    expect(RECEIPT_IMAGE_ACCEPT).not.toContain('heif')
  })

  it('generated transaction pagination parameters keep the bounded cursor contract', () => {
    const params: ListTransactionsParams = { limit: 20 }
    const cursorParams: ListTransactionsParams = {
      limit: 100,
      cursor: '2026-08-13T00:00:00Z',
      cursorId: '00000000-0000-4000-8000-000000000001',
    }

    expect(params.limit).toBe(20)
    expect(cursorParams.limit).toBe(100)
  })

  it('generated Item 2 and Item 3 mutation contracts retain required headers and revisions', () => {
    expectTypeOf<CreateTransactionHeaders>().toHaveProperty('Idempotency-Key').toEqualTypeOf<string>()
    expectTypeOf<JoinHeaders>().toHaveProperty('Idempotency-Key').toEqualTypeOf<string>()
    expectTypeOf<SummaryHeaders>().toHaveProperty('X-Participant-Token').toEqualTypeOf<string>()
    expectTypeOf<UpdateTransactionRequest>().toHaveProperty('expectedVersion').toEqualTypeOf<number>()
    expectTypeOf<SelectBillItemsRequest>().toHaveProperty('expectedAllocationVersion').toEqualTypeOf<number>()
    expectTypeOf<MarkPaidRequest>().toHaveProperty('expectedAllocationVersion').toEqualTypeOf<number>()
    expectTypeOf<BillPaymentQrProfileRequest>().toHaveProperty('expectedAllocationVersion').toEqualTypeOf<number>()
  })

  it('continues exposing stable error codes for frontend branching', () => {
    const failure = extractApiFailure({
      response: {
        status: 409,
        data: {
          error: {
            code: 'ERR_BILL_STALE_409',
            message: 'Bill state changed',
          },
        },
        headers: {},
      },
    })

    expect(failure.code).toBe('ERR_BILL_STALE_409')
    expect(failure.message).toBe('Bill state changed')
  })

  it('provenance verification fails on mismatched OpenAPI hash', () => {
    const root = mkdtempSync(join(tmpdir(), 'duit-openapi-provenance-'))
    try {
      cpSync('openapi.json', join(root, 'openapi.json'))
      cpSync('package-lock.json', join(root, 'package-lock.json'))
      const provenance = JSON.parse(readFileSync('openapi.provenance.json', 'utf8'))
      provenance.openApiSha256 = '0'.repeat(64)
      writeFileSync(join(root, 'openapi.provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`)

      const result = spawnSync(
        process.execPath,
        [join(process.cwd(), 'scripts/verify-openapi-provenance.mjs')],
        {
          env: {
            ...process.env,
            DUIT_OPENAPI_CONTRACT_ROOT: root,
          },
          encoding: 'utf8',
        },
      )

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('OpenAPI provenance verification failed')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
