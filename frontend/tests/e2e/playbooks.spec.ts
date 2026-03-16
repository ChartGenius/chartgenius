import { test, expect, type Page } from '@playwright/test'

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

async function goToPlaybooks(page: Page) {
  await page.goto('/playbooks', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(500)
}

test.describe('Playbooks Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('page loads and shows 5 default playbooks', async ({ page }) => {
    await goToPlaybooks(page)

    // All 5 default playbooks should be visible
    await expect(page.getByText(/Opening Range Breakout/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/VWAP Bounce/i).first()).toBeVisible()
    await expect(page.getByText(/Gap and Go/i).first()).toBeVisible()
    await expect(page.getByText(/Red to Green/i).first()).toBeVisible()
    await expect(page.getByText(/Breakout.*Breakdown|Breakdown.*Breakout/i).first()).toBeVisible()
  })

  test('category filter works — clicking Momentum shows only momentum playbooks', async ({ page }) => {
    await goToPlaybooks(page)

    // Click the Momentum filter button
    const momentumFilter = page.getByRole('button', { name: /Momentum/i }).first()
    await expect(momentumFilter).toBeVisible({ timeout: 10_000 })
    await momentumFilter.click()
    await page.waitForTimeout(300)

    // Gap and Go is 'momentum' category — should be visible
    await expect(page.getByText(/Gap and Go/i).first()).toBeVisible()

    // ORB is 'breakout' category — should NOT be visible in momentum filter
    await expect(page.getByText(/Opening Range Breakout/i).first()).not.toBeVisible()
  })

  test('clicking a playbook card opens the detail view with entry/exit rules', async ({ page }) => {
    await goToPlaybooks(page)

    // Click the ORB playbook card
    const orbCard = page.getByText(/Opening Range Breakout/i).first()
    await expect(orbCard).toBeVisible({ timeout: 10_000 })
    await orbCard.click()
    await page.waitForTimeout(400)

    // Detail view should show entry and exit rules
    await expect(page.getByText(/Entry Rules|Entry/i).first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/Exit Rules|Exit/i).first()).toBeVisible()
  })

  test('can create a custom playbook and it appears in the list', async ({ page }) => {
    await goToPlaybooks(page)

    // Find and click the "Create" / "New Playbook" / "+" button
    const createBtn = page.getByRole('button', { name: /Create|New Playbook|\+ Playbook|Add Playbook/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10_000 })
    await createBtn.click()
    await page.waitForTimeout(300)

    // Fill in playbook name
    const nameInput = page.getByPlaceholder(/My ORB Setup|name|playbook name/i).first()
    await expect(nameInput).toBeVisible({ timeout: 5_000 })
    await nameInput.fill('My Test Scalp Strategy')

    // Add at least one entry rule if there's an add-rule button
    const addEntryRuleBtn = page.getByRole('button', { name: /Add Entry Rule|add rule|\+ Rule/i }).first()
    if (await addEntryRuleBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await addEntryRuleBtn.click()
      const ruleInput = page.getByPlaceholder(/e\.g\.|rule/i).last()
      if (await ruleInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await ruleInput.fill('Wait for confirmation candle')
      }
    }

    // Save the playbook
    const saveBtn = page.getByRole('button', { name: /Save|Create Playbook|Submit/i }).first()
    await saveBtn.click()
    await page.waitForTimeout(500)

    // The new playbook should appear in the list
    await expect(page.getByText('My Test Scalp Strategy')).toBeVisible({ timeout: 5_000 })
  })

  test('disclaimer is visible on the page', async ({ page }) => {
    await goToPlaybooks(page)
    const disclaimer = page.getByText(/Disclaimer|disclaimer|not financial advice/i).first()
    await expect(disclaimer).toBeVisible({ timeout: 10_000 })
  })
})
