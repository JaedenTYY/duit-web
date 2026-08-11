export const REPORTING_TIME_ZONE = 'Asia/Kuala_Lumpur'

const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

export function instantToLocalDateTimeInput(
  instant: string,
  timeZone = REPORTING_TIME_ZONE,
): string {
  const date = new Date(instant)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid instant')
  const parts = dateTimeParts(date, timeZone)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function localDateTimeInputToInstant(
  value: string,
  timeZone = REPORTING_TIME_ZONE,
): string {
  const match = localDateTimePattern.exec(value)
  if (!match) throw new Error('Invalid local date and time')
  const [, year, month, day, hour, minute] = match
  const wallTimeUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute)
  const wallDate = new Date(wallTimeUtc)
  if (
    wallDate.getUTCFullYear() !== +year || wallDate.getUTCMonth() !== +month - 1
    || wallDate.getUTCDate() !== +day || wallDate.getUTCHours() !== +hour
    || wallDate.getUTCMinutes() !== +minute
  ) throw new Error('Invalid local date and time')

  let candidate = new Date(wallTimeUtc)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    candidate = new Date(wallTimeUtc - timeZoneOffsetMilliseconds(candidate, timeZone))
  }
  if (instantToLocalDateTimeInput(candidate.toISOString(), timeZone) !== value) {
    throw new Error('Local date and time does not exist in the selected timezone')
  }
  return candidate.toISOString()
}

export function dateOnlyToLocalDateTimeInput(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid calendar date')
  return `${value}T12:00`
}

export function currentReportingYearMonth(now = new Date()): { year: number; month: number } {
  const parts = dateTimeParts(now, REPORTING_TIME_ZONE)
  return { year: Number(parts.year), month: Number(parts.month) }
}

export function formatCalendarDate(value: string, locale = 'en-MY'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid calendar date')
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}

function timeZoneOffsetMilliseconds(date: Date, timeZone: string): number {
  const parts = dateTimeParts(date, timeZone)
  const represented = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second),
  )
  return represented - date.getTime()
}

function dateTimeParts(date: Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]),
  )
}
