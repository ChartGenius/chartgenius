'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState, useEffect, useCallback } from 'react'

// ─── Nav items ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'News',      href: '/news' },
  { label: 'Analysis',  href: '/?view=analysis' },
  { label: 'Calendar',  href: '/calendar' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Journal',   href: '/journal' },
  { label: 'Tools',     href: '/tools' },
  { label: 'Help',      href: '/help' },
]

// ─── Inner nav (uses hooks) ───────────────────────────────────────────────────

function NavInner() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/?')) return pathname === '/'
    return pathname.startsWith(href)
  }

  // Close drawer on navigation
  const handleNavClick = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [drawerOpen])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <nav className="app-persistent-nav">
      <div className="apn-inner">
        <Link href="/" className="apn-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-header.svg"
            alt="TradVue"
            className="apn-logo-img"
          />
          <span className="logo-badge">BETA</span>
        </Link>

        {/* Desktop + non-landscape tab bar */}
        <div className="apn-items">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item${isActive(item.href) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="apn-right">
          <Link href="/" className="apn-home-link">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hamburger button — only visible in landscape mobile via CSS */}
        <button
          className="apn-hamburger"
          onClick={() => setDrawerOpen(o => !o)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          ☰
        </button>
      </div>

      {/* Backdrop — closes drawer on click */}
      <div
        className={`apn-drawer-backdrop${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out drawer with ALL nav items */}
      <div
        className={`apn-drawer${drawerOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="apn-drawer-header">
          <span className="apn-drawer-title">Navigation</span>
          <button
            className="apn-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <div className="apn-drawer-items">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item${isActive(item.href) ? ' active' : ''}`}
              onClick={handleNavClick}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

// ─── Export (wrapped in Suspense for searchParams) ───────────────────────────

export default function PersistentNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  )
}
