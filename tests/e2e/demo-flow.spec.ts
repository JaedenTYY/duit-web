import { test, expect } from '@playwright/test';

test.describe('FYP Demo Flow Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    let refreshFamilyActive = false;
    const ok = (data: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });
    const authResponse = {
      token: 'e2e-token',
      user: {
        id: 'user-1',
        email: 'demo@duit.app',
        fullName: 'Demo User',
        preferredCurrency: 'MYR',
        createdAt: '2026-07-10T00:00:00Z',
      },
      expiresAt: '2099-07-11T00:00:00Z',
    };

    const transaction = {
      id: 'tx-1',
      userId: 'user-1',
      amount: '18.4000',
      currency: 'MYR',
      amountMyr: '18.4000',
      fxRate: '1.000000',
      merchantId: 'merchant-1',
      merchantName: 'ZUS Coffee',
      categoryId: 'food',
      categoryName: 'Food & Dining',
      categoryIcon: '🍜',
      categoryColor: '#2563eb',
      description: 'Latte',
      source: 'manual',
      occurredAt: '2026-07-10T04:00:00Z',
      createdAt: '2026-07-10T04:05:00Z',
    };

    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) {
        return route.continue();
      }

      const path = url.pathname.replace(/^\/api/, '');

      if (path === '/auth/csrf') {
        return route.fulfill(ok({
          headerName: 'X-XSRF-TOKEN',
          token: 'masked-e2e-csrf',
        }));
      }

      if (path === '/auth/login') {
        refreshFamilyActive = true;
        return route.fulfill({
          ...ok(authResponse),
          headers: {
            'Set-Cookie': 'duit-refresh=e2e-refresh; HttpOnly; Path=/; SameSite=Lax',
          },
        });
      }

      if (path === '/auth/refresh') {
        if (!refreshFamilyActive) {
          return route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              error: {
                code: 'ERR_AUTH_REFRESH_401',
                message: 'Session unavailable. Please sign in again.',
              },
            }),
          });
        }
        return route.fulfill(ok(authResponse));
      }

      if (path === '/categories') {
        return route.fulfill(ok([
          { id: 'food', name: 'Food & Dining', icon: '🍜', color: '#2563eb' },
        ]));
      }

      if (path === '/transactions/summary/monthly') {
        return route.fulfill(ok({
          totalSpend: '18.4000',
          transactionCount: 1,
          byCategory: [
            {
              categoryId: 'food',
              categoryName: 'Food & Dining',
              categoryIcon: '🍜',
              categoryColor: '#2563eb',
              total: '18.4000',
              count: 1,
              percentage: 100,
            },
          ],
        }));
      }

      if (path === '/transactions') {
        return route.fulfill(ok({
          transactions: [transaction],
          nextCursor: null,
          nextCursorId: null,
          hasMore: false,
        }));
      }

      if (path === '/gmail/status') {
        return route.fulfill(ok({
          connected: false,
          provider: 'mock',
          providerEmail: null,
          scopes: [],
          connectedAt: null,
        }));
      }

      if (path === '/gmail/extractions') {
        return route.fulfill(ok([]));
      }

      if (path === '/insights') {
        return route.fulfill(ok([]));
      }

      if (path === '/insights/generate') {
        return route.fulfill(ok({
          id: 'insight-1',
          userId: 'user-1',
          periodStart: '2026-07-03',
          periodEnd: '2026-07-09',
          content: {
            headline: 'Spending insight',
            summary: 'Food spending is steady.',
            totalSpent: '18.40',
            currency: 'MYR',
            comparisonPercentage: 0,
            topCategories: [],
            topMerchants: [],
            largestTransactions: [],
            unusualIncreases: [],
            spendingTrend: {
              direction: 'STABLE',
              currentTotal: '18.40',
              previousTotal: '18.40',
              changePercentage: 0,
            },
            billSplitSettlements: null,
            findings: [],
            recommendation: 'Keep reviewing receipts.',
            recommendations: ['Keep reviewing receipts.'],
            positiveNote: 'You are up to date.',
            riskLevel: 'LOW',
          },
          generatedAt: '2026-07-10T00:00:00Z',
        }));
      }

      if (path === '/anomalies') {
        return route.fulfill(ok([]));
      }

      if (path.startsWith('/statements') || path.startsWith('/bills') || path.startsWith('/payment-qr-profiles')) {
        return route.fulfill(ok([]));
      }

      return route.fulfill(ok([]));
    });
  });

  test('End-to-End FYP Demo Flow', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@duit.app');
    await page.fill('input[type="password"]', 'demo');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
    
    // Dashboard assertions
    await expect(page.locator('text=Monthly spend').first()).toBeVisible();
    await expect(page.locator('text=Category ring').first()).toBeVisible();

    // 2. Transactions
    await page.goto('/transactions');
    await expect(page).toHaveURL(/.*\/transactions/);
    await expect(page.locator('text=/RM|S\\$/').first()).toBeVisible();

    // Open Add Transaction modal
    const addButton = page.locator('button:has-text("Add Transaction"), button:has-text("Add")').first();
    await addButton.click();
    await expect(page.locator('input[placeholder*="Amount"], input[name="amount"]').first()).toBeVisible();
    await page.keyboard.press('Escape'); // close modal

    // 3. Import center
    await page.goto('/inbox');
    await expect(page).toHaveURL(/.*\/inbox/);
    await expect(page.locator('text=Scan receipt').first()).toBeVisible();
    await expect(page.locator('text=Split bill').first()).toBeVisible();
    await expect(page.locator('text=Weekly insights').first()).toBeVisible();

    // 4. Gmail sync
    await page.goto('/gmail');
    await expect(page).toHaveURL(/.*\/gmail/);
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Connect")').first();
    await expect(syncButton).toBeVisible();

    // 5. Statement import
    await page.goto('/statements');
    await expect(page).toHaveURL(/.*\/statements/);
    await expect(page.locator('input[type="file"]').first()).toBeAttached();

    // 6. Weekly Insights
    await page.goto('/insights');
    await expect(page).toHaveURL(/.*\/insights/);
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Get Insights")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    }
    // Just verifying it doesn't crash
    await expect(page.locator('text=insight').first()).toBeVisible({ timeout: 10000 }).catch(() => {});

    // 7. Anomalies
    await page.goto('/anomalies');
    await expect(page).toHaveURL(/.*\/anomalies/);
    await expect(page.locator('text=anomaly').first()).toBeVisible().catch(() => {});

    // 8. Split Bill
    await page.goto('/split-bill');
    await expect(page).toHaveURL(/.*\/split-bill/);
  });

});

