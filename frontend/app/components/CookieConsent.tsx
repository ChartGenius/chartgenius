'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { grantAnalyticsConsent } from '../utils/analytics'

const BANNER_KEY = 'cg_cookie_consent_dismissed'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(BANNER_KEY)
      if (!dismissed) setVisible(true)
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, [])

  function handleAccept() {
    try {
      localStorage.setItem(BANNER_KEY, 'accepted')
    } catch {}
    grantAnalyticsConsent()
    setVisible(false)
  }

  function handleDecline() {
    try {
      localStorage.setItem(BANNER_KEY, 'declined')
    } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(18, 22, 30, 0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: '1.5',
      }}
    >
      <p style={{ margin: 0, flex: '1 1 240px' }}>
        We use cookies to improve your experience.{' '}
        <Link
          href="/legal/cookies"
          style={{ color: '#60a5fa', textDecoration: 'underline' }}
        >
          See our Cookie Policy.
        </Link>
      </p>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={handleDecline}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.35)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          Decline
        </button>

        <button
          onClick={handleAccept}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            border: '1px solid #2563eb',
            background: '#2563eb',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1d4ed8'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = '#2563eb'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#2563eb'
          }}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
