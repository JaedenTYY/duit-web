import { expect, test } from '@playwright/test'

for (const width of [360, 390, 1280]) {
  test(`reference navigation and Activity work at ${width}px`, async ({ page }) => {
    page.on('pageerror', error => { throw error })
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => localStorage.setItem('duit:onboardingCompleted', 'true'))
    let insightCalls = 0
    await page.route('**/api/**', async route => {
      const pathname = new URL(route.request().url()).pathname
      if (!pathname.startsWith('/api/')) return route.continue()
      const path = pathname.replace(/^\/api/, '')
      const tx = (id: string, merchantName: string, source: string) => ({
        id, merchantName, source, amount: '23.4000', amountMyr: '23.4000', currency: 'MYR',
        categoryName: 'Food & Drink', occurredAt: '2026-10-14T10:00:00Z', createdAt: '2026-10-14T10:00:00Z',
        fxRate: '1.000000', userId: 'test-user', version: 0,
      })
      let data: unknown = []
      if (path === '/auth/csrf') data = { headerName: 'X-XSRF-TOKEN', token: 'test-csrf' }
      if (path === '/auth/refresh') data = {
        token: 'test-token', expiresAt: '2099-01-01T00:00:00Z',
        user: { id: 'test-user', email: 'jae@example.test', fullName: 'Jae Ting', preferredCurrency: 'MYR', createdAt: '2026-01-01T00:00:00Z' },
      }
      if (path === '/transactions') data = { transactions: [tx('one', 'GrabFood', 'receipt'), tx('two', 'A very long merchant name that should still fit on a small phone', 'manual')], hasMore: false }
      if (path === '/transactions/summary/monthly') data = { totalSpend: '46.8000', transactionCount: 2, currency: 'MYR', byCategory: [{ categoryName: 'Food & Drink', total: '46.8000', percentage: '100', count: 2 }] }
      if (path.startsWith('/insights')) insightCalls++
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) })
    })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'November', exact: true })).toBeVisible()
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await noOverflow()
    await page.screenshot({ path: `/private/tmp/duit-home-${width}.png`, fullPage: true })
    const nav = page.getByRole('navigation', { name: 'Main navigation' }).filter({ visible: true })
    await nav.getByRole('link', { name: 'Activity', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Activity', exact: true })).toBeVisible()
    await noOverflow()
    await expect(page.locator('.transaction-record').last()).toHaveCSS('opacity', '1')
    await page.screenshot({ path: `/private/tmp/duit-ledger-${width}.png`, fullPage: true })
    await page.getByLabel('Search loaded transactions').fill('GrabFood')
    await expect(page.getByRole('button', { name: 'View GrabFood transaction' })).toBeVisible()
    await expect(page.getByText('A very long merchant name', { exact: false })).toHaveCount(0)
    await page.getByRole('combobox', { name: 'Source' }).selectOption('manual')
    await expect(page.getByRole('status')).toContainText('0 matching loaded transactions')
    await noOverflow()
    await page.getByRole('button', { name: 'Add spending', exact: true }).filter({ visible: true }).click()
    await page.getByRole('button', { name: /Scan a receipt/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close receipt scanner' }).click()
    await page.goto('/insights')
    await expect(page.getByRole('heading', { name: 'By category' })).toBeVisible()
    await expect(page.getByText('46.80', { exact: false }).first()).toBeVisible()
    expect(insightCalls).toBeGreaterThan(0)
    await noOverflow()
    await page.screenshot({ path: `/private/tmp/duit-insights-${width}.png`, fullPage: true })
  })
}
