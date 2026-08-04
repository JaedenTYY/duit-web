import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
  csrfRequestHeaders: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: { post: mocks.post, delete: mocks.delete },
}))
vi.mock('@/lib/authTransport', () => ({
  csrfRequestHeaders: mocks.csrfRequestHeaders,
}))

describe('privacy transport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.csrfRequestHeaders.mockResolvedValue({ 'X-XSRF-TOKEN': 'masked-csrf' })
  })

  it('sends export password with CSRF as a non-replayable Blob request', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' })
    mocks.post.mockResolvedValue({ data: blob, headers: {} })
    const { requestPersonalDataExport } = await import('./privacyTransport')

    await requestPersonalDataExport('current-password')

    expect(mocks.post).toHaveBeenCalledWith(
      '/privacy/export',
      { currentPassword: 'current-password' },
      expect.objectContaining({
        headers: { 'X-XSRF-TOKEN': 'masked-csrf' },
        responseType: 'blob',
        _duitReplayable: false,
      })
    )
  })

  it('downloads with a safe filename and always revokes the temporary object URL', async () => {
    const blob = new Blob(['zip'], { type: 'application/zip' })
    mocks.post.mockResolvedValue({
      data: blob,
      headers: { 'content-disposition': 'attachment; filename="duit-export.zip"' },
    })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const createObjectURL = vi.fn(() => 'blob:temporary-export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const { downloadPersonalData } = await import('./privacyTransport')

    await expect(downloadPersonalData('password')).resolves.toBe('duit-export.zip')

    expect(click).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:temporary-export')
    expect(document.querySelector('a[download]')).toBeNull()
    click.mockRestore()
    vi.unstubAllGlobals()
  })

  it('rejects path traversal and unsupported filename values', async () => {
    const { safeDownloadFilename, DEFAULT_EXPORT_FILENAME } = await import('./privacyTransport')

    expect(safeDownloadFilename('attachment; filename="../../tokens.zip"'))
      .toBe(DEFAULT_EXPORT_FILENAME)
    expect(safeDownloadFilename('attachment; filename="archive.exe"'))
      .toBe(DEFAULT_EXPORT_FILENAME)
    expect(safeDownloadFilename('attachment; filename="safe-export.zip"'))
      .toBe('safe-export.zip')
  })

  it('sends deletion and Gmail disconnect once without replay metadata', async () => {
    mocks.post.mockResolvedValue({})
    mocks.delete.mockResolvedValue({})
    const { deleteAccount, disconnectGmail } = await import('./privacyTransport')

    await deleteAccount('password', 'DELETE MY ACCOUNT')
    await disconnectGmail(true)

    expect(mocks.post).toHaveBeenCalledWith(
      '/privacy/delete-account',
      { currentPassword: 'password', confirmationPhrase: 'DELETE MY ACCOUNT' },
      expect.objectContaining({ _duitReplayable: false })
    )
    expect(mocks.delete).toHaveBeenCalledWith(
      '/gmail/disconnect',
      expect.objectContaining({ data: { deleteExtractions: true }, _duitReplayable: false })
    )
  })
})
