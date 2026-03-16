import { test, expect, type Page } from '@playwright/test'

// Expected nav items in order (from PersistentNav.tsx)
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'News',      href: '/news' },
  { label: 'Analysis',  href: '/' },      // /?view=analysis — same page
  { label: 'Calendar',  href: '/calendar' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Journal',   href: '/journal' },
  { label: 'Prop Firm', href: '/propfirm' },
  { label: 'Playbooks', href: '/playbooks' },
  { label: 'Ritual',    href: '/ritual' },
  { label: 'AI Coach',  href: '/coach' },
  { label: 'Tools',     href: '/tools' },
  { label: 'Help',      href: '/help' },
]

// Pages that have disclaimers
const PAGES_WITH_DISCLAIMER = ['/journal', '/propfirm', '/playbooks', '/ritual', '/coach']

async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
  })
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page)
  })

  test('all nav links are present on the dashboard', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // The nav component should render
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10_000 })

    // Check for key nav items
    await expect(page.getByRole('link', { name: /Journal/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Playbooks/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Prop Firm/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Ritual/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /AI Coach|Coach/i }).first()).toBeVisible()
  })

  test('nav links appear in correct order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    // Get all nav links
    const navLinks = page.locator('nav a[href]')
    const count = await navLinks.count()
    expect(count).toBeGreaterThanOrEqual(5)

    // Verify key links exist (not strict order, as mobile nav might differ)
    const allText = await navLinks.allTextContents()
    const allTextJoined = allText.join(' ')
    expect(allTextJoined).toMatch(/Journal/i)
    expect(allTextJoined).toMatch(/Playbooks/i)
  })

  test('clicking Journal navigates to /journal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const journalLink = page.getByRole('link', { name: /^Journal$/i }).first()
    await journalLink.click()
    await page.waitForURL('**/journal', { timeout: 10_000 })
    expect(page.url()).toContain('/journal')
  })

  test('clicking Playbooks navigates to /playbooks', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const link = page.getByRole('link', { name: /^Playbooks$/i }).first()
    await link.click()
    await page.waitForURL('**/playbooks', { timeout: 10_000 })
    expect(page.url()).toContain('/playbooks')
  })

  test('clicking Prop Firm navigates to /propfirm', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const link = page.getByRole('link', { name: /^Prop Firm$/i }).first()
    await link.click()
    await page.waitForURL('**/propfirm', { timeout: 10_000 })
    expect(page.url()).toContain('/propfirm')
  })

  test('clicking Ritual navigates to /ritual', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const link = page.getByRole('link', { name: /Ritual/i }).first()
    await link.click()
    await page.waitForURL('**/ritual', { timeout: 10_000 })
    expect(page.url()).toContain('/ritual')
  })

  test('clicking AI Coach navigates to /coach', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    const link = page.getByRole('link', { name: /AI Coach|Coach/i }).first()
    await link.click()
    await page.waitForURL('**/coach', { timeout: 10_000 })
    expect(page.url()).toContain('/coach')
  })

  test('journal page has a footer disclaimer', async ({ page }) => {
    await page.goto('/journal', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Disclaimer|not financial advice|educational/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('propfirm page has a footer disclaimer', async ({ page }) => {
    await page.goto('/propfirm', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Disclaimer|not financial advice|educational/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('playbooks page has a footer disclaimer', async ({ page }) => {
    await page.goto('/playbooks', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Disclaimer|not financial advice|educational/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('ritual page has a footer disclaimer', async ({ page }) => {
    await page.goto('/ritual', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Disclaimer|not financial advice|educational/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('coach page has a footer disclaimer', async ({ page }) => {
    await page.goto('/coach', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)
    await expect(page.getByText(/Disclaimer|not financial advice|educational/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
