import { expect, test, type Browser, type Page, type Route } from '@playwright/test'

const userA = authUser('user-a', 'a@example.test', 'User A')
const userB = authUser('user-b', 'b@example.test', 'User B')

test('cross-user insight cache is cleared before a second user sees delayed data', async ({ page }) => {
  let activeUser: typeof userA | typeof userB | null = null
  let releaseUserBInsights!: () => void
  const userBInsightsGate = new Promise<void>((resolve) => {
    releaseUserBInsights = resolve
  })

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = apiPath(request.url())
    if (!path) return route.continue()

    if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item7' }))
    if (path === '/auth/refresh') return route.fulfill(activeUser ? ok(authResponse(activeUser)) : authError())
    if (path === '/auth/login') {
      const body = JSON.parse(request.postData() ?? '{}') as { email?: string }
      activeUser = body.email === userB.email ? userB : userA
      return route.fulfill(ok(authResponse(activeUser)))
    }
    if (path === '/auth/logout') {
      activeUser = null
      return route.fulfill(ok({}))
    }
    if (path === '/insights') {
      if (activeUser?.id === userB.id) await userBInsightsGate
      return route.fulfill(ok(activeUser?.id === userB.id
        ? [insight('user-b-insight', 'USER_B_PRIVATE_INSIGHT')]
        : [insight('user-a-insight', 'USER_A_PRIVATE_INSIGHT')]))
    }
    if (path === '/anomalies') return route.fulfill(ok([]))
    if (path === '/categories') return route.fulfill(ok([]))
    if (path === '/transactions') return route.fulfill(ok(emptyTransactionPage()))
    if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
    if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
    if (path.startsWith('/payment-qr-profiles') || path.startsWith('/bills') || path.startsWith('/statements')) {
      return route.fulfill(ok([]))
    }
    return route.fulfill(ok([]))
  })

  await login(page, userA.email)
  await page.goto('/insights')
  await expect(page.getByRole('heading', { name: 'USER_A_PRIVATE_INSIGHT' })).toBeVisible()

  await page.goto('/settings')
  await page.getByRole('button', { name: /Log out/ }).click()
  await expect(page).toHaveURL(/\/login/)

  await login(page, userB.email)
  await page.goto('/insights')

  await expect(page.getByText('USER_A_PRIVATE_INSIGHT')).toHaveCount(0)
  await expect(page.getByText('USER_B_PRIVATE_INSIGHT')).toHaveCount(0)

  releaseUserBInsights()
  await expect(page.getByRole('heading', { name: 'USER_B_PRIVATE_INSIGHT' })).toBeVisible()
  await expect(page.getByText('USER_A_PRIVATE_INSIGHT')).toHaveCount(0)
})

test('owner bill with long content has no horizontal page overflow at audited mobile widths', async ({ page }) => {
  let refreshActive = false
  await page.route('**/api/**', async (route) => {
    const path = apiPath(route.request().url())
    if (!path) return route.continue()
    if (path === '/auth/login') {
      refreshActive = true
      return route.fulfill(ok(authResponse(userA)))
    }
    if (path === '/auth/logout') {
      refreshActive = false
      return route.fulfill(ok({}))
    }
    await fulfillAuthenticatedLongBillRoute(route, path, refreshActive)
  })

  await login(page, userA.email)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/split-bill/bill-long')
    await expect(page.getByRole('heading', { name: /Very long receipt item name/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Mark paid/ })).toBeVisible()

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)
  }
})

test('login redirect query accepts only safe internal targets', async ({ browser }) => {
  await expectLoginRedirect(browser, '/settings/privacy', /\/settings\/privacy$/)
  await expectLoginRedirect(browser, 'https://evil.example', /\/dashboard$/)
  await expectLoginRedirect(browser, '//evil.example', /\/dashboard$/)
  await expectLoginRedirect(browser, '/login?redirect=/settings/privacy', /\/dashboard$/)
})

async function login(page: Page, email: string) {
  await page.addInitScript(() => {
    localStorage.setItem('duit:onboardingCompleted', 'true')
  })
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', 'correct-password')
  await page.click('[data-testid="auth-submit"]')
  await page.waitForURL(/\/dashboard/)
}

