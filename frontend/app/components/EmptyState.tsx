'use client'

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  headline: string
  subtext: string
  ctaLabel: string
  onCta: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  compact?: boolean
}

export function EmptyState({
  icon,
  headline,
  subtext,
  ctaLabel,
  onCta,
  secondaryLabel,
  onSecondary,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`} role="status">
      {icon && (
        <div className="empty-state-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="empty-state-headline">{headline}</h3>
      <p className="empty-state-subtext">{subtext}</p>
      <button className="empty-state-cta" onClick={onCta}>
        {ctaLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button className="empty-state-secondary" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
    </div>
  )
}

// ─── Watchlist Empty State ────────────────────────────────────────────────────

interface WatchlistEmptyProps {
  onAddSymbol: () => void
  onExample: () => void
}

export function WatchlistEmpty({ onAddSymbol, onExample }: WatchlistEmptyProps) {
  return (
    <EmptyState
      icon={
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="4" y="8" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M12 26 L18 18 L22 22 L28 14" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="28" cy="14" r="2" fill="var(--green)" />
          <path d="M20 20 v6 M17 23 h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      headline="Your Watchlist is Empty"
      subtext="Add a stock you're watching and get real-time insights."
      ctaLabel="Add Your First Stock"
      onCta={onAddSymbol}
      secondaryLabel="Show me an example"
      onSecondary={onExample}
      compact
    />
  )
}

// ─── Alerts Empty State ───────────────────────────────────────────────────────

interface AlertsEmptyProps {
  onCreateAlert: () => void
}

export function AlertsEmpty({ onCreateAlert }: AlertsEmptyProps) {
  return (
    <EmptyState
      icon={
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 6 C14 6 10 11 10 17 L10 24 L7 27 L33 27 L30 24 L30 17 C30 11 26 6 20 6 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M17 27 C17 28.7 18.3 30 20 30 C21.7 30 23 28.7 23 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* Slash line */}
          <line x1="8" y1="8" x2="32" y2="32" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      }
      headline="You're Not Getting Alerted Yet"
      subtext="Set up price alerts so you catch moves even when you're away."
      ctaLabel="Create Your First Alert"
      onCta={onCreateAlert}
      secondaryLabel="I'll check in manually"
      onSecondary={() => {}}
      compact
    />
  )
}
