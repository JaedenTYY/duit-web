import { describe, expect, it } from 'vitest'
import { dateOnlyToLocalDateTimeInput, instantToLocalDateTimeInput, localDateTimeInputToInstant } from './localDateTime'

describe('Malaysia local datetime conversion', () => {
  it('round trips Malaysian midnight across its UTC date boundary', () => {
    const instant = '2026-06-30T16:00:00.000Z'
    const local = instantToLocalDateTimeInput(instant, 'Asia/Kuala_Lumpur')
    expect(local).toBe('2026-07-01T00:00')
    expect(localDateTimeInputToInstant(local, 'Asia/Kuala_Lumpur')).toBe(instant)
  })

  it.each([
    ['2026-12-31T16:00:00.000Z', '2027-01-01T00:00'],
    ['2028-02-28T16:00:00.000Z', '2028-02-29T00:00'],
    ['2026-07-31T16:00:00.000Z', '2026-08-01T00:00'],
  ])('handles year month and leap-day boundary %s', (instant, local) => {
    expect(instantToLocalDateTimeInput(instant, 'Asia/Kuala_Lumpur')).toBe(local)
    expect(localDateTimeInputToInstant(local, 'Asia/Kuala_Lumpur')).toBe(instant)
  })

  it('represents a receipt calendar date at local noon without UTC parsing', () => {
    expect(dateOnlyToLocalDateTimeInput('2026-07-25')).toBe('2026-07-25T12:00')
  })
})
