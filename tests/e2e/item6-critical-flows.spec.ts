import { expect, test, type Page } from '@playwright/test'

const user = {
  id: 'user-item6',
  email: 'item6@example.test',
  fullName: 'Item Six',
  preferredCurrency: 'MYR',
  createdAt: '2026-08-01T00:00:00Z',
}

test('receipt review confirmation adds the generated transaction to the feed', async ({ page }) => {
  let refreshActive = false
  let receiptConfirmed = false
  let confirmPayload: Record<string, unknown> | null = null
  const receiptTransaction = transaction({
    id: 'tx-receipt',
    amount: '23.4500',
    merchantName: 'Receipt Cafe',
    source: 'receipt',
  })

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = apiPath(request.url())
    if (!path) return route.continue()

    if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item6' }))
    if (path === '/auth/login') {
      refreshActive = true
      return route.fulfill(ok(authResponse()))
    }
    if (path === '/auth/refresh') {
      return route.fulfill(refreshActive ? ok(authResponse()) : authError())
    }
    if (path === '/categories') return route.fulfill(ok(categories()))
    if (path === '/transactions') {
      return route.fulfill(ok({
        transactions: receiptConfirmed ? [receiptTransaction] : [],
        nextCursor: null,
        nextCursorId: null,
        hasMore: false,
      }))
    }
    if (path === '/receipt/upload') {
      return route.fulfill(ok(receiptExtraction()))
    }
    if (path === '/receipt/confirm') {
      confirmPayload = JSON.parse(request.postData() ?? '{}')
      receiptConfirmed = true
      return route.fulfill(ok(receiptTransaction))
    }
    if (path === '/merchants/categorise') {
      return route.fulfill(ok({
        merchantName: 'Receipt Cafe',
        categoryId: 'food',
        confidence: 'HIGH',
        source: 'GLOBAL',
        personalised: false,
      }))
    }
    if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
    if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
    if (path === '/gmail/extractions' || path === '/insights' || path === '/anomalies') return route.fulfill(ok([]))
    if (path.startsWith('/payment-qr-profiles') || path.startsWith('/statements') || path.startsWith('/bills')) {
      return route.fulfill(ok([]))
    }
    return route.fulfill(ok([]))
  })

  await login(page)
  await page.goto('/transactions')
  await expect(page.getByText('No transactions yet')).toBeVisible()

  await page.getByRole('button', { name: 'Upload receipt' }).click()
  await page.locator('input[type="file"]').setInputFiles({
    name: 'receipt.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('receipt image bytes'),
  })
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Add to expenses' }).click()

  await expect(page.getByText('Check the receipt details')).toBeVisible()
  await expect(page.getByPlaceholder('e.g. Kopitiam')).toHaveValue('Receipt Cafe')
  await page.locator('form select').nth(1).selectOption('food')
  await page.getByRole('button', { name: 'Confirm & Save' }).click()

  await expect(page.getByText('Receipt saved')).toBeVisible()
  await expect(page.getByText('Receipt saved')).toBeHidden({ timeout: 3000 })
  await expect(page.getByText('Receipt Cafe').first()).toBeVisible()
  expect(confirmPayload).toMatchObject({
    extractionId: 'receipt-extraction-1',
    amount: '23.4500',
    currency: 'MYR',
    categoryId: 'food',
    rememberMerchantCategory: false,
  })
})

