export const CURRENCY_CATALOGUE = {
  MYR: { displayScale: 2, locale: 'ms-MY', symbol: 'RM' },
  SGD: { displayScale: 2, locale: 'en-SG', symbol: 'S$' },
  IDR: { displayScale: 0, locale: 'id-ID', symbol: 'Rp' },
  USD: { displayScale: 2, locale: 'en-US', symbol: 'US$' },
  THB: { displayScale: 2, locale: 'th-TH', symbol: '฿' },
} as const

export type SupportedCurrency = keyof typeof CURRENCY_CATALOGUE

const amountMaximum = '99999999.9999'
const fxMaximum = '9999.999999'
const unsignedDecimal = /^[0-9]+(?:\.[0-9]+)?$/
const displayDecimal = /^-?[0-9]+(?:\.[0-9]+)?$/

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return value in CURRENCY_CATALOGUE
}

export function normalizeDecimalInput(value: string): string {
  return value.trim()
}

export function validateAmountInput(value: string): string | null {
  return validatePositiveDecimal(value, 4, amountMaximum, 'Amount')
}

export function validateFxRateInput(value: string): string | null {
  return validatePositiveDecimal(value, 6, fxMaximum, 'Exchange rate')
}

export function addDecimalStrings(values: string[], scale = 4): string {
  const factor = 10n ** BigInt(scale)
  const total = values.reduce((sum, value) => sum + decimalToScaledInteger(value, scale), 0n)
  const negative = total < 0n
  const absolute = negative ? -total : total
  const integer = absolute / factor
  const fraction = (absolute % factor).toString().padStart(scale, '0')
  return `${negative ? '-' : ''}${integer}.${fraction}`
}

export function roundDecimalForDisplay(value: string, scale: number): string {
  const normalized = value.trim()
  if (!displayDecimal.test(normalized)) throw new Error('Invalid decimal display value')
  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const [integerPart, fractionPart = ''] = unsigned.split('.')
  const kept = fractionPart.slice(0, scale).padEnd(scale, '0')
  const roundingDigit = fractionPart.charAt(scale)
  let scaled = BigInt(integerPart) * (10n ** BigInt(scale)) + BigInt(kept || '0')
  if (roundingDigit && roundingDigit >= '5') scaled += 1n
  const factor = 10n ** BigInt(scale)
  const roundedInteger = scaled / factor
  const roundedFraction = (scaled % factor).toString().padStart(scale, '0')
  return `${negative && scaled !== 0n ? '-' : ''}${roundedInteger}${scale ? `.${roundedFraction}` : ''}`
}

export function toPresentationNumber(value: string): number {
  if (!displayDecimal.test(value.trim())) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function validatePositiveDecimal(
  value: string,
  maximumScale: number,
  maximum: string,
  label: string,
): string | null {
  const normalized = normalizeDecimalInput(value)
  if (!normalized) return `${label} is required.`
  if (!unsignedDecimal.test(normalized)) return `${label} must use plain decimal notation without signs or separators.`
  const [, fraction = ''] = normalized.split('.')
  if (fraction.length > maximumScale) return `${label} supports at most ${maximumScale} decimal places.`
  if (compareUnsignedDecimals(normalized, '0') <= 0) return `${label} must be greater than zero.`
  if (compareUnsignedDecimals(normalized, maximum) > 0) return `${label} exceeds the supported maximum.`
  return null
}

function compareUnsignedDecimals(left: string, right: string): number {
  const [leftIntegerRaw, leftFraction = ''] = left.split('.')
  const [rightIntegerRaw, rightFraction = ''] = right.split('.')
  const leftInteger = leftIntegerRaw.replace(/^0+(?=\d)/, '')
  const rightInteger = rightIntegerRaw.replace(/^0+(?=\d)/, '')
  if (leftInteger.length !== rightInteger.length) return leftInteger.length > rightInteger.length ? 1 : -1
  if (leftInteger !== rightInteger) return leftInteger > rightInteger ? 1 : -1
  const width = Math.max(leftFraction.length, rightFraction.length)
  const paddedLeft = leftFraction.padEnd(width, '0')
  const paddedRight = rightFraction.padEnd(width, '0')
  return paddedLeft === paddedRight ? 0 : paddedLeft > paddedRight ? 1 : -1
}

function decimalToScaledInteger(value: string, scale: number): bigint {
  const normalized = value.trim()
  if (!displayDecimal.test(normalized)) throw new Error('Invalid decimal value')
  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const [integer, fraction = ''] = unsigned.split('.')
  if (fraction.length > scale) throw new Error(`Decimal exceeds scale ${scale}`)
  const scaled = BigInt(integer) * (10n ** BigInt(scale)) + BigInt(fraction.padEnd(scale, '0') || '0')
  return negative ? -scaled : scaled
}
