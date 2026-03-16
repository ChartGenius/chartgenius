import { test, expect, type Page } from '@playwright/test'

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

async function goToRitual(page: Page) {
  await page.goto('/ritual', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
}

test.describe('Daily Ritual Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('page loads and shows step 1 — What did you trade today?', async ({ page }) => {
    await goToRitual(page)
    // Step 1 title
    await expect(page.getByText(/What did you trade today/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('clicking "No trades today" checkbox and Next advances to step 2', async ({ page }) => {
    await goToRitual(page)
    await expect(page.getByText(/What did you trade today/i).first()).toBeVisible({ timeout: 10_000 })

    // Check the "No trades today" checkbox/button
    const noTradesCheckbox = page.getByText(/No trades today/i).first()
    await expect(noTradesCheckbox).toBeVisible()
    await noTradesCheckbox.click()
    await page.waitForTimeout(200)

    // Click Next
    const nextBtn = page.getByRole('button', { name: /Next →/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(400)

    // Should now be on step 2 — the note/reflection step
    await expect(page.getByText(/note|reflection|session|How did it go/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('fills in a note and advances to step 3 (emotion)', async ({ page }) => {
    await goToRitual(page)
    await expect(page.getByText(/What did you trade today/i).first()).toBeVisible({ timeout: 10_000 })

    // Check "No trades today" and go to step 2
    const noTradesCheckbox = page.getByText(/No trades today/i).first()
    await noTradesCheckbox.click()
    await page.getByRole('button', { name: /Next →/i }).first().click()
    await page.waitForTimeout(400)

    // Fill in a note
    const noteTextarea = page.locator('textarea').first()
    await expect(noteTextarea).toBeVisible({ timeout: 5_000 })
    await noteTextarea.fill('Today was a good day for learning.')

    // Click Next
    const nextBtn = page.getByRole('button', { name: /Next →/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(400)

    // Should be on step 3 — emotion
    await expect(page.getByText(/How are you feeling|emotion|feeling/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('selects an emotion and advances to step 4 (screenshots)', async ({ page }) => {
    await goToRitual(page)
    await expect(page.getByText(/What did you trade today/i).first()).toBeVisible({ timeout: 10_000 })

    // Step 1 → 2
    await page.getByText(/No trades today/i).first().click()
    await page.getByRole('button', { name: /Next →/i }).first().click()
    await page.waitForTimeout(400)

    // Step 2 → 3
    await page.getByRole('button', { name: /Next →|Skip/i }).first().click()
    await page.waitForTimeout(400)

    // Step 3 — emotion
    await expect(page.getByText(/How are you feeling/i).first()).toBeVisible({ timeout: 5_000 })

    // Select an emotion (e.g., click "Great" or the last emoji button)
    const greatBtn = page.getByRole('button', { name: /Great/i }).first()
    if (await greatBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await greatBtn.click()
    } else {
      // Click the emoji slider to set emotion
      const slider = page.locator('input[type="range"]').first()
      if (await slider.isVisible({ timeout: 1000 }).catch(() => false)) {
        await slider.fill('5')
      }
    }

    // Click Next
    await page.getByRole('button', { name: /Next →/i }).first().click()
    await page.waitForTimeout(400)

    // Should be on step 4 — screenshots
    await expect(page.getByText(/screenshot|Add a screenshot/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('skipping screenshot advances to step 5 (completion/Done)', async ({ page }) => {
    await goToRitual(page)
    await expect(page.getByText(/What did you trade today/i).first()).toBeVisible({ timeout: 10_000 })

    // Step 1 → 2
    await page.getByText(/No trades today/i).first().click()
    await page.getByRole('button', { name: /Next →/i }).first().click()
    await page.waitForTimeout(400)

    // Step 2 → 3
    await page.getByRole('button', { name: /Next →|Skip/i }).first().click()
    await page.waitForTimeout(400)

    // Step 3 → 4
    await page.getByRole('button', { name: /Next →|Skip/i }).first().click()
    await page.waitForTimeout(400)

    // Step 4 — click Skip to skip screenshot
    const skipBtn = page.getByRole('button', { name: /Skip/i }).first()
    await expect(skipBtn).toBeVisible({ timeout: 5_000 })
    await skipBtn.click()
    await page.waitForTimeout(800) // slight delay for step 5 animation

    // Step 5 — completion
    await expect(page.getByText(/Done!|Ritual complete|✅/i).first()).toBeVisible({ timeout: 5_000 })
  })

  test('streak counter is visible on the ritual page', async ({ page }) => {
    await goToRitual(page)
    // Streak indicator is visible somewhere on the page (main ritual page, not inside the flow)
    // It shows "X day streak" or similar
    const streakText = page.getByText(/streak/i).first()
    await expect(streakText).toBeVisible({ timeout: 10_000 })
  })

  test('disclaimer is present on the page', async ({ page }) => {
    await goToRitual(page)
    const disclaimer = page.getByText(/Disclaimer|disclaimer|not financial advice|Performance analytics/i).first()
    await expect(disclaimer).toBeVisible({ timeout: 10_000 })
  })
})