async function expectLoginRedirect(browser: Browser, redirect: string, expectedUrl: RegExp) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:5173' })
  const page = await context.newPage()
  await page.route('**/api/**', async (route) => {
    const path = apiPath(route.request().url())
    if (!path) return route.continue()
    if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item7' }))
    if (path === '/auth/refresh') return route.fulfill(authError())
    if (path === '/auth/login') return route.fulfill(ok(authResponse(userA)))
    if (path === '/categories') return route.fulfill(ok([]))
    if (path === '/transactions') return route.fulfill(ok(emptyTransactionPage()))
    if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
    if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
    if (path === '/insights' || path === '/anomalies') return route.fulfill(ok([]))
    if (path.startsWith('/payment-qr-profiles') || path.startsWith('/bills') || path.startsWith('/statements')) {
      return route.fulfill(ok([]))
    }
    return route.fulfill(ok([]))
  })
  await page.addInitScript(() => {
    localStorage.setItem('duit:onboardingCompleted', 'true')
  })
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`)
  await page.fill('input[type="email"]', userA.email)
  await page.fill('input[type="password"]', 'correct-password')
  await page.click('[data-testid="auth-submit"]')
  await expect(page).toHaveURL(expectedUrl)
  await context.close()
}

async function fulfillAuthenticatedLongBillRoute(route: Route, path: string, refreshActive: boolean) {
  if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item7' }))
  if (path === '/auth/refresh') return route.fulfill(refreshActive ? ok(authResponse(userA)) : authError())
  if (path === '/categories') return route.fulfill(ok([]))
  if (path === '/transactions') return route.fulfill(ok(emptyTransactionPage()))
  if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
  if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
  if (path === '/insights' || path === '/anomalies') return route.fulfill(ok([]))
  if (path === '/payment-qr-profiles') return route.fulfill(ok([]))
  if (path === '/bills/bill-long') return route.fulfill(ok(longOwnerBill()))
  if (path === '/bills/bill-long/participants') return route.fulfill(ok(longOwnerBill().participants))
  return route.fulfill(ok([]))
}

function apiPath(url: string): string | null {
  const pathname = new URL(url).pathname
  return pathname.startsWith('/api/') ? pathname.replace(/^\/api/, '') : null
}

function ok(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data }),
  }
}

function authError() {
  return {
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({
      error: {
        code: 'ERR_AUTH_REFRESH_401',
        message: 'Session unavailable. Please sign in again.',
      },
    }),
  }
}

function authUser(id: string, email: string, fullName: string) {
  return {
    id,
    email,
    fullName,
    preferredCurrency: 'MYR',
    createdAt: '2026-08-01T00:00:00Z',
  }
}

function authResponse(user: ReturnType<typeof authUser>) {
  return {
    token: `memory-only-${user.id}`,
    user,
    expiresAt: '2099-08-01T00:00:00Z',
  }
}

function insight(id: string, title: string) {
  return {
    id,
    title,
    periodStart: '2026-08-01',
    periodEnd: '2026-08-07',
    generatedAt: '2026-08-08T00:00:00Z',
    content: {
      headline: title,
      summary: title,
      totalSpent: '12.0000',
      currency: 'MYR',
      comparisonPercentage: 0,
      spendingTrend: { direction: 'STABLE' },
      recommendation: 'Review spending signals.',
      recommendations: ['Review spending signals.'],
      positiveNote: 'Records are up to date.',
      riskLevel: 'LOW',
      topCategories: [],
      topMerchants: [],
      largestTransactions: [],
      findings: [],
      unusualIncreases: [],
    },
  }
}

function emptyTransactionPage() {
  return {
    transactions: [],
    nextCursor: null,
    nextCursorId: null,
    hasMore: false,
  }
}

function monthlySummary() {
  return {
    totalSpend: '0.0000',
    currency: 'MYR',
    transactionCount: 0,
    byCategory: [],
  }
}

function gmailDisconnected() {
  return {
    connected: false,
    provider: 'google',
    providerEmail: null,
    scopes: [],
    connectedAt: null,
  }
}

function longOwnerBill() {
  return {
    id: 'bill-long',
    merchantName: 'Dinner Table With Very Long Merchant Name That Must Wrap Instead Of Overflowing The Viewport',
    status: 'active',
    currency: 'MYR',
    subtotal: '1234567.8900',
    taxAmount: '0.0000',
    serviceCharge: '0.0000',
    totalAmount: '1234567.8900',
    lineAdjustment: '0.0000',
    totalAdjustment: '0.0000',
    unallocatedSubtotal: '0.0000',
    unallocatedTax: '0.0000',
    unallocatedServiceCharge: '0.0000',
    unallocatedTotal: '0.0000',
    allocationVersion: 9,
    expiresAt: '2099-08-01T00:00:00Z',
    shareToken: 'share-token-long',
    paymentQrProfile: undefined,
    items: [
      {
        id: 'item-long',
        name: 'Very long receipt item name '.repeat(20),
        quantity: '12.0000',
        unitPrice: '102880.6575',
        lineTotal: '1234567.8900',
        claimantCount: 1,
      },
    ],
    participants: [
      {
        id: 'participant-long',
        displayName: 'Very long participant display name '.repeat(12),
        selectedItems: [
          {
            itemId: 'item-long',
            itemName: 'Very long receipt item name '.repeat(20),
            allocatedAmount: '1234567.8900',
          },
        ],
        subtotalShare: '1234567.8900',
        taxShare: '0.0000',
        serviceChargeShare: '0.0000',
        lineAdjustmentShare: '0.0000',
        totalAdjustmentShare: '0.0000',
        totalOwed: '1234567.8900',
        isPaid: false,
        allocationVersion: 9,
      },
    ],
  }
}
