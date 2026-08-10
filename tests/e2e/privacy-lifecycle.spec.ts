import { test, expect } from '@playwright/test'

test('privacy export, Gmail disconnect, account deletion, and guest access lifecycle', async ({ page }) => {
  let refreshActive = false
  let gmailConnected = true
  let exportAttempts = 0
  let deletionAttempts = 0
  let disconnectDeleteExtractions: boolean | null = null

  const ok = (data: unknown, headers: Record<string, string> = {}) => ({
    status: 200,
    contentType: 'application/json',
    headers,
    body: JSON.stringify({ data }),
  })
  const auth = {
    token: 'memory-only-access-token',
    user: {
      id: 'user-privacy-e2e',
      email: 'privacy@example.test',
      fullName: 'Privacy Test',
      preferredCurrency: 'MYR',
      createdAt: '2026-08-01T00:00:00Z',
    },
    expiresAt: '2099-08-01T00:00:00Z',
  }

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    if (!pathname.startsWith('/api/')) return route.continue()
    const path = pathname.replace(/^\/api/, '')

    if (path === '/auth/csrf') {
      return route.fulfill(ok(
        { headerName: 'X-XSRF-TOKEN', token: 'masked-privacy-csrf' },
        { 'Set-Cookie': 'XSRF-TOKEN=privacy-csrf; HttpOnly; Path=/; SameSite=Lax' }
      ))
    }
    if (path === '/auth/login') {
      refreshActive = true
      return route.fulfill(ok(
        auth,
        { 'Set-Cookie': 'duit-refresh=opaque-refresh; HttpOnly; Path=/; SameSite=Lax' }
      ))
    }
    if (path === '/auth/refresh') {
      if (refreshActive) return route.fulfill(ok(auth))
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'ERR_AUTH_REFRESH_401',
            message: 'Session unavailable. Please sign in again.',
            requestId: 'privacy-refresh-reference',
          },
        }),
      })
    }
    if (path === '/categories') return route.fulfill(ok([]))
    if (path === '/transactions') {
      return route.fulfill(ok({
        transactions: [],
        nextCursor: null,
        nextCursorId: null,
        hasMore: false,
      }))
    }
    if (path === '/transactions/summary/monthly') {
      return route.fulfill(ok({
        totalSpend: '0.0000',
        transactionCount: 0,
        byCategory: [],
      }))
    }
    if (path === '/anomalies' || path === '/insights' || path.startsWith('/payment-qr-profiles')) {
      return route.fulfill(ok([]))
    }
    if (path === '/gmail/status') {
      return route.fulfill(ok({
        connected: gmailConnected,
        provider: 'google',
        providerEmail: gmailConnected ? 'provider@example.test' : null,
        scopes: gmailConnected ? ['https://www.googleapis.com/auth/gmail.readonly'] : [],
        connectedAt: gmailConnected ? '2026-08-01T00:00:00Z' : null,
      }))
    }
    if (path === '/gmail/disconnect') {
      disconnectDeleteExtractions = JSON.parse(request.postData() ?? '{}').deleteExtractions
      gmailConnected = false
      return route.fulfill(ok({ disconnected: true }))
    }
    if (path === '/privacy/export') {
      exportAttempts += 1
      const payload = JSON.parse(request.postData() ?? '{}')
      expect(payload.currentPassword).toBe('export-password')
      expect(request.headers()['x-xsrf-token']).toBe('masked-privacy-csrf')
      return route.fulfill({
        status: 200,
        contentType: 'application/zip',
        headers: {
          'Content-Disposition': 'attachment; filename="duit-personal-data.zip"',
          'Cache-Control': 'no-store',
        },
        body: Buffer.from('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==', 'base64'),
      })
    }
    if (path === '/privacy/delete-account') {
      deletionAttempts += 1
      const payload = JSON.parse(request.postData() ?? '{}')
      expect(payload).toEqual({
        currentPassword: 'delete-password',
        confirmationPhrase: 'DELETE MY ACCOUNT',
      })
      expect(request.headers()['x-xsrf-token']).toBe('masked-privacy-csrf')
      refreshActive = false
      return route.fulfill(ok({ deleted: true }, {
        'Set-Cookie': 'duit-refresh=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
      }))
    }
    if (path === '/guest/bills/public-share-token') {
      return route.fulfill(ok({
        merchantName: 'Guest-safe bill',
        status: 'active',
        currency: 'MYR',
        subtotal: '12.0000',
        taxAmount: '0.0000',
        serviceCharge: '0.0000',
        totalAmount: '12.0000',
        expiresAt: '2099-08-01T00:00:00Z',
        paymentQrProfile: null,
        items: [{
          id: 'guest-item-1',
          name: 'Coffee',
          quantity: '1.0000',
          unitPrice: '12.0000',
          lineTotal: '12.0000',
          createdAt: '2026-08-01T00:00:00Z',
        }],
      }))
    }
    return route.fulfill(ok([]))
  })

  await page.goto('/login')
  await page.fill('input[type="email"]', 'privacy@example.test')
  await page.fill('input[type="password"]', 'login-password')
  await page.click('[data-testid="auth-submit"]')
  await page.waitForURL(/\/dashboard/)

  await page.goto('/settings/privacy')
  await expect(page.getByRole('heading', { name: 'Your data and account' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('privacy-export-password').fill('export-password')
  await page.getByTestId('privacy-export-submit').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('duit-personal-data.zip')
  expect(exportAttempts).toBe(1)

  const browserStorage = await page.evaluate(() => ({
    local: Object.values(localStorage),
    session: Object.values(sessionStorage),
  }))
  expect(JSON.stringify(browserStorage)).not.toContain('export-password')
  expect(JSON.stringify(browserStorage)).not.toContain('memory-only-access-token')
  expect(JSON.stringify(browserStorage)).not.toContain('duit-personal-data.zip')

  await page.getByLabel('Delete attributable Gmail extraction records').check()
  await page.getByLabel('I understand Gmail extraction records will be permanently deleted.').check()
  await page.getByTestId('gmail-disconnect-submit').click()
  await expect(page.getByText('Gmail was disconnected and attributable Gmail extraction records were deleted.')).toBeVisible()
  expect(disconnectDeleteExtractions).toBe(true)

  await page.getByTestId('delete-account-password').fill('delete-password')
  await page.getByTestId('delete-account-phrase').fill('delete my account')
  await page.getByTestId('delete-account-acknowledgement').check()
  await expect(page.getByTestId('delete-account-submit')).toBeDisabled()
  expect(deletionAttempts).toBe(0)

  await page.getByTestId('delete-account-phrase').fill('DELETE MY ACCOUNT')
  await page.getByTestId('delete-account-submit').click()
  await page.waitForURL('http://127.0.0.1:5173/')
  expect(deletionAttempts).toBe(1)

  await page.reload()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await page.goto('/guest/bills/public-share-token')
  await expect(page.getByText('Guest-safe bill')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Join this split' })).toBeVisible()
})
