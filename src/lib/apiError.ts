export interface ApiFailureDetails {
  message: string
  code: string | null
  requestId: string | null
  fields: Record<string, string> | null
  status: number | null
  retryAfterSeconds: number | null
  rateLimitResetAt: string | null
  supportWorthy: boolean
}

export function extractApiFailure(error: unknown): ApiFailureDetails {
  const response = getResponse(error)
  const status = typeof response?.status === 'number' ? response.status : null
  const errorBody = isRecord(response?.data) && isRecord(response.data.error)
    ? response.data.error
    : null
  const message = typeof errorBody?.message === 'string' && errorBody.message.trim()
    ? errorBody.message
    : 'An unexpected error occurred'
  const bodyRequestId = validRequestId(errorBody?.requestId)
  const headerRequestId = validRequestId(readHeader(response?.headers, 'x-request-id'))
  const fields = isRecord(errorBody?.fields)
    ? Object.fromEntries(
      Object.entries(errorBody.fields).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    )
    : null
  const code = typeof errorBody?.code === 'string' && errorBody.code.trim()
    ? errorBody.code
    : null
  const retryAfterSeconds = parseRetryAfter(
    readHeader(response?.headers, 'retry-after')
  )
  const rateLimitResetAt = parseRateLimitReset(
    readHeader(response?.headers, 'ratelimit-reset')
  )

  return {
    message,
    code,
    requestId: bodyRequestId ?? headerRequestId,
    fields,
    status,
    retryAfterSeconds,
    rateLimitResetAt,
    supportWorthy: status === null || status >= 500,
  }
}

export function parseRetryAfter(value: unknown, nowMs = Date.now()): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  if (!text) return null
  if (/^\d+$/.test(text)) {
    const seconds = Number(text)
    return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null
  }
  if (/^[+-]?\d+$/.test(text)) return null
  const timestamp = Date.parse(text)
  if (!Number.isFinite(timestamp)) return null
  return Math.max(0, Math.ceil((timestamp - nowMs) / 1000))
}

export function apiFailureMessage(
  failure: ApiFailureDetails,
  fallback = 'An unexpected error occurred'
): string {
  const message = failure.message || fallback
  return failure.retryAfterSeconds !== null && failure.retryAfterSeconds > 0
    ? `${message} Try again in ${failure.retryAfterSeconds} seconds.`
    : message
}

function parseRateLimitReset(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const epochSeconds = Number(String(value).trim())
  if (!Number.isSafeInteger(epochSeconds) || epochSeconds < 0) return null
  const timestamp = epochSeconds * 1000
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function getResponse(error: unknown): {
  status?: unknown
  data?: unknown
  headers?: unknown
} | null {
  if (!isRecord(error) || !isRecord(error.response)) return null
  return {
    status: error.response.status,
    data: error.response.data,
    headers: error.response.headers,
  }
}

function readHeader(headers: unknown, name: string): unknown {
  if (!headers) return null
  if (isRecord(headers) && typeof headers.get === 'function') {
    return headers.get(name)
  }
  if (!isRecord(headers)) return null
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name)
  return match?.[1]
}

function validRequestId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return UUID_PATTERN.test(normalized) && normalized !== NIL_UUID
    ? normalized
    : null
}

function isRecord(value: unknown): value is Record<string, unknown> & {
  get?: (name: string) => unknown
} {
  return typeof value === 'object' && value !== null
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const NIL_UUID = '00000000-0000-0000-0000-000000000000'
