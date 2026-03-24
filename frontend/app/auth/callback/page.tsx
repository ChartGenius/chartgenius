'use client'

/**
 * Auth Callback Page
 *
 * Handles Supabase email verification redirects.
 * Supabase sends users to: https://www.tradvue.com/#access_token=...&refresh_token=...
 *
 * The Supabase JS client (when present) auto-detects this hash fragment.
 * This page handles it manually since we use a custom backend auth flow.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { persistStoredAuth } from '../../utils/storageKeys'

type Status = 'processing' | 'success' | 'error'
type CallbackKind = 'signup' | 'recovery' | 'magiclink' | 'unknown'

function normalizeMessage(message: string | null | undefined, fallback: string) {
  if (!message) return fallback
  return message.replace(/\+/g, ' ')
}

function getErrorTitle(kind: CallbackKind) {
  if (kind === 'recovery') return 'Reset Link Expired'
  if (kind === 'signup') return 'Verification Link Expired'
  return 'Link Unavailable'
}

function getErrorActions(kind: CallbackKind, fallbackEmail: string) {
  if (kind === 'recovery') {
    return {
      primaryHref: '/#signin',
      primaryLabel: 'Back to sign in',
      secondaryHref: fallbackEmail ? `mailto:support@tradvue.com?subject=Password%20reset%20help&body=Hi%20TradVue,%20I%20need%20help%20with%20a%20password%20reset%20link%20for%20${encodeURIComponent(fallbackEmail)}.` : '/help',
      secondaryLabel: fallbackEmail ? 'Contact support' : 'Open help center',
      tip: 'Request a fresh password reset from the sign-in screen and use the newest email only.'
    }
  }

  return {
    primaryHref: '/#signin',
    primaryLabel: 'Back to sign in',
    secondaryHref: fallbackEmail ? `mailto:support@tradvue.com?subject=Email%20verification%20help&body=Hi%20TradVue,%20I%20need%20help%20with%20email%20verification%20for%20${encodeURIComponent(fallbackEmail)}.` : '/help',
    secondaryLabel: fallbackEmail ? 'Contact support' : 'Open help center',
    tip: 'Open the latest verification email only. Older links stop working after a newer email is sent.'
  }
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('processing')
  const [message, setMessage] = useState('Verifying your email…')
  const [callbackKind, setCallbackKind] = useState<CallbackKind>('unknown')
  const [fallbackEmail, setFallbackEmail] = useState('')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const search = new URLSearchParams(window.location.search)
    const hintedType = (search.get('type') || '').toLowerCase()
    const hintedEmail = search.get('email') || ''

    if (hintedEmail) setFallbackEmail(hintedEmail)

    if (!hash) {
      const inferredKind: CallbackKind = hintedType === 'recovery'
        ? 'recovery'
        : hintedType === 'signup'
          ? 'signup'
          : 'unknown'

      setCallbackKind(inferredKind)
      setStatus('error')
      setMessage(
        inferredKind === 'recovery'
          ? 'This password reset link is missing required sign-in data. Request a new reset email and use the newest message.'
          : 'This verification link is missing required sign-in data. Request a fresh email and use the newest message.'
      )
      return
    }

    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const tokenType = (params.get('type') || hintedType || '').toLowerCase()
    const errorCode = params.get('error_code')
    const errorDesc = params.get('error_description')
    const errorKind: CallbackKind = tokenType === 'recovery'
      ? 'recovery'
      : tokenType === 'signup'
        ? 'signup'
        : tokenType === 'magiclink'
          ? 'magiclink'
          : 'unknown'

    setCallbackKind(errorKind)

    if (errorCode || errorDesc) {
      setStatus('error')
      setMessage(normalizeMessage(errorDesc, 'This link is no longer valid. Please request a new one and use the most recent email.'))
      return
    }

    if (!accessToken) {
      setStatus('error')
      setMessage(
        errorKind === 'recovery'
          ? 'This password reset link is invalid. Request a new reset email and try again.'
          : 'This verification link is invalid. Request a new verification email and try again.'
      )
      return
    }

    try {
      persistStoredAuth(accessToken, undefined, refreshToken)
      setStatus('success')
      setMessage(errorKind === 'recovery' ? 'Password reset verified. Redirecting you now…' : 'Email verified. Redirecting you now…')

      const redirectTarget = errorKind === 'recovery' ? '/?reset=1' : '/?verified=1'
      setTimeout(() => {
        router.replace(redirectTarget)
      }, 1200)
    } catch {
      setStatus('error')
      setMessage('We could not save your session on this device. Go back to sign in and try again.')
    }
  }, [router])

  const errorActions = useMemo(() => getErrorActions(callbackKind, fallbackEmail), [callbackKind, fallbackEmail])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-0, #0f0f12)',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-1, #16161a)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 14,
        padding: '40px 36px',
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #3b82f6)" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-0, #e8e8f0)' }}>TradVue</span>
        </div>

        {status === 'processing' && (
          <>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--border, rgba(255,255,255,0.08))',
              borderTopColor: 'var(--accent, #3b82f6)',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-1, #c0c0d0)', fontSize: 15, margin: 0 }}>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(0,192,106,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#00c06a',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: '#00c06a', margin: '0 0 8px', fontSize: 18 }}>
              {callbackKind === 'recovery' ? 'Reset Confirmed' : 'Email Verified'}
            </h2>
            <p style={{ color: 'var(--text-2, #8888a0)', fontSize: 14, margin: 0 }}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              color: '#ef4444',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ color: '#ef4444', margin: '0 0 8px', fontSize: 18 }}>{getErrorTitle(callbackKind)}</h2>
            <p style={{ color: 'var(--text-2, #8888a0)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.6 }}>{message}</p>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: '18px',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1, #d4d4e0)', marginBottom: 6 }}>What to do next</div>
              <div style={{ fontSize: 13, color: 'var(--text-2, #8888a0)', lineHeight: 1.6 }}>{errorActions.tip}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={errorActions.primaryHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 18px',
                  background: 'var(--accent, #3b82f6)',
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {errorActions.primaryLabel}
              </a>
              <a
                href={errorActions.secondaryHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 18px',
                  background: 'transparent',
                  color: 'var(--text-1, #d4d4e0)',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {errorActions.secondaryLabel}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
