import { test, expect, type Page } from '@playwright/test'

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

test.describe('AI Coach Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('page loads with empty state when no trades exist', async ({ page }) => {
    await page.goto('/coach', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // The page should load (no crash) — heading or main content visible
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('shows empty state or onboarding message with no trades', async ({ page }) => {
    await page.goto('/coach', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // With no trades, the coach should show an empty state or prompt to log trades
    // Common patterns: "No trades", "Start by logging", "Coach", etc.
    const content = page.locator('main, [role="main"], .page-content, body').first()
    await expect(content).toBeVisible({ timeout: 10_000 })

    // Page should not show an error — just an empty/onboarding state
    const errorMsg = page.getByText(/Error:|Uncaught|TypeError/i)
    await expect(errorMsg).not.toBeVisible()
  })

  test('disclaimer is present on the coach page', async ({ page }) => {
    await page.goto('/coach', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const disclaimer = page.getByText(/Disclaimer|disclaimer|not financial advice|AI analysis/i).first()
    await expect(disclaimer).toBeVisible({ timeout: 10_000 })
  })
})