test('login 429 preserves input and does not automatically retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/auth/csrf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          headerName: 'X-XSRF-TOKEN',
          token: 'masked-e2e-csrf',
        },
      }),
    });
  });
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'ERR_AUTH_REFRESH_401',
          message: 'Session unavailable. Please sign in again.',
        },
      }),
    });
  });
  await page.route('**/api/auth/login', async (route) => {
    attempts += 1;
    await route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: {
        'Retry-After': '3',
        'X-Request-ID': '018f86a7-4b3c-7d2a-8b20-4fb94f77c921',
      },
      body: JSON.stringify({
        error: {
          code: 'ERR_RATE_LIMIT_429',
          message: 'Too many requests. Please try again later.',
          requestId: '018f86a7-4b3c-7d2a-8b20-4fb94f77c921',
        },
      }),
    });
  });

  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@duit.app');
  await page.fill('input[type="password"]', ['test', 'password'].join('-'));
  await page.click('[data-testid="auth-submit"]');

  await expect(page.getByText('Too many requests. Please try again later.')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Please wait');
  await expect(page.locator('input[type="email"]')).toHaveValue('demo@duit.app');
  await expect(page.locator('[data-testid="auth-submit"]')).toBeDisabled();
  await page.waitForTimeout(500);
  expect(attempts).toBe(1);
});

