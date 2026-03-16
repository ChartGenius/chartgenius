import { test, expect, type Page } from '@playwright/test'

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

test.describe('Core Pages Load', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('Dashboard loads with watchlist, news, and calendar widgets', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)

    // Page should not have a crash
    const body = page.locator('body')
    await expect(body).toBeVisible({ timeout: 10_000 })

    // Watchlist should be visible (★ WATCHLIST header)
    await expect(page.getByText(/WATCHLIST/i).first()).toBeVisible({ timeout: 10_000 })

    // News section should be present
    await expect(page.getByText(/News|news/i).first()).toBeVisible({ timeout: 10_000 })

    // Calendar/events section should be present
    await expect(page.getByText(/Calendar|Economic|calendar/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('Portfolio page loads', async ({ page }) => {
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // No unhandled crash
    const errorMsg = page.getByText(/Application Error|This page crashed/i)
    await expect(errorMsg).not.toBeVisible()

    // Portfolio-related content should appear
    const content = page.getByText(/Portfolio|Holdings|positions|Add Position/i).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('Calendar page loads', async ({ page }) => {
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Calendar heading or content should be visible
    const content = page.getByText(/Calendar|Economic|Earnings|Events/i).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('News page loads', async ({ page }) => {
    await page.goto('/news', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // News-related content visible
    const content = page.getByText(/News|Markets|Headlines|Latest/i).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('Tools page loads', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Tools content visible
    const content = page.getByText(/Tools|Screener|Calculator|Fear|Greed/i).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })

  test('Help page loads', async ({ page }) => {
    await page.goto('/help', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const body = page.locator('body')
    await expect(body).toBeVisible()

    // Help content visible
    const content = page.getByText(/Help|FAQ|Support|How|Getting Started/i).first()
    await expect(content).toBeVisible({ timeout: 10_000 })
  })
})
