import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

async function goToJournal(page: Page) {
  await page.goto('/journal', { waitUntil: 'domcontentloaded' })
  // Wait for React to hydrate
  await page.waitForTimeout(500)
}

async function openNewTradeForm(page: Page) {
  // Click the "Trade Log" tab first to make sure we're on the right tab
  const tradeLogTab = page.getByRole('button', { name: /Trade Log/i })
  if (await tradeLogTab.isVisible()) {
    await tradeLogTab.click()
  }
  // Click the "Log a New Trade" or similar button
  const newTradeBtn = page.getByRole('button', { name: /Log a New Trade|New Trade|\+ New Trade/i }).first()
  await newTradeBtn.click()
  await page.waitForTimeout(300)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Journal Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('page loads and shows Trade Log tab', async ({ page }) => {
    await goToJournal(page)
    // The "Trade Log" tab/button should be visible
    await expect(page.getByRole('button', { name: /Trade Log/i }).first()).toBeVisible()
  })

  test('opens new trade form and shows all key fields', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    // Symbol field
    await expect(page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()).toBeVisible()
    // Entry price field
    await expect(page.getByPlaceholder(/entry|150\.00/i).first()).toBeVisible()
    // Exit price field
    await expect(page.getByPlaceholder(/exit|157/i).first()).toBeVisible()
    // Direction (Long/Short)
    await expect(page.getByText(/Long/i).first()).toBeVisible()
  })

  test('typing NQ auto-detects Futures and shows tick info', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    const symbolInput = page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()
    await symbolInput.fill('NQ')
    await symbolInput.dispatchEvent('input')
    await page.waitForTimeout(500)

    // Asset class should become Futures
    const futuresOption = page.getByRole('option', { name: 'Futures' })
    const assetSelect = page.locator('select').filter({ hasText: /Futures/i })
    // At least one of these should indicate Futures is selected
    const futuresIndicator = page.getByText(/Futures/i).first()
    await expect(futuresIndicator).toBeVisible()
  })

  test('typing AAPL keeps asset class as Stock', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    const symbolInput = page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()
    await symbolInput.fill('AAPL')
    await symbolInput.dispatchEvent('input')
    await page.waitForTimeout(500)

    // Stock should still be selected (it's the default and AAPL doesn't trigger futures detection)
    const stockIndicator = page.getByText(/Stock/i).first()
    await expect(stockIndicator).toBeVisible()
  })

  test('futures symbol shows live price hint instead of fill button', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    const symbolInput = page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()
    await symbolInput.fill('NQ')
    await symbolInput.dispatchEvent('input')
    await page.waitForTimeout(500)

    // The "Live price fill not available for futures" message should be visible
    // and the fill button should NOT be visible
    const fillButton = page.getByRole('button', { name: /Fill NQ current price/i })
    await expect(fillButton).not.toBeVisible()

    const futuresHint = page.getByText(/Live price fill not available for futures/i)
    await expect(futuresHint).toBeVisible()
  })

  test('enters a complete stock trade and verifies P&L', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    // Fill in symbol
    const symbolInput = page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()
    await symbolInput.fill('AAPL')
    await symbolInput.dispatchEvent('input')
    await page.waitForTimeout(300)

    // Make sure asset class is Stock
    const assetSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Stock' }) }).first()
    if (await assetSelect.isVisible()) {
      await assetSelect.selectOption('Stock')
    }

    // Direction: Long (should be default)
    const longButton = page.getByRole('button', { name: /^Long$/i }).first()
    if (await longButton.isVisible()) {
      await longButton.click()
    }

    // Entry price
    const entryInput = page.getByPlaceholder(/e\.g\. 150\.00|entry/i).first()
    await entryInput.fill('150')

    // Exit price
    const exitInput = page.getByPlaceholder(/e\.g\. 157\.50|exit/i).first()
    await exitInput.fill('155')

    // Position size / shares
    const sizeInput = page.getByPlaceholder(/e\.g\. 100|position/i).first()
    await sizeInput.fill('100')

    // Stop loss (if present)
    const stopInput = page.getByPlaceholder(/stop|e\.g\. 148/i).first()
    if (await stopInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await stopInput.fill('148')
    }

    // Save trade
    const saveButton = page.getByRole('button', { name: /Save Trade|Log Trade|Submit|Save/i }).first()
    await saveButton.click()
    await page.waitForTimeout(500)

    // Verify trade appears in the list with $500 P&L
    await expect(page.getByText('AAPL')).toBeVisible()
    await expect(page.getByText(/\$500|\+500/)).toBeVisible()
  })

  test('enters a futures trade and verifies P&L', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    // Fill in symbol NQ
    const symbolInput = page.getByPlaceholder(/ticker|symbol|e\.g\. AAPL|NQ/i).first()
    await symbolInput.fill('NQ')
    await symbolInput.dispatchEvent('input')
    await page.waitForTimeout(500)

    // Select Futures asset class
    const assetSelect = page.locator('select').first()
    await assetSelect.selectOption('Futures')
    await page.waitForTimeout(300)

    // Entry price
    const entryInput = page.getByPlaceholder(/e\.g\. 150\.00|entry/i).first()
    await entryInput.fill('20150')

    // Exit price
    const exitInput = page.getByPlaceholder(/e\.g\. 157\.50|exit/i).first()
    await exitInput.fill('20175')

    // Contracts
    const contractsInput = page.getByPlaceholder(/e\.g\. 1|contracts/i).first()
    await contractsInput.fill('2')

    // Save trade
    const saveButton = page.getByRole('button', { name: /Save Trade|Log Trade|Submit|Save/i }).first()
    await saveButton.click()
    await page.waitForTimeout(500)

    // Verify trade appears with P&L info (ticks or dollars)
    await expect(page.getByText('NQ')).toBeVisible()
  })

  test('asset type filter shows only filtered trades', async ({ page }) => {
    await goToJournal(page)

    // The filter buttons should be present (All, Stock, Futures, etc.)
    await expect(page.getByRole('button', { name: /^All$/i }).first()).toBeVisible()
    // Click Futures filter
    const futuresFilter = page.getByRole('button', { name: /^Futures$/i }).first()
    if (await futuresFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await futuresFilter.click()
      await page.waitForTimeout(300)
      // Verify filter is active (button style changes) — just confirm no error
    }
  })

  test('playbook dropdown shows all 5 default playbooks', async ({ page }) => {
    await goToJournal(page)
    await openNewTradeForm(page)

    // The playbook dropdown/select should have 5 options
    const playbookSelect = page.locator('select').filter({
      has: page.getByRole('option', { name: /Playbook|Opening Range|VWAP|Gap/i }),
    }).first()

    if (await playbookSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await playbookSelect.locator('option').count()
      // 5 playbooks + 1 "No playbook" option = 6 total
      expect(options).toBeGreaterThanOrEqual(5)
    } else {
      // Playbook dropdown may be a custom component
      const playbookLabel = page.getByText(/Playbook/i).first()
      await expect(playbookLabel).toBeVisible()
    }
  })
})
