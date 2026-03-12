'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../utils/cloudSync'
import { useAuth } from '../context/AuthContext'

// ─── Links ────────────────────────────────────────────────────────────────────

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

const FOOTER_LINKS: FooterLink[] = [
  { label: 'Help & Support', href: '/help' },
  { label: 'Status',         href: '/status' },
  { label: 'Changelog',      href: '/changelog' },
  { label: 'Terms',          href: '/legal/terms' },
  { label: 'Privacy',        href: '/legal/privacy' },
  { label: 'Cookies',        href: '/legal/cookies' },
  { label: 'Disclaimer',     href: '/legal/disclaimer' },
  { label: 'Contact',        href: 'mailto:support@tradvue.com', external: true },
]

// ─── Sync Indicator ───────────────────────────────────────────────────────────

function SyncIndicator() {
  const { token } = useAuth()
  const [status, setStatus] = useState<SyncStatus>(() => getSyncStatus())

  useEffect(() => {
    return subscribeSyncStatus(setStatus)
  }, [])

  if (!token) {
    return (
      <span style={{ fontSize: 10, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        ☁️ Local only
      </span>
    )
  }

  const label =
    status === 'syncing'    ? '☁️ Syncing…'    :
    status === 'synced'     ? '☁️ Synced'      :
    status === 'error'      ? '⚠️ Sync error'  :
    status === 'local-only' ? '☁️ Local only'  :
    '☁️ Cloud sync'

  const color =
    status === 'syncing' ? 'var(--accent)' :
    status === 'synced'  ? '#4ade80'       :
    status === 'error'   ? '#f87171'       :
    'var(--text-3)'

  return (
    <span style={{ fontSize: 10, color, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {label}
    </span>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Dot() {
  return (
    <span aria-hidden="true" style={{ color: 'var(--border)', userSelect: 'none' }}>
      ·
    </span>
  )
}

// ─── AppFooter ────────────────────────────────────────────────────────────────

export default function AppFooter() {
  const pathname = usePathname()

  // Don't render on the landing page — it has its own full marketing footer
  if (pathname?.startsWith('/landing')) return null

  return (
    <footer
      style={{
        background:    'var(--bg-1)',
        borderTop:     '1px solid var(--border)',
        padding:       '10px 16px 12px',
        fontSize:      '10px',
        color:         'var(--text-3)',
        lineHeight:    '1.6',
      }}
    >
      {/* Row 1 — nav links */}
      <div
        style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          marginBottom:   '4px',
        }}
      >
        {FOOTER_LINKS.map((link, i) => (
          <span
            key={link.href}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {i > 0 && <Dot />}
            {link.external ? (
              <a
                href={link.href}
                style={{ color: 'var(--text-3)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                style={{ color: 'var(--text-3)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
              >
                {link.label}
              </Link>
            )}
          </span>
        ))}
      </div>

      {/* Row 2 — copyright + disclaimer */}
      <div
        style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '8px',
          textAlign:      'center',
        }}
      >
        <SyncIndicator />
        <Dot />
        <span>© 2026 TradVue. All rights reserved.</span>
        <Dot />
        <span>
          ⚠️ Not financial advice. For informational purposes only.{' '}
          <Link
            href="/legal/disclaimer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            Read disclaimer
          </Link>
        </span>
      </div>
    </footer>
  )
}
