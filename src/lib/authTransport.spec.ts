import { beforeEach, describe, expect, it, vi } from 'vitest'

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosMock),
  },
}))

describe('refresh authentication transport', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const { clearCsrfToken } = await import('./authTransport')
    clearCsrfToken()
  })

  it('bootstraps CSRF and sends it with an idempotent refresh request ID', async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        data: {
          headerName: 'X-XSRF-TOKEN',
          token: 'masked-csrf-token',
        },
      },
    })
    axiosMock.post.mockResolvedValue({
      data: {
        data: {
          token: 'memory-access-token',
          expiresAt: '2026-07-31T00:15:00.000Z',
          user: { id: 'user-id' },
        },
      },
    })
    const { refreshAccessToken } = await import('./authTransport')

    await refreshAccessToken('018f86a7-4b3c-7d2a-8b20-4fb94f77c921')

    expect(axiosMock.get).toHaveBeenCalledWith('/auth/csrf')
    expect(axiosMock.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
      headers: {
        'X-XSRF-TOKEN': 'masked-csrf-token',
        'X-Refresh-Request-ID': '018f86a7-4b3c-7d2a-8b20-4fb94f77c921',
      },
    })
  })

  it('never accepts an incomplete CSRF bootstrap response', async () => {
    axiosMock.get.mockResolvedValue({ data: { data: { token: '' } } })
    const { ensureCsrfToken } = await import('./authTransport')

    await expect(ensureCsrfToken()).rejects.toThrow(
      'CSRF bootstrap response is invalid'
    )
    expect(axiosMock.post).not.toHaveBeenCalled()
  })

  it('clearing the memory token forces a fresh CSRF bootstrap', async () => {
    axiosMock.get.mockResolvedValue({
      data: {
        data: {
          headerName: 'X-XSRF-TOKEN',
          token: 'masked-csrf-token',
        },
      },
    })
    const { clearCsrfToken, ensureCsrfToken } = await import('./authTransport')

    await ensureCsrfToken()
    await ensureCsrfToken()
    clearCsrfToken()
    await ensureCsrfToken()

    expect(axiosMock.get).toHaveBeenCalledTimes(2)
  })
})
