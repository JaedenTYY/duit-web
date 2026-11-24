import { expect, test } from '@playwright/test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const prototypeUrl = pathToFileURL(fileURLToPath(new URL('../../docs/ui/prototype/duit-prototype.html', import.meta.url))).href
const payload = '<img src=x onerror="window.prototypeInjected=true">'

test('documentation prototype validates hash routes and rejects render-state input', async ({ page }) => {
  page.on('pageerror', error => { throw error })
  for (const hash of ['constructor', '__proto__', 'toString', encodeURIComponent(payload)]) {
    await page.goto(`${prototypeUrl}#${hash}`)
    await expect(page.getByRole('heading', { name: 'November', exact: true })).toBeVisible()
  }
  await page.evaluate(value => {
    const input = document.createElement('input')
    input.dataset.model = 'xp'
    input.value = value
    document.body.append(input)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    location.hash = 'progress'
  }, payload)
  await expect(page.getByRole('heading', { name: 'You', exact: true })).toBeVisible()
  await expect(page.locator('.hero-amount')).toContainText('1,280')
  await expect(page.locator('img')).toHaveCount(0)
})

test('documentation prototype treats manual, edited, receipt and guest input as text', async ({ page }) => {
  page.on('pageerror', error => { throw error })
  await page.goto(prototypeUrl)
  await page.locator('.desktop-sidebar').getByRole('button', { name: 'Add spending', exact: true }).click()
  await page.getByRole('button', { name: /Add manually/ }).click()
  await page.locator('[data-manual="merchant"]').fill(payload)
  await page.locator('[data-manual="amount"]').fill('12.34')
  await page.getByRole('button', { name: 'Save expense' }).click()
  await expect(page.locator('.row-main strong').first()).toHaveText(payload)
  await page.getByRole('button', { name: /12.34 ringgit/ }).click()
  await page.locator('[data-field="note"]').click()
  await page.locator('#edit-input').fill(payload)
  await page.getByRole('button', { name: 'Save change' }).click()
  await expect(page.locator('.detail-line').filter({ hasText: 'Note' })).toContainText(payload)
  await page.goto(`${prototypeUrl}#review`)
  await page.locator('[data-receipt="merchant"]').fill(payload)
  await page.locator('[data-sheet="receipt-category"]').click()
  await page.getByRole('button', { name: 'Food', exact: true }).click()
  await expect(page.locator('[data-receipt="merchant"]')).toHaveValue(payload)
  await page.goto(`${prototypeUrl}#guest`)
  await page.getByRole('textbox', { name: 'Your name' }).fill(payload)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Choose your items' })).toBeVisible()
  await expect(page.locator('img')).toHaveCount(0)
  expect(await page.evaluate(() => Reflect.get(window, 'prototypeInjected'))).toBeUndefined()
})
