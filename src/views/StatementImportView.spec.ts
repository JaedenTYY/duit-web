import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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
    },
    result: null,
    error: null,
    uploading: false,
    confirming: false,
    uploadStatement: vi.fn(),
    confirmRows: vi.fn(),
    discardUpload: vi.fn(),
  },
  transactionStore: { categories: [], fetchCategories: vi.fn() },
}))

vi.mock('@/stores/statement', () => ({ useStatementStore: () => statementStore }))
vi.mock('@/stores/transaction', () => ({ useTransactionStore: () => transactionStore }))

describe('StatementImportView', () => {
  it('keeps credits visible but disables them for import', () => {
    const wrapper = mount(StatementImportView, {
      global: { stubs: { PageHeader: true, ErrorBanner: true } },
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.some(box => !(box.element as HTMLInputElement).disabled)).toBe(true)
    expect(checkboxes.some(box => (box.element as HTMLInputElement).disabled)).toBe(true)
    expect(wrapper.text()).toContain('Credit — visible for review, not importable')
  })
})
