'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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
  { label: 'Pricing',        href: '/pricing' },
  { label: 'Terms',          href: '/legal/terms' },
  { label: 'Privacy',        href: '/legal/privacy' },
  { label: 'Cookies',        href: '/legal/cookies' },
  { label: 'Disclaimer',     href: '/legal/disclaimer' },
  { label: 'Contact',        href: 'mailto:support@tradvue.com', external: true },
]

// App nav links for internal linking
const APP_LINKS: FooterLink[] = [
  { label: 'Journal',        href: '/journal' },
  { label: 'Portfolio',      href: '/portfolio' },
  { label: 'Tools',          href: '/tools' },
  { label: 'News',           href: '/news' },
  { label: 'Calendar',       href: '/calendar' },
  { label: 'Prop Firm',      href: '/propfirm' },
  { label: 'AI Coach',       href: '/coach' },
  { label: 'Ritual',         href: '/ritual' },
]

// SEO guide links
const SEO_LINKS: FooterLink[] = [
  { label: 'Best Trading Journal',    href: '/best-trading-journal' },
  { label: 'Prop Firm Tracker',       href: '/prop-firm-tracker' },
  { label: 'Futures Journal',         href: '/futures-trading-journal' },
  { label: 'Options Journal',         href: '/options-trading-journal' },
  { label: 'Trading Calculators',     href: '/trading-calculators' },
  { label: 'Post-Trade Ritual',       href: '/post-trade-ritual' },
]

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
        padding:       '14px 16px 14px',
        fontSize:      '10px',
        color:         'var(--text-3)',
        lineHeight:    '1.6',
      }}
    >
      {/* Row 0 — app links */}
      <div
        style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          marginBottom:   '6px',
        }}
      >
        <span style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tools:</span>
        {APP_LINKS.map((link, i) => (
          <span
            key={link.href}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {i > 0 && <Dot />}
            <Link
              href={link.href}
              style={{ color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              {link.label}
            </Link>
          </span>
        ))}
      </div>

      {/* Row 0b — SEO guide links */}
      <div
        style={{
          display:        'flex',
          flexWrap:       'wrap',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          marginBottom:   '6px',
        }}
      >
        <span style={{ color: 'var(--text-3)', fontWeight: 600, fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Guides:</span>
        {SEO_LINKS.map((link, i) => (
          <span
            key={link.href}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {i > 0 && <Dot />}
            <Link
              href={link.href}
              style={{ color: 'var(--text-3)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              {link.label}
            </Link>
          </span>
        ))}
      </div>

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
                rel="noopener noreferrer"
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
