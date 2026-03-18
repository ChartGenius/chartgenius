/**
 * tierAccess.ts — Three-tier access model for TradVue
 *
 * Three-tier model (per Terms of Service, Sections 2.1 and 5):
 *
 *   demo  — Anonymous visitor (no account). Access to dashboard, news, economic calendar,
 *           30+ trading calculators, and watchlist. No data stored server-side.
 *           Users should be prompted to create a free account to access journal,
 *           portfolio, playbooks, AI Coach, prop firm tracker, and trade rules.
 *
 *   free  — Authenticated free account. 3-week full-featured trial from account creation
 *           date (all Pro features). After trial expires:
 *             - 30-day rolling view window (older data locked, not deleted)
 *             - Limited CSV import/export (last 30 days only)
 *             - No cloud sync, no auto-sync, no advanced reports
 *             - 3 price alerts
 *             - Community support
 *           No credit card required. Data is retained — free tier restricts VIEW, not storage.
 *
 *   paid  — Pro: $24/mo (monthly) or $16.80/mo billed annually at $201.60/year.
 *           Everything unlimited. Full trade history, cloud sync, broker auto-sync (coming soon),
 *           advanced reports & AI pattern detection, unlimited price alerts, priority support.
 *
 * ANONYMOUS_FEATURES: features accessible without any account (demo tier)
 * ACCOUNT_REQUIRED_FEATURES: features requiring at minimum a free account
 */

import { AuthUser } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserTier = 'demo' | 'free' | 'paid'

export type GatedFeature =
  | 'csv-import'
  | 'csv-export'
  | 'auto-sync'
  | 'unlimited-history'
  | 'advanced-reports'
  | 'full-journal'
  | 'full-portfolio'

// ── Constants ─────────────────────────────────────────────────────────────────

export const TRIAL_DAYS = 21          // 3-week trial from account creation date (ToS §5)
export const VIEW_WINDOW_DAYS = 30    // free tier post-trial rolling view window
export const MONTHLY_PRICE = 24       // $/mo (Pro monthly)
export const ANNUAL_PRICE = 16.80     // $/mo billed annually ($201.60/year)

/** Features available without any account (anonymous visitors / demo tier) */
export const ANONYMOUS_FEATURES = [
  'dashboard',
  'news',
  'calendar',
  'tools',
  'watchlist',
] as const

/** Features requiring at minimum a free account (not available anonymously) */
export const ACCOUNT_REQUIRED_FEATURES = [
  'journal',
  'portfolio',
  'playbooks',
  'ritual',
  'coach',
  'propfirm',
  'rules',
  'csv-import',
  'csv-export',
  'price-alerts',
  'cloud-sync',
  'advanced-reports',
  'auto-sync',
] as const

// ── Core tier resolution ──────────────────────────────────────────────────────

/**
 * Returns the user's effective tier.
 *   null user       → 'demo'  (unauthenticated — prompt to create account)
 *   user.tier === 'pro'  → 'paid'
 *   otherwise       → 'free'  (includes 3-week trial window from created_at)
 */
export function getUserTier(user: AuthUser | null): UserTier {
  if (!user) return 'demo'
  if (user.tier === 'pro') return 'paid'
  return 'free'
}

// ── Trial logic ───────────────────────────────────────────────────────────────

/**
 * Returns true if the user is within the 3-week free trial window.
 * Trial starts from user.created_at (account creation date per ToS §5).
 * Only applies to authenticated free-tier users.
 */
export function isTrialActive(user: AuthUser | null): boolean {
  if (!user) return false
  if (getUserTier(user) === 'paid') return false

  const signupDate = new Date(user.created_at)
  const now = new Date()
  const diffDays = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays < TRIAL_DAYS
}

/**
 * Returns days remaining in trial (0 if expired or not applicable).
 */
export function getTrialDaysRemaining(user: AuthUser | null): number {
  if (!user) return 0
  if (getUserTier(user) === 'paid') return 0

  const signupDate = new Date(user.created_at)
  const now = new Date()
  const diffDays = (now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
  const remaining = TRIAL_DAYS - diffDays
  return Math.max(0, Math.ceil(remaining))
}

// ── Feature gating ────────────────────────────────────────────────────────────

/**
 * Returns true if the user can fully access a given feature.
 *
 * Gating matrix (per ToS §5):
 *   demo          → nothing (redirect to sign up — account required)
 *   free (trial)  → everything (3-week full trial from account creation)
 *   free (post)   → csv-import/export limited to last 30 days;
 *                   no auto-sync, unlimited history, or advanced reports
 *   paid          → everything unlimited
 */
export function canAccessFeature(user: AuthUser | null, feature: GatedFeature): boolean {
  const tier = getUserTier(user)

  if (tier === 'demo') return false
  if (tier === 'paid') return true

  // Free tier — full access during trial
  if (isTrialActive(user)) return true

  // Free tier post-trial
  switch (feature) {
    case 'csv-import':
    case 'csv-export':
      // Allowed but limited to VIEW_WINDOW_DAYS — enforced at data layer
      return true
    case 'auto-sync':
    case 'unlimited-history':
    case 'advanced-reports':
    case 'full-journal':
    case 'full-portfolio':
      return false
    default:
      return true
  }
}

// ── Data locking ──────────────────────────────────────────────────────────────

/**
 * Returns true if a given entry date is beyond the 30-day rolling view window
 * for a free-tier post-trial user (per ToS §5).
 *
 * IMPORTANT: Data is retained while the account is active. Only the view is restricted.
 * Upgrade to Pro to restore access to the full history.
 */
export function isDataLocked(user: AuthUser | null, entryDate: string | Date): boolean {
  const tier = getUserTier(user)

  if (tier === 'demo') return false   // demo: no user data
  if (tier === 'paid') return false   // paid = fully unlocked

  // Free trial: no lock
  if (isTrialActive(user)) return false

  // Free post-trial: lock entries older than VIEW_WINDOW_DAYS
  const date = typeof entryDate === 'string' ? new Date(entryDate + 'T12:00:00') : entryDate
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > VIEW_WINDOW_DAYS
}

// ── CSV date filter ────────────────────────────────────────────────────────────

/**
 * Returns a Date cutoff for CSV import/export — rows before this date are filtered out.
 * Returns null if no limit (paid users, or free users still in trial).
 * Free post-trial users are limited to the last VIEW_WINDOW_DAYS (per ToS §5).
 */
export function getCsvDateLimit(user: AuthUser | null): Date | null {
  const tier = getUserTier(user)
  if (tier === 'paid') return null
  if (isTrialActive(user)) return null

  // Free post-trial: last VIEW_WINDOW_DAYS only
  const limit = new Date()
  limit.setDate(limit.getDate() - VIEW_WINDOW_DAYS)
  return limit
}

// ── Locked entry count helper ─────────────────────────────────────────────────

/**
 * Returns the number of entries that are locked for this user.
 * Used for conversion copy: "Your 847 trades are waiting — upgrade to access them."
 */
export function getLockedEntryCount(user: AuthUser | null, dates: string[]): number {
  if (!dates.length) return 0
  return dates.filter(d => isDataLocked(user, d)).length
}
