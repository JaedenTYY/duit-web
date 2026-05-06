export function formatCurrency(amount: string, currency: string): string {
  const value = parseFloat(amount)
  
  const locales: Record<string, string> = {
    MYR: 'ms-MY',
    SGD: 'en-SG',
    IDR: 'id-ID',
    USD: 'en-US',
  }

  const currencySymbols: Record<string, string> = {
    MYR: 'RM',
    SGD: 'S$',
    IDR: 'Rp',
    USD: 'US$',
  }

  const formatter = new Intl.NumberFormat(locales[currency] || 'en-US', {
    style: 'decimal',
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  })

  const formattedValue = formatter.format(value)
  const symbol = currencySymbols[currency] || currency

  return `${symbol} ${formattedValue}`
}
