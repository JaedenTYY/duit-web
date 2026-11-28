import { expect, test } from '@playwright/test'
import type { Transaction } from '../../src/types'

const occurredAt = '2026-07-18T16:15:00Z'
const base = {
  amount: '349.0150',
  amountMyr: '349.0150',
  currency: 'MYR',
  fxRate: '1.000000',
  occurredAt,
  createdAt: occurredAt,
  userId: 'detail-user',
  version: 1,
}

const records: Transaction[] = [
  {
    ...base,
    id: 'manual-transaction',
    source: 'manual',
    merchantId: 'merchant-1',
    merchantName: 'Grocery Shop',
    categoryId: 'groceries',
    categoryName: 'Groceries',
    description: 'Exact purchase',
  },
  {
    ...base,
    id: 'receipt-transaction',
    source: 'receipt',
    categoryId: 'groceries',
    categoryName: 'Groceries',
    description: 'Receipt without merchant',
  },
  {
    ...base,
    id: 'statement-transaction',
    source: 'statement',
    merchantName: 'Statement merchant',
    categoryId: null,
    categoryName: null,
    description: null,
    categoryIcon: null,
  },
  {
    ...base,
    id: 'gmail-transaction',
    source: 'gmail',
    merchantId: null,
    merchantName: null,
    categoryColor: null,
  },
]

for (const width of [390, 1280]) {
  test(
    'transaction details expose edit and delete at ' + width + 'px',
    async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() =>
        localStorage.setItem('duit:onboardingCompleted', 'true')
      )
      await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        if (path === '/api/auth/csrf') {
          return route.fulfill({
            json: {
              data: { headerName: 'X-XSRF-TOKEN', token: 'fixture-csrf' },
            },
          })
        }
        if (path === '/api/auth/refresh') {
          return route.fulfill({
            json: {
              data: {
                token: 'fixture-access',
                expiresAt: '2099-01-01T00:00:00Z',
                user: {
                  id: base.userId,
                  email: 'detail@example.test',
                  fullName: 'Fixture User',
                  preferredCurrency: 'MYR',
                  createdAt: occurredAt,
                },
              },
            },
          })
        }
        if (path === '/api/transactions') {
          return route.fulfill({
            json: {
              data: {
                transactions: records,
                nextCursor: null,
                nextCursorId: null,
                hasMore: false,
              },
            },
          })
        }
        if (path === '/api/categories') {
          return route.fulfill({
            json: { data: [{ id: 'groceries', name: 'Groceries' }] },
          })
        }
        if (path === '/api/merchants/categorise') {
          return route.fulfill({
            json: {
              data: {
                merchantName: new URL(route.request().url()).searchParams.get(
                  'name'
                ),
                source: 'NONE',
                isAutomaticCategory: false,
                personalised: false,
              },
            },
          })
        }
        return route.continue()
      })
      await page.goto('/transactions')
      const expectedDateTime = await page.evaluate(
        (date) =>
          new Intl.DateTimeFormat('en-MY', {
            dateStyle: 'long',
            timeStyle: 'short',
            timeZone: 'Asia/Kuala_Lumpur',
          }).format(new Date(date)),
        occurredAt
      )

      for (const transaction of records) {
        const heading =
          transaction.merchantName || transaction.description || 'Transaction'
        await page
          .getByRole('button', { name: 'View ' + heading + ' transaction' })
          .click()
        const detail = page.getByRole('dialog', {
          name: 'Transaction',
          exact: true,
        })
        await expect(detail).toContainText(expectedDateTime)
        await expect(detail).toContainText(
          transaction.categoryName ?? 'Uncategorised'
        )
        await expect(detail).toContainText(transaction.source)
        await expect(detail).toContainText('349.02')
        await expect(
          detail.getByRole('button', { name: 'Delete transaction' })
        ).toBeEnabled()
        await detail.getByRole('button', { name: 'Edit transaction' }).click()

        const editor = page.getByRole('dialog', { name: 'Edit transaction' })
        await expect(editor.getByLabel('Amount')).toHaveValue(
          transaction.amount
        )
        await expect(editor.getByLabel('Category')).toHaveValue(
          transaction.categoryId ?? ''
        )
        await expect(editor.getByLabel('Note')).toHaveValue(
          transaction.description ?? ''
        )
        await editor
          .getByRole('button', { name: 'Close transaction dialog' })
          .click()
      }
    }
  )
}
