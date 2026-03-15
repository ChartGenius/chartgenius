/**
 * tierAccess.ts — Free tier, trial, and paywall logic for TradVue
 *
 * Three-tier model:
 *   demo  — Unauthenticated. Sample data only. No interactive features.
 *   free  — Logged in. 3-week full trial → restricted after trial.
 *           Post-trial: 30-day view window, limited CSV, no auto-sync.
 *   paid  — $24/mo. Everything unlimited.
 *
 * Data is retained while your account is active. Free tier restricts VIEW, not storage.
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

export const TRIAL_DAYS = 21          // 3 weeks from signup
export const VIEW_WINDOW_DAYS = 30    // free tier post-trial view window
export const MONTHLY_PRICE = 24       // $/mo
export const ANNUAL_PRICE = 16.80     // $/mo billed annually

// ── Core tier resolution ──────────────────────────────────────────────────────

/**
 * Returns the user's effective tier.
 *   null user  → 'demo'
 *   user.tier === 'pro'  → 'paid'
 *   otherwise  → 'free'
 */
export function getUserTier(user: AuthUser | null): UserTier {
  if (!user) return 'demo'
  if (user.tier === 'pro') return 'paid'
  return 'free'
}

// ── Trial logic ───────────────────────────────────────────────────────────────

/**
 * Returns true if the user is within the 3-week free trial window.
 * Trial starts from user.created_at (Supabase signup timestamp).
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
 * Gating matrix:
 *   demo          → nothing (redirect to sign up)
 *   free (trial)  → everything
 *   free (post)   → csv-import/export limited to 30d; no auto-sync, history, advanced
 *   paid          → everything
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
 * Returns true if a given entry date is beyond the 30-day view window
 * for a free-tier post-trial user.
 *
 * IMPORTANT: Data is retained while the account is active. Only the view is restricted.
 */
export function isDataLocked(user: AuthUser | null, entryDate: string | Date): boolean {
  const tier = getUserTier(user)

  if (tier === 'demo') return false   // demo shows sample data (never "locked")
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
 * Returns a Date cutoff for CSV import — rows before this date are filtered out.
 * Returns null if no limit (paid or trial users).
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
 * Used for the conversion copy: "Your 847 trades are waiting."
 */
export function getLockedEntryCount(user: AuthUser | null, dates: string[]): number {
  if (!dates.length) return 0
  return dates.filter(d => isDataLocked(user, d)).length
}
