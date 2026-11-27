import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const OLD_SESSION = session('old')
const NEW_SESSION = session('new')
const LATE_REFRESH = { ...OLD_SESSION, token: 'late-refresh-access' }

for (const coordination of ['Web Locks', 'election'] as const) {
  test(`${coordination}: logout defeats in-flight and peer refresh, then allows new login`, async ({ context, page }) => {
    if (coordination === 'election') {
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'locks', { value: undefined })
      })
    }
    const mock = await mockAuth(context)
    const peer = await context.newPage()
    await page.goto('/login')
    await peer.goto('/login')
    await signIn(page, OLD_SESSION.user.email)
    await expect.poll(() => token(peer)).toBe(OLD_SESSION.token)

    const oldLifecycle = await lifecycle(page)
    const oldRefresh = mock.holdRefresh()
    await beginRefresh(page, 2)
    await oldRefresh.started
    await beginRefresh(peer, 1)
    await peer.evaluate(async () => {
      const path = '/src/lib/sessionCoordinator.ts'
      await (await import(path)).logoutSession()
    })
    await expect.poll(() => token(page)).toBeNull()
    expect(mock.revocations()).toBe(1)

    oldRefresh.release(200)
    expect(await refreshResults(page)).toEqual(['rejected', 'rejected'])
    expect(await refreshResults(peer)).toEqual(['rejected'])
    expect(mock.refreshesSinceLogin()).toBe(1)
    expect(await token(page)).toBeNull()
    expect(await token(peer)).toBeNull()
    // The browser can apply a late Set-Cookie even though the app discards its response.
    expect((await context.cookies()).find((cookie) => cookie.name === 'duit-refresh')).toMatchObject({
      httpOnly: true,
      value: 'late-cookie-from-revoked-family',
    })
    const loggedOutLifecycle = await lifecycle(peer)
    await page.reload()
    await expect.poll(() => bootstrapStatus(page)).toBe('anonymous')
    expect(mock.refreshesSinceLogin()).toBe(1)

    await signIn(peer, NEW_SESSION.user.email)
    await expect.poll(() => token(page)).toBe(NEW_SESSION.token)
    await deliverDelayedMessages(page, oldLifecycle, loggedOutLifecycle)
    expect(await token(page)).toBe(NEW_SESSION.token)
    expect(await page.evaluate(() => JSON.stringify([Object.values(localStorage), Object.values(sessionStorage)])))
      .not.toContain(NEW_SESSION.token)
  })
}

test('concurrent election refreshes share the successful response across tabs', async ({ context, page }) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { value: undefined })
  })
  const mock = await mockAuth(context)
  const peer = await context.newPage()
  await page.goto('/login')
  await peer.goto('/login')
  await signIn(page, OLD_SESSION.user.email)
  await expect.poll(() => token(peer)).toBe(OLD_SESSION.token)

  const refresh = mock.holdRefresh()
  await beginRefresh(page, 2)
  await refresh.started
  await beginRefresh(peer, 2)
  refresh.release(200)

  expect(await refreshResults(page)).toEqual(['fulfilled', 'fulfilled'])
  expect(await refreshResults(peer)).toEqual(['fulfilled', 'fulfilled'])
  expect(mock.refreshesSinceLogin()).toBe(1)
  expect(await token(page)).toBe(LATE_REFRESH.token)
  expect(await token(peer)).toBe(LATE_REFRESH.token)
})

test('a different login survives a failed refresh from the previous tab', async ({ context, page }) => {
  const mock = await mockAuth(context)
  const peer = await context.newPage()
  await page.goto('/login')
  await peer.goto('/login')
  await signIn(page, OLD_SESSION.user.email)
  await expect.poll(() => token(peer)).toBe(OLD_SESSION.token)

  const oldRefresh = mock.holdRefresh()
  await beginRefresh(page, 1)
  await oldRefresh.started
  await signIn(peer, NEW_SESSION.user.email)
  await expect.poll(() => token(page)).toBe(NEW_SESSION.token)
  oldRefresh.release(401)

  expect(await refreshResults(page)).toEqual(['rejected'])
  expect(await token(page)).toBe(NEW_SESSION.token)
  expect(await token(peer)).toBe(NEW_SESSION.token)
  await expect(page).toHaveURL(/\/dashboard$/)
})

for (const terminal of ['revocation', 'deletion'] as const) {
  test(`an old refresh cannot reopen a session after ${terminal}`, async ({ context, page }) => {
    const mock = await mockAuth(context)
    const peer = await context.newPage()
    await page.goto('/login')
    await peer.goto('/login')
    await signIn(page, OLD_SESSION.user.email)
    await expect.poll(() => token(peer)).toBe(OLD_SESSION.token)

    const oldLifecycle = await lifecycle(page)
    const oldRefresh = mock.holdRefresh()
    await beginRefresh(page, 1)
    await oldRefresh.started
    await page.evaluate(async (reason) => {
      const path = '/src/lib/sessionCoordinator.ts'
      const coordinator = await import(path)
      if (reason === 'deletion') coordinator.propagateAccountDeletion()
      else coordinator.propagateRevocation()
    }, terminal)
    oldRefresh.release(200)

    expect(await refreshResults(page)).toEqual(['rejected'])
    if (terminal === 'deletion') {
      await expect(peer).toHaveURL('http://127.0.0.1:5173/')
      await expect(peer.getByRole('heading', { level: 1 })).toBeVisible()
    }
    await expect.poll(() => token(peer)).toBeNull()
    await deliverDelayedMessages(peer, oldLifecycle)
    expect(await token(page)).toBeNull()
    expect(await token(peer)).toBeNull()
  })
}

