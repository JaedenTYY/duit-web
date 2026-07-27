import { describe, expect, it } from 'vitest'
import { extractApiFailure } from './apiError'

const BODY_ID = 'f64651f2-c852-4dd7-869a-c20a5a434534'
const HEADER_ID = 'a9020667-e22e-447c-9ca2-e11fca20e13c'

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

  it('does not accept a malformed request ID', () => {
    const failure = extractApiFailure({
      response: {
        status: 500,
        data: { error: { requestId: 'attacker-controlled-value' } },
      },
    })

    expect(failure.requestId).toBeNull()
  })
})
