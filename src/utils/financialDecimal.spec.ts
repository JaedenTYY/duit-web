import { describe, expect, it } from 'vitest'
import { addDecimalStrings, roundDecimalForDisplay, validateAmountInput, validateFxRateInput } from './financialDecimal'
import { formatCurrency } from './currency'

describe('financial decimal helpers', () => {
  it.each(['', '0', '-1', '+1', '1e2', '1,000', '1.00000', '100000000'])(
    'rejects invalid authoritative amount %s',
    value => expect(validateAmountInput(value)).not.toBeNull(),
  )

  it('accepts exact amount boundaries and preserves string values', () => {
    expect(validateAmountInput('0.1')).toBeNull()
    expect(validateAmountInput('0.10')).toBeNull()
    expect(validateAmountInput('12.3456')).toBeNull()
    expect(validateAmountInput('99999999.9999')).toBeNull()
  })

  it.each(['0', '-1', '1e2', '1,000', '1.0000000', '10000'])(
    'rejects invalid authoritative fx rate %s',
    value => expect(validateFxRateInput(value)).not.toBeNull(),
  )

  it('adds exact decimal strings without Number', () => {
    expect(addDecimalStrings(['0.1000', '0.2000'])).toBe('0.3000')
    expect(addDecimalStrings(['99999999.9999', '-0.0001'])).toBe('99999999.9998')
  })

  it('formats every supported currency without mutating the input', () => {
    const value = '12.3456'
    expect(formatCurrency(value, 'MYR')).toBe('RM 12.35')
    expect(formatCurrency(value, 'SGD')).toBe('S$ 12.35')
    expect(formatCurrency(value, 'USD')).toBe('US$ 12.35')
    expect(formatCurrency(value, 'THB')).toBe('฿ 12.35')
    expect(formatCurrency(value, 'IDR')).toBe('Rp 12')
    expect(value).toBe('12.3456')
    expect(roundDecimalForDisplay('1.0050', 2)).toBe('1.01')
  })
})
