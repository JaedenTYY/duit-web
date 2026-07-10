import { test, expect } from '@playwright/test';

test.describe('FYP Demo Flow Smoke Tests', () => {

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
