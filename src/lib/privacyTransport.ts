import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import api from '@/lib/api'
import { csrfRequestHeaders } from '@/lib/authTransport'

export const ACCOUNT_DELETION_PHRASE = 'DELETE MY ACCOUNT'
export const DEFAULT_EXPORT_FILENAME = 'duit-personal-data.zip'

interface NonReplayableRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  _duitReplayable: false
}

export async function requestPersonalDataExport(
  currentPassword: string
): Promise<AxiosResponse<Blob>> {
  const headers = await csrfRequestHeaders()
  return api.post<Blob, AxiosResponse<Blob>, { currentPassword: string }>(
    '/privacy/export',
    { currentPassword },
    {
      headers,
      responseType: 'blob',
      _duitReplayable: false,
    } as NonReplayableRequestConfig<{ currentPassword: string }>
  )
}

export async function downloadPersonalData(currentPassword: string): Promise<string> {
  const response = await requestPersonalDataExport(currentPassword)
  const filename = safeDownloadFilename(response.headers['content-disposition'])
  const objectUrl = URL.createObjectURL(response.data)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.rel = 'noopener'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
  return filename
}

export async function deleteAccount(
  currentPassword: string,
  confirmationPhrase: string
): Promise<void> {
  const headers = await csrfRequestHeaders()
  await api.post(
    '/privacy/delete-account',
    { currentPassword, confirmationPhrase },
    {
      headers,
      _duitReplayable: false,
    } as NonReplayableRequestConfig<{ currentPassword: string; confirmationPhrase: string }>
  )
}

export async function disconnectGmail(deleteExtractions: boolean): Promise<void> {
  const headers = await csrfRequestHeaders()
  await api.delete('/gmail/disconnect', {
    headers,
    data: { deleteExtractions },
    _duitReplayable: false,
  } as NonReplayableRequestConfig<{ deleteExtractions: boolean }>)
}

export function safeDownloadFilename(contentDisposition: unknown): string {
  if (typeof contentDisposition !== 'string') return DEFAULT_EXPORT_FILENAME
  const match = /(?:^|;)\s*filename="?([^";]+)"?/i.exec(contentDisposition)
  if (!match) return DEFAULT_EXPORT_FILENAME
  const candidate = match[1]?.trim() ?? ''
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.zip$/.test(candidate)) {
    return DEFAULT_EXPORT_FILENAME
  }
  return candidate
}
