import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatementImportView from './StatementImportView.vue'

const { statementStore, transactionStore } = vi.hoisted(() => ({
  statementStore: {
    upload: {
      id: 'upload-1', fileName: 'statement.pdf', status: 'pending',
      createdAt: '2026-07-01T00:00:00Z', confirmedAt: null,
      rows: [
        {
          id: 'debit-1', occurredAt: '2026-07-02T04:00:00Z', description: 'Coffee',
          merchantName: 'Cafe', amount: '12.3400', currency: 'MYR', direction: 'debit',
          suggestedCategoryId: null, suggestedCategoryName: null,
          categorisationConfidence: null, status: 'pending', transactionId: null,
        },
        {
          id: 'credit-1', occurredAt: '2026-07-03T04:00:00Z', description: 'Salary credit',
          merchantName: 'Employer', amount: '3200.0000', currency: 'MYR', direction: 'credit',
          suggestedCategoryId: null, suggestedCategoryName: null,
          categorisationConfidence: null, status: 'pending', transactionId: null,
        },
      ],
    } as null | Record<string, unknown>,
    result: null,
    error: null,
    refreshError: null,
    uploading: false,
    confirming: false,
    uploadStatement: vi.fn(),
    confirmRows: vi.fn(),
    discardUpload: vi.fn(),
  },
  transactionStore: {
    categories: [],
    fetchCategories: vi.fn(),
    reconcileAfterFinancialMutation: vi.fn(),
  },
}))

vi.mock('@/stores/statement', () => ({ useStatementStore: () => statementStore }))
vi.mock('@/stores/transaction', () => ({ useTransactionStore: () => transactionStore }))

describe('StatementImportView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    statementStore.upload = {
      id: 'upload-1', fileName: 'statement.pdf', status: 'pending',
      createdAt: '2026-07-01T00:00:00Z', confirmedAt: null,
      rows: [
        {
          id: 'debit-1', occurredAt: '2026-07-02T04:00:00Z', description: 'Coffee',
          merchantName: 'Cafe', amount: '12.3400', currency: 'MYR', direction: 'debit',
          suggestedCategoryId: null, suggestedCategoryName: null,
          categorisationConfidence: null, status: 'pending', transactionId: null,
        },
        {
          id: 'credit-1', occurredAt: '2026-07-03T04:00:00Z', description: 'Salary credit',
          merchantName: 'Employer', amount: '3200.0000', currency: 'MYR', direction: 'credit',
          suggestedCategoryId: null, suggestedCategoryName: null,
          categorisationConfidence: null, status: 'pending', transactionId: null,
        },
      ],
    }
    statementStore.result = null
    statementStore.error = null
    statementStore.refreshError = null
    statementStore.uploading = false
    statementStore.confirming = false
  })

  it('keeps credits visible but disables them for import', () => {
    const wrapper = mount(StatementImportView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true } },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.some(box => !(box.element as HTMLInputElement).disabled)).toBe(true)
    expect(checkboxes.some(box => (box.element as HTMLInputElement).disabled)).toBe(true)
    expect(wrapper.text()).toContain('Credit — visible for review, not importable')
  })

  it('shows validation errors for wrong statement file type and oversized PDFs', async () => {
    statementStore.upload = null
    const wrapper = mount(StatementImportView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true } },
    })
    const input = wrapper.get('input[type="file"]')

    await triggerFile(input.element as HTMLInputElement, new File(['text'], 'statement.txt', { type: 'text/plain' }))
    expect(wrapper.get('[role="alert"]').text()).toContain('Choose a PDF statement')
    expect(statementStore.uploadStatement).not.toHaveBeenCalled()

    await triggerFile(
      input.element as HTMLInputElement,
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'statement.pdf', { type: 'application/pdf' }),
    )
    expect(wrapper.get('[role="alert"]').text()).toContain('up to 10 MB')
    expect(statementStore.uploadStatement).not.toHaveBeenCalled()
  })

  it('accepts a PDF with empty browser MIME', async () => {
    statementStore.uploadStatement.mockResolvedValue(statementStore.upload)
    statementStore.upload = null
    const wrapper = mount(StatementImportView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true } },
    })

    await triggerFile(wrapper.get('input[type="file"]').element as HTMLInputElement, fileWithEmptyMime('statement.pdf', 10))
    expect(statementStore.uploadStatement).toHaveBeenCalledWith(expect.objectContaining({ name: 'statement.pdf' }))
  })

  it('reconciles transaction caches after successful statement import', async () => {
    statementStore.confirmRows.mockResolvedValue(undefined)
    const wrapper = mount(StatementImportView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true } },
    })
    const importButton = wrapper.findAll('button')
      .find((button) => button.text().includes('Import 1 rows'))

    expect(importButton).toBeTruthy()
    await importButton!.trigger('click')

    expect(statementStore.confirmRows).toHaveBeenCalledWith([{ rowId: 'debit-1', categoryId: undefined }])
    expect(transactionStore.reconcileAfterFinancialMutation).toHaveBeenCalledWith({ refreshTransactions: true })
  })
})

async function triggerFile(input: HTMLInputElement, file: File): Promise<void> {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  })
  input.dispatchEvent(new Event('change'))
  await Promise.resolve()
}

function fileWithEmptyMime(name: string, size: number): File {
  const file = new File([new Uint8Array(size)], name, { type: '' })
  Object.defineProperty(file, 'type', {
    configurable: true,
    value: '',
  })
  return file
}