async function mockAuth(context: BrowserContext) {
  let active: ReturnType<typeof session> | null = null
  let revocations = 0
  let refreshCount = 0
  let nextRefresh: { started: () => void; result: Promise<200 | 401> } | null = null
  const ok = (data: unknown, headers?: Record<string, string>) => ({
    status: 200, json: { data }, headers,
  })
  const refreshDenied = { status: 401, json: { error: { code: 'ERR_AUTH_REFRESH_401' } } }
  const refreshCookie = (value: string) => ({ 'Set-Cookie': `duit-refresh=${value}; HttpOnly; Path=/; SameSite=Lax` })

  await context.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/csrf') {
      return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'masked-csrf' }))
    }
    if (path === '/api/auth/login') {
      active = route.request().postDataJSON().email === NEW_SESSION.user.email ? NEW_SESSION : OLD_SESSION
      refreshCount = 0
      return route.fulfill(ok(active, refreshCookie('signed-in-cookie')))
    }
    if (path === '/api/auth/logout') {
      revocations += 1
      active = null
      return route.fulfill(ok(null, refreshCookie('; Max-Age=0')))
    }
    if (path === '/api/auth/refresh') {
      refreshCount += 1
      if (!nextRefresh) return route.fulfill(active ? ok(active) : refreshDenied)
      const held = nextRefresh
      nextRefresh = null
      held.started()
      const status = await held.result
      return route.fulfill(status === 200
        ? ok(LATE_REFRESH, refreshCookie(active ? 'rotated-cookie' : 'late-cookie-from-revoked-family'))
        : refreshDenied)
    }
    if (path === '/api/transactions') {
      return route.fulfill(ok({ transactions: [], nextCursor: null, nextCursorId: null, hasMore: false }))
    }
    if (path === '/api/transactions/summary/monthly') {
      return route.fulfill(ok({ totalSpend: '0.0000', transactionCount: 0, byCategory: [] }))
    }
    return route.fulfill(ok([]))
  })

  return {
    holdRefresh() {
      const started = deferred<void>()
      const outcome = deferred<200 | 401>()
      nextRefresh = { started: () => started.resolve(), result: outcome.promise }
      return { started: started.promise, release: outcome.resolve }
    },
    refreshesSinceLogin: () => refreshCount,
    revocations: () => revocations,
  }
}

function session(name: string) {
  return {
    token: `${name}-login-access`,
    expiresAt: '2099-08-01T00:00:00.000Z',
    user: {
      id: `session-test-${name}`, email: `${name}@example.test`, fullName: `Session ${name}`,
      preferredCurrency: 'MYR', createdAt: '2026-08-01T00:00:00.000Z',
    },
  }
}

async function signIn(page: Page, email: string) {
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill('test-password')
  await page.getByTestId('auth-submit').click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function beginRefresh(page: Page, count: number) {
  await page.evaluate(async (requests) => {
    const path = '/src/lib/sessionCoordinator.ts'
    const { refreshSessionSingleFlight } = await import(path)
    const results = Promise.allSettled(Array.from({ length: requests }, () => refreshSessionSingleFlight()))
      .then((settled) => settled.map((result) => result.status))
    Reflect.set(window, 'duitTestRefreshResults', results)
  }, count)
}

function refreshResults(page: Page): Promise<string[]> {
  return page.evaluate(() => Reflect.get(window, 'duitTestRefreshResults'))
}

function token(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const path = '/src/stores/auth.ts'
    return (await import(path)).useAuthStore().token
  })
}

function bootstrapStatus(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const path = '/src/stores/auth.ts'
    return (await import(path)).useAuthStore().bootstrapStatus
  })
}

function lifecycle(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('duit-auth-lifecycle'))
}

async function deliverDelayedMessages(page: Page, oldLifecycle: string | null, logoutLifecycle?: string | null) {
  await page.evaluate(async ({ oldLifecycle, logoutLifecycle, session }) => {
    const sender = new BroadcastChannel('duit-auth-session')
    const observer = new BroadcastChannel('duit-auth-session')
    const delivered = new Promise<void>((resolve) => {
      observer.addEventListener('message', (event) => {
        if (event.data.type === 'test-delivered') resolve()
      })
    })
    const operation = { tabId: 'delayed-peer', lifecycle: oldLifecycle, operationId: 'obsolete-refresh' }
    sender.postMessage({ ...operation, type: 'refresh-start' })
    sender.postMessage({ ...operation, type: 'refresh-result', session })
    if (logoutLifecycle) {
      sender.postMessage({ type: 'anonymous', tabId: 'delayed-peer', lifecycle: logoutLifecycle, reason: 'logout' })
    }
    sender.postMessage({ type: 'test-delivered' })
    await delivered
    sender.close()
    observer.close()
  }, { oldLifecycle, logoutLifecycle, session: LATE_REFRESH })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}