test('bill owner and guest split lifecycle uses guest idempotency and external settlement state', async ({ page }) => {
  let refreshActive = false
  let joined = false
  let selected = false
  let paid = false
  let joinIdempotencyKey: string | undefined
  let selectPayload: Record<string, unknown> | null = null
  let paidPayload: Record<string, unknown> | null = null

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = apiPath(request.url())
    if (!path) return route.continue()

    if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item6' }))
    if (path === '/auth/login') {
      refreshActive = true
      return route.fulfill(ok(authResponse()))
    }
    if (path === '/auth/refresh') return route.fulfill(refreshActive ? ok(authResponse()) : authError())
    if (path === '/categories') return route.fulfill(ok(categories()))
    if (path === '/transactions') return route.fulfill(ok(emptyTransactionPage()))
    if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
    if (path === '/bills/from-receipt') return route.fulfill(ok(ownerBill()))
    if (path === '/bills/bill-1') return route.fulfill(ok(ownerBill({ joined, selected, paid })))
    if (path === '/bills/bill-1/participants') return route.fulfill(ok(joined ? [participant({ selected, paid })] : []))
    if (path === '/bills/bill-1/mark-paid') {
      paidPayload = JSON.parse(request.postData() ?? '{}')
      paid = true
      return route.fulfill(ok(participant({ selected: true, paid: true })))
    }
    if (path === '/payment-qr-profiles') return route.fulfill(ok([]))
    if (path === '/guest/bills/share-token-1') return route.fulfill(ok(guestBill({ selected })))
    if (path === '/guest/bills/share-token-1/join') {
      joinIdempotencyKey = request.headers()['idempotency-key']
      joined = true
      return route.fulfill(ok({
        participantToken: 'participant-token-1',
        summary: guestSummary({ selected: false }),
      }))
    }
    if (path === '/guest/bills/share-token-1/items') {
      selectPayload = JSON.parse(request.postData() ?? '{}')
      selected = true
      return route.fulfill(ok(guestSummary({ selected: true })))
    }
    if (path === '/guest/bills/share-token-1/summary') return route.fulfill(ok(guestSummary({ selected })))
    if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
    if (path === '/gmail/extractions' || path === '/insights' || path === '/anomalies') return route.fulfill(ok([]))
    return route.fulfill(ok([]))
  })

  await login(page)
  await page.goto('/split-bill')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'dinner.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('bill receipt image bytes'),
  })
  await page.getByRole('button', { name: 'Create split' }).click()

  await expect(page).toHaveURL(/\/split-bill\/bill-1/)
  await expect(page.getByText('Dinner Table')).toBeVisible()
  await expect(page.getByText('No guests yet')).toBeVisible()

  await page.goto('/guest/bills/share-token-1')
  await expect(page.getByRole('heading', { name: 'Join this split' })).toBeVisible()
  await page.getByPlaceholder('Your name').fill('Alex')
  await page.getByRole('button', { name: 'Join bill' }).click()
  await expect(page.getByText('Select your items')).toBeVisible()
  expect(joinIdempotencyKey).toMatch(/^[0-9a-f-]{36}$/)

  await page.getByRole('button', { name: /Nasi lemak/ }).click()
  await page.getByRole('button', { name: 'Save items' }).click()
  await expect(page.getByText('Total owed')).toBeVisible()
  expect(selectPayload).toMatchObject({
    participantToken: 'participant-token-1',
    itemIds: ['item-1'],
    expectedAllocationVersion: 0,
  })

  await page.goto('/split-bill/bill-1')
  await expect(page.getByText('Alex')).toBeVisible()
  await page.getByRole('button', { name: 'Mark paid' }).click()
  await expect(page.getByText(/Settled externally at\s+RM\s+12\.00/)).toBeVisible()
  expect(paidPayload).toMatchObject({
    participantId: 'participant-1',
    isPaid: true,
    expectedAllocationVersion: 1,
  })
})

test('statement import selection imports only supported debit rows', async ({ page }) => {
  let refreshActive = false
  let confirmPayload: Record<string, unknown> | null = null

  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = apiPath(request.url())
    if (!path) return route.continue()

    if (path === '/auth/csrf') return route.fulfill(ok({ headerName: 'X-XSRF-TOKEN', token: 'csrf-item6' }))
    if (path === '/auth/login') {
      refreshActive = true
      return route.fulfill(ok(authResponse()))
    }
    if (path === '/auth/refresh') return route.fulfill(refreshActive ? ok(authResponse()) : authError())
    if (path === '/categories') return route.fulfill(ok(categories()))
    if (path === '/transactions') return route.fulfill(ok(emptyTransactionPage()))
    if (path === '/transactions/summary/monthly') return route.fulfill(ok(monthlySummary()))
    if (path === '/statements/upload') return route.fulfill(ok(statementUpload('pending')))
    if (path === '/statements/upload-1/confirm') {
      confirmPayload = JSON.parse(request.postData() ?? '{}')
      return route.fulfill(ok({
        uploadId: 'upload-1',
        importedCount: 1,
        skippedCount: 1,
        transactionIds: ['tx-statement-1'],
      }))
    }
    if (path === '/statements/upload-1') return route.fulfill(ok(statementUpload('confirmed')))
    if (path === '/gmail/status') return route.fulfill(ok(gmailDisconnected()))
    if (path === '/gmail/extractions' || path === '/insights' || path === '/anomalies') return route.fulfill(ok([]))
    if (path.startsWith('/payment-qr-profiles') || path.startsWith('/bills')) return route.fulfill(ok([]))
    return route.fulfill(ok([]))
  })

  await login(page)
  await page.goto('/statements')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'bank-statement.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nstatement bytes'),
  })

  await expect(page.getByRole('table').getByText('Bank Coffee')).toBeVisible()
  await expect(page.getByRole('table').getByText('Salary credit')).toBeVisible()
  await expect(page.getByRole('table').getByText(/Credit.*visible for review, not importable/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import 1 rows' })).toBeEnabled()
  await page.getByRole('button', { name: 'Import 1 rows' }).click()

  await expect(page.getByText('Import complete')).toBeVisible()
  await expect(page.getByText('1 transactions imported and 1 rows skipped.')).toBeVisible()
  expect(confirmPayload).toEqual({
    rows: [{ rowId: 'row-debit', categoryId: 'food', rememberMerchantCategory: false }],
  })
})

