'use client'

/**
 * AuthGate.tsx — Demo-friendly auth prompt for gated pages
 *
 * When an unauthenticated user hits a gated page:
 * - Shows FULL demo content (no blur, fully visible)
 * - Sticky bottom banner nudges them to sign up
 * - Banner is dismissible — let them explore
 * - Does NOT redirect (keeps URL for bookmarking)
 */

import { useState } from 'react'
import AuthModal from './AuthModal'

interface AuthGateProps {
  /** The feature being gated, e.g. "Trade Playbooks" */
  featureName: string
  /** Short description of what the feature does */
  featureDesc?: string
  /** The demo page content shown in full */
  children: React.ReactNode
}

export default function AuthGate({ featureName, featureDesc, children }: AuthGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Demo content — fully visible, read-only */}
      <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>

      {/* Sticky bottom CTA banner */}
      {!bannerDismissed && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(139,92,246,0.95))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            flexWrap: 'wrap' as const,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff', flexShrink: 0 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              Like what you see? Create a free account to start using {featureName}.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 20px',
                color: '#6366f1',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
              }}
            >
              Sign Up Free
            </button>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                color: '#fff',
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap' as const,
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 16,
                cursor: 'pointer',
                padding: '4px 8px',
                pointerEvents: 'auto',
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Auth modal */}
      {modalOpen && (
        <AuthModal
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
