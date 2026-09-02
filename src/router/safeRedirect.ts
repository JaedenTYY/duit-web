import type { Router } from 'vue-router'

const LOOP_ROUTE_NAMES = new Set(['login', 'register'])
const SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/

export function resolveSafeInternalRedirect(
  rawRedirect: unknown,
  router: Router,
): string | null {
  const raw = Array.isArray(rawRedirect) ? rawRedirect[0] : rawRedirect
  if (typeof raw !== 'string') return null

  const redirect = raw.trim()
  if (!redirect.startsWith('/') || redirect.startsWith('//') || SCHEME_PATTERN.test(redirect)) {
    return null
  }

  const resolved = router.resolve(redirect)
  if (!resolved.matched.length || resolved.name === 'not-found') return null
  if (typeof resolved.name === 'string' && LOOP_ROUTE_NAMES.has(resolved.name)) return null
  return resolved.fullPath
}