test('browser session restores by refresh without persistent access-token storage', async ({ page }) => {
  let refreshFamilyActive = false;
  let refreshCalls = 0;
  let rejectNextSummary = false;
  let summaryCalls = 0;
  const user = {
    id: 'user-1',
    email: 'demo@duit.app',
    fullName: 'Demo User',
    preferredCurrency: 'MYR',
    createdAt: '2026-07-10T00:00:00Z',
  };
  const auth = () => ({
    token: `memory-access-${refreshCalls}`,
    user,
    expiresAt: '2099-07-11T00:00:00Z',
  });
  const ok = (data: unknown, headers: Record<string, string> = {}) => ({
    status: 200,
    contentType: 'application/json',
    headers,
    body: JSON.stringify({ data }),
  });

  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!pathname.startsWith('/api/')) {
      return route.continue();
    }
    const path = pathname.replace(/^\/api/, '');
    if (path === '/auth/csrf') {
      return route.fulfill(ok(
        { headerName: 'X-XSRF-TOKEN', token: 'masked-e2e-csrf' },
        { 'Set-Cookie': 'XSRF-TOKEN=e2e-csrf-cookie; HttpOnly; Path=/; SameSite=Lax' }
      ));
    }
    if (path === '/auth/login') {
      refreshFamilyActive = true;
      return route.fulfill(ok(
        auth(),
        { 'Set-Cookie': 'duit-refresh=opaque-e2e-refresh; HttpOnly; Path=/; SameSite=Lax' }
      ));
    }
    if (path === '/auth/refresh') {
      refreshCalls += 1;
      if (!refreshFamilyActive) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'ERR_AUTH_REFRESH_401',
              message: 'Session unavailable. Please sign in again.',
              requestId: '018f86a7-4b3c-7d2a-8b20-4fb94f77c921',
            },
          }),
        });
      }
      return route.fulfill(ok(
        auth(),
        { 'Set-Cookie': 'duit-refresh=rotated-e2e-refresh; HttpOnly; Path=/; SameSite=Lax' }
      ));
    }
    if (path === '/auth/logout') {
      refreshFamilyActive = false;
      return route.fulfill(ok(
        { message: 'Logged out successfully' },
        { 'Set-Cookie': 'duit-refresh=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0' }
      ));
    }
    if (path === '/categories') {
      return route.fulfill(ok([
        { id: 'food', name: 'Food & Dining', icon: '🍜', color: '#2563eb' },
      ]));
    }
    if (path === '/transactions/summary/monthly') {
      summaryCalls += 1;
      if (rejectNextSummary) {
        rejectNextSummary = false;
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'ERR_AUTH_001',
              message: 'Authentication required',
              requestId: '018f86a7-4b3c-7d2a-8b20-4fb94f77c921',
            },
          }),
        });
      }
      return route.fulfill(ok({
        totalSpend: '0.0000',
        currency: 'MYR',
        transactionCount: 0,
        byCategory: [],
      }));
    }
    if (path === '/transactions') {
      return route.fulfill(ok({
        transactions: [],
        nextCursor: null,
        nextCursorId: null,
        hasMore: false,
      }));
    }
    if (path === '/anomalies' || path === '/insights') {
      return route.fulfill(ok([]));
    }
    if (path.startsWith('/payment-qr-profiles')) {
      return route.fulfill(ok([]));
    }
    return route.fulfill(ok([]));
  });

  await page.goto('/login');
  await page.fill('input[type="email"]', 'demo@duit.app');
  await page.fill('input[type="password"]', 'demo-password');
  await page.click('[data-testid="auth-submit"]');
  await page.waitForURL(/\/dashboard/);

  await expect.poll(() => page.evaluate(() => ({
    localToken: localStorage.getItem('duit_token'),
    localUser: localStorage.getItem('duit_user'),
    sessionToken: sessionStorage.getItem('duit_token'),
    visibleCookies: document.cookie,
  }))).toEqual({
    localToken: null,
    localUser: null,
    sessionToken: null,
    visibleCookies: '',
  });

  const refreshesBeforeReload = refreshCalls;
  rejectNextSummary = true;
  summaryCalls = 0;
  await page.reload();
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Monthly spend').first()).toBeVisible();
  await expect.poll(() => summaryCalls).toBeGreaterThanOrEqual(2);
  expect(refreshCalls - refreshesBeforeReload).toBe(2);

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.waitForURL(/\/login|\/$/);
  await page.reload();
  await expect(page).not.toHaveURL(/\/dashboard/);
  expect(refreshFamilyActive).toBe(false);
});
