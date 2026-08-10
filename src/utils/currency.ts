import { CURRENCY_CATALOGUE, isSupportedCurrency, roundDecimalForDisplay } from './financialDecimal'

export function formatCurrency(amount: string, currency: string): string {
  if (!isSupportedCurrency(currency)) return `${currency} ${amount}`
  const policy = CURRENCY_CATALOGUE[currency]
  const rounded = roundDecimalForDisplay(amount, policy.displayScale)
  const negative = rounded.startsWith('-')
  const unsigned = negative ? rounded.slice(1) : rounded
  const [integer, fraction] = unsigned.split('.')
  const groupedInteger = BigInt(integer).toLocaleString(policy.locale)
  const formatted = fraction === undefined ? groupedInteger : `${groupedInteger}.${fraction}`
  return `${negative ? '-' : ''}${policy.symbol} ${formatted}`
}
