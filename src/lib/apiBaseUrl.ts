const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

export function resolveApiBaseUrl(rawValue: string | undefined, isProduction: boolean): string {
  const value = rawValue?.trim()

  if (!value) {
    if (isProduction) {
      throw new Error('VITE_API_BASE_URL is required for a production build.')
    }
    return '/api'
  }

  if (value.startsWith('/')) {
    if (isProduction) {
      throw new Error('VITE_API_BASE_URL must be an absolute HTTPS URL in production.')
    }
    return normalizePath(value)
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid absolute URL.')
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_API_BASE_URL must not contain credentials, a query string, or a fragment.')
  }

  if (isProduction && url.protocol !== 'https:') {
    throw new Error('VITE_API_BASE_URL must use HTTPS in production.')
  }

  if (!isProduction && url.protocol === 'http:' && !LOCAL_HOSTNAMES.has(url.hostname)) {
    throw new Error('Insecure HTTP is allowed only for local development hosts.')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS.')
  }

  url.pathname = normalizePath(url.pathname)
  return url.toString().replace(/\/$/, '')
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\/+$/, '')
  return normalized || '/'
}