async function login(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('duit:onboardingCompleted', 'true')
  })
  await page.goto('/login')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', 'item6-password')
  await page.click('[data-testid="auth-submit"]')
  await page.waitForURL(/\/dashboard/)
}

function apiPath(url: string): string | null {
  const pathname = new URL(url).pathname
  return pathname.startsWith('/api/') ? pathname.replace(/^\/api/, '') : null
}

function ok(data: unknown, headers: Record<string, string> = {}) {
  return {
    status: 200,
    contentType: 'application/json',
    headers,
    body: JSON.stringify({ data }),
  }
}

function authResponse() {
  return {
    token: 'memory-only-item6-token',
    user,
    expiresAt: '2099-08-01T00:00:00Z',
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
        requestId: '11111111-1111-4111-8111-111111111111',
      },
    }),
  }
}

function categories() {
  return [
    { id: 'food', name: 'Food & Dining', icon: 'Food', color: '#2563eb' },
    { id: 'transport', name: 'Transport', icon: 'Car', color: '#059669' },
  ]
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

function receiptExtraction() {
  return {
    extractionId: 'receipt-extraction-1',
    rawOcrText: 'Receipt Cafe\nTotal 23.45',
    confidence: 'high',
    duplicateImageWarning: false,
    extractedData: {
      merchantName: 'Receipt Cafe',
      currency: 'MYR',
      date: '2026-08-11',
      lineItems: [{
        name: 'Lunch set',
        qty: '1.0000',
        unitPrice: '23.4500',
        lineTotal: '23.4500',
      }],
      total: '23.4500',
      paymentMethod: 'card',
      confidence: 'high',
      fieldsNeedingReview: [],
    },
  }
}

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    userId: user.id,
    amount: '23.4500',
    currency: 'MYR',
    amountMyr: '23.4500',
    fxRate: '1.000000',
    merchantId: 'merchant-1',
    merchantName: 'Receipt Cafe',
    categoryId: 'food',
    categoryName: 'Food & Dining',
    categoryIcon: 'Food',
    categoryColor: '#2563eb',
    description: 'Receipt Cafe',
    source: 'manual',
    occurredAt: '2026-08-11T04:00:00Z',
    createdAt: '2026-08-11T04:05:00Z',
    version: 0,
    ...overrides,
  }
}

function billItem() {
  return {
    id: 'item-1',
    name: 'Nasi lemak',
    quantity: '1.0000',
    unitPrice: '12.0000',
    lineTotal: '12.0000',
    claimantCount: 0,
  }
}

function ownerBill(state: { joined?: boolean; selected?: boolean; paid?: boolean } = {}) {
  const participants = state.joined ? [participant(state)] : []
  return {
    id: 'bill-1',
    merchantName: 'Dinner Table',
    status: 'active',
    currency: 'MYR',
    subtotal: '12.0000',
    taxAmount: '0.0000',
    serviceCharge: '0.0000',
    totalAmount: '12.0000',
    lineAdjustment: '0.0000',
    totalAdjustment: '0.0000',
    unallocatedSubtotal: state.selected ? '0.0000' : '12.0000',
    unallocatedTax: '0.0000',
    unallocatedServiceCharge: '0.0000',
    unallocatedTotal: state.selected ? '0.0000' : '12.0000',
    allocationVersion: state.selected || state.paid ? 1 : 0,
    expiresAt: '2099-08-01T00:00:00Z',
    shareToken: 'share-token-1',
    paymentQrProfile: undefined,
    items: [{ ...billItem(), claimantCount: state.selected ? 1 : 0 }],
    participants,
  }
}

