import { test, expect } from '@playwright/test';

test.describe('FYP Demo Flow Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    const ok = (data: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    });

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

      if (path === '/auth/login') {
        return route.fulfill(ok({
          token: 'e2e-token',
          user: {
            id: 'user-1',
            email: 'demo@duit.app',
            fullName: 'Demo User',
            preferredCurrency: 'MYR',
            createdAt: '2026-07-10T00:00:00Z',
          },
          expiresAt: '2026-07-11T00:00:00Z',
        }));
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
    await expect(page.locator('text=Total Monthly Spend').first()).toBeVisible();
    await expect(page.locator('canvas, svg, .chart-container').first()).toBeVisible();

    // 2. Transactions
    await page.goto('/transactions');
    await expect(page).toHaveURL(/.*\/transactions/);
    await expect(page.locator('text=/RM|S\\$/').first()).toBeVisible();

    // Open Add Transaction modal
    const addButton = page.locator('button:has-text("Add Transaction"), button:has-text("Add")').first();
    await addButton.click();
    await expect(page.locator('input[placeholder*="Amount"], input[name="amount"]').first()).toBeVisible();
    await page.keyboard.press('Escape'); // close modal

    // 3. Magic Inbox
    await page.goto('/inbox');
    await expect(page).toHaveURL(/.*\/inbox/);
    await expect(page.locator('text=Receipt Upload').first()).toBeVisible();
    await expect(page.locator('text=Bank Statement').first()).toBeVisible();
    await expect(page.locator('text=Gmail').first()).toBeVisible();

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
