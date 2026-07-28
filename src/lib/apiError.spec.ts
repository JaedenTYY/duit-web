import { describe, expect, it } from 'vitest'
import { extractApiFailure } from './apiError'

const BODY_ID = 'f64651f2-c852-4dd7-869a-c20a5a434534'
const HEADER_ID = 'a9020667-e22e-447c-9ca2-e11fca20e13c'
const UUID_V7 = '01890f8a-7b3c-7cc1-98ab-1234567890ab'

describe('extractApiFailure', () => {
  it('prefers the correlated request ID from the API error body', () => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: {
          error: {
            message: 'An unexpected error occurred',
            requestId: BODY_ID,
          },
        },
        headers: { 'x-request-id': HEADER_ID },
      },
    })

    expect(failure.requestId).toBe(BODY_ID)
    expect(failure.supportWorthy).toBe(true)
  })

  it('uses the response header when the body omits requestId', () => {
    const failure = extractApiFailure({
      response: {
        status: 502,
        data: { error: { message: 'An unexpected error occurred' } },
        headers: { 'X-Request-ID': HEADER_ID },
      },
    })

    expect(failure.requestId).toBe(HEADER_ID)
  })

  it('accepts canonical UUIDv7 request IDs', () => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: { error: { requestId: UUID_V7 } },
      },
    })

    expect(failure.requestId).toBe(UUID_V7)
  })

  it('accepts uppercase canonical IDs and normalizes them to lowercase', () => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: { error: { requestId: BODY_ID.toUpperCase() } },
      },
    })

    expect(failure.requestId).toBe(BODY_ID)
  })

  it('preserves controlled validation fields without treating a 4xx as support-worthy', () => {
    const failure = extractApiFailure({
      response: {
        status: 422,
        data: {
          error: {
            message: 'Validation failed',
            fields: { email: 'must be a well-formed email address' },
          },
        },
      },
    })

    expect(failure.fields).toEqual({
      email: 'must be a well-formed email address',
    })
    expect(failure.supportWorthy).toBe(false)
  })

  it.each([
    ['nil', '00000000-0000-0000-0000-000000000000'],
    ['malformed', 'attacker-controlled-value'],
    ['oversized', `${BODY_ID}-attacker-suffix`],
    ['missing', undefined],
  ])('does not accept a %s request ID', (_label, requestId) => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: { error: { requestId } },
      },
    })

    expect(failure.requestId).toBeNull()
  })

  it('falls back to a valid header when the body contains a nil ID', () => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: {
          error: { requestId: '00000000-0000-0000-0000-000000000000' },
        },
        headers: { 'x-request-id': HEADER_ID },
      },
    })

    expect(failure.requestId).toBe(HEADER_ID)
  })
})