function guestBill(state: { selected?: boolean } = {}) {
  return {
    merchantName: 'Dinner Table',
    status: 'active',
    currency: 'MYR',
    subtotal: '12.0000',
    taxAmount: '0.0000',
    serviceCharge: '0.0000',
    totalAmount: '12.0000',
    lineAdjustment: '0.0000',
    totalAdjustment: '0.0000',
    unallocatedSubtotal: state.selected ? '0.0000' : '12.0000',
    unallocatedTax: '0.0000',
    unallocatedServiceCharge: '0.0000',
    unallocatedTotal: state.selected ? '0.0000' : '12.0000',
    allocationVersion: state.selected ? 1 : 0,
    expiresAt: '2099-08-01T00:00:00Z',
    paymentQrProfile: undefined,
    items: [{ ...billItem(), claimantCount: state.selected ? 1 : 0 }],
  }
}

function participant(state: { selected?: boolean; paid?: boolean } = {}) {
  return {
    id: 'participant-1',
    displayName: 'Alex',
    selectedItems: state.selected
      ? [{
        itemId: 'item-1',
        itemName: 'Nasi lemak',
        allocatedAmount: '12.0000',
      }]
      : [],
    subtotalShare: state.selected ? '12.0000' : '0.0000',
    taxShare: '0.0000',
    serviceChargeShare: '0.0000',
    lineAdjustmentShare: '0.0000',
    totalAdjustmentShare: '0.0000',
    totalOwed: state.selected ? '12.0000' : '0.0000',
    isPaid: !!state.paid,
    paidAmount: state.paid ? '12.0000' : undefined,
    paidAt: state.paid ? '2026-08-11T05:00:00Z' : undefined,
    paidAllocationVersion: state.paid ? 1 : undefined,
    allocationVersion: state.selected || state.paid ? 1 : 0,
    joinedAt: '2026-08-11T04:00:00Z',
    updatedAt: '2026-08-11T04:05:00Z',
  }
}

function guestSummary(state: { selected?: boolean } = {}) {
  return {
    displayName: 'Alex',
    selectedItems: state.selected
      ? [{
        itemId: 'item-1',
        itemName: 'Nasi lemak',
        allocatedAmount: '12.0000',
      }]
      : [],
    subtotalShare: state.selected ? '12.0000' : '0.0000',
    taxShare: '0.0000',
    serviceChargeShare: '0.0000',
    lineAdjustmentShare: '0.0000',
    totalAdjustmentShare: '0.0000',
    totalOwed: state.selected ? '12.0000' : '0.0000',
    unallocatedSubtotal: state.selected ? '0.0000' : '12.0000',
    unallocatedTax: '0.0000',
    unallocatedServiceCharge: '0.0000',
    unallocatedTotal: state.selected ? '0.0000' : '12.0000',
    isPaid: false,
    allocationVersion: state.selected ? 1 : 0,
    currency: 'MYR',
    paymentQrProfile: undefined,
  }
}

function statementUpload(status: 'pending' | 'confirmed') {
  return {
    id: 'upload-1',
    fileName: 'bank-statement.pdf',
    status,
    createdAt: '2026-08-11T00:00:00Z',
    confirmedAt: status === 'confirmed' ? '2026-08-11T00:02:00Z' : undefined,
    rows: [
      {
        id: 'row-debit',
        sourceRowIndex: 0,
        occurredAt: '2026-08-10T00:00:00Z',
        description: 'Coffee purchase',
        merchantName: 'Bank Coffee',
        amount: '18.4000',
        currency: 'MYR',
        direction: 'debit',
        status: status === 'confirmed' ? 'imported' : 'pending',
        suggestedCategoryId: 'food',
        categorisationConfidence: 'HIGH',
      },
      {
        id: 'row-credit',
        sourceRowIndex: 1,
        occurredAt: '2026-08-10T01:00:00Z',
        description: 'Salary credit',
        merchantName: 'Employer',
        amount: '1000.0000',
        currency: 'MYR',
        direction: 'credit',
        status: status === 'confirmed' ? 'skipped' : 'pending',
      },
    ],
  }
}
