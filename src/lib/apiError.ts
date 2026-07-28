export interface ApiFailureDetails {
  message: string
  requestId: string | null
  fields: Record<string, string> | null
  status: number | null
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

  return {
    message,
    requestId: bodyRequestId ?? headerRequestId,
    fields,
    status,
    supportWorthy: status === null || status >= 500,
  }
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
