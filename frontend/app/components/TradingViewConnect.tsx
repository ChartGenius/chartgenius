'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

interface WebhookToken {
  id: string
  token: string
  label: string
  is_active: boolean
  created_at: string
  last_used_at?: string | null
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconX({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCopy({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconTV({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function IconLink({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconAlert({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconTrash({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconChevron({ open, size = 16 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Copyable URL box ──────────────────────────────────────────────────────────

function CopyBox({ value, compact }: { value: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <div style={{
        flex: 1,
        background: 'var(--bg-0, #0d0d14)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: 8,
        padding: compact ? '7px 12px' : '10px 14px',
        fontFamily: 'var(--mono, monospace)',
        fontSize: compact ? 11 : 12,
        color: 'var(--text-1, #e0e0e0)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}>
        {value}
      </div>
      <button
        onClick={copy}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(74,158,255,0.15)',
          border: '1px solid ' + (copied ? 'rgba(16,185,129,0.5)' : 'rgba(74,158,255,0.4)'),
          borderRadius: 8,
          padding: compact ? '6px 12px' : '8px 16px',
          color: copied ? 'var(--green, #10b981)' : 'var(--blue, #4a9eff)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ── Copyable Code block ───────────────────────────────────────────────────────

function CopyCode({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-3, #6b7280)',
          marginBottom: 6,
        }}>
          {label}
        </div>
      )}
      <pre style={{
        background: 'var(--bg-0, #0d0d14)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: 8,
        padding: '14px 16px',
        fontFamily: 'var(--mono, monospace)',
        fontSize: 12,
        color: 'var(--text-1, #e0e0e0)',
        margin: 0,
        overflowX: 'auto',
        lineHeight: 1.7,
      }}>
        {code}
      </pre>
      <button
        onClick={copy}
        style={{
          position: 'absolute',
          top: label ? 'calc(1.5rem + 8px)' : 8,
          right: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
          border: '1px solid ' + (copied ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)'),
          borderRadius: 6,
          padding: '4px 10px',
          color: copied ? 'var(--green, #10b981)' : 'var(--text-2, #9ca3af)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ── Expandable Step Card ───────────────────────────────────────────────────────
// Steps expand/collapse independently — opening one never closes another.

function StepCard({
  number,
  title,
  defaultOpen = true,
  children,
}: {
  number: number
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      background: 'var(--bg-1, #1a1a2e)',
      border: '1px solid ' + (open ? 'rgba(74,158,255,0.25)' : 'var(--border, rgba(255,255,255,0.08))'),
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header — always clickable to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: open ? 'rgba(74,158,255,0.2)' : 'rgba(255,255,255,0.05)',
          border: '1px solid ' + (open ? 'rgba(74,158,255,0.5)' : 'rgba(255,255,255,0.12)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 800,
          color: open ? 'var(--blue, #4a9eff)' : 'var(--text-2, #9ca3af)',
          transition: 'all 0.15s',
        }}>
          {number}
        </div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: open ? 'var(--text-0, #f9fafb)' : 'var(--text-1, #e0e0e0)' }}>
          {title}
        </div>
        <div style={{ color: 'var(--text-3, #6b7280)', flexShrink: 0 }}>
          <IconChevron open={open} size={15} />
        </div>
      </button>

      {/* Body — visible only when open */}
      {open && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ paddingTop: 14 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Relative time helper ──────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + ' min ago'
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h ago'
  const days = Math.floor(hrs / 24)
  return days + 'd ago'
}

// ── Main component ─────────────────────────────────────────────────────────────

interface TradingViewConnectProps {
  onClose: () => void
}

export default function TradingViewConnect({ onClose }: TradingViewConnectProps) {
  const { token } = useAuth()
  const [webhookToken, setWebhookToken] = useState<WebhookToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const webhookUrl = webhookToken
    ? API_BASE + '/api/webhook/tv/' + webhookToken.token
    : ''

  const loadToken = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_BASE + '/api/webhooks/tokens', {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!res.ok) throw new Error('Failed to load tokens (' + res.status + ')')
      const data = await res.json()
      const list: WebhookToken[] = Array.isArray(data) ? data : (data.tokens ?? [])
      const active = list.find((t: WebhookToken) => t.is_active)

      if (active) {
        setWebhookToken(active)
      } else {
        const create = await fetch(API_BASE + '/api/webhooks/tokens', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ label: 'TradingView' }),
        })
        if (!create.ok) throw new Error('Failed to create token (' + create.status + ')')
        const created = await create.json()
        const tok: WebhookToken = created.token ?? created
        setWebhookToken(tok)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadToken()
  }, [loadToken])

  // Escape key closes — but clicking the backdrop does NOT close the dialog
  // so users don't accidentally lose their place during setup.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDisconnect = async () => {
    if (!token || !webhookToken) return
    setDisconnecting(true)
    try {
      await fetch(API_BASE + '/api/webhooks/tokens/' + webhookToken.id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      })
      setWebhookToken(null)
      setShowDisconnectConfirm(false)
    } catch {
      // silent
    } finally {
      setDisconnecting(false)
    }
  }

  // ── Templates ────────────────────────────────────────────────────────────────

  const jsonTemplate = `{
  "ticker": "{{ticker}}",
  "action": "buy",
  "price": {{close}},
  "qty": 1,
  "strategy": "My Strategy"
}`

  // Pine Script v5 template — fires alert with proper JSON payload
  const pineTemplate = `//@version=5
strategy("TradVue Auto-Import", overlay=true)

// ── Your strategy logic here ──────────────────────────────
longCondition  = ta.crossover(ta.sma(close, 10), ta.sma(close, 20))
shortCondition = ta.crossunder(ta.sma(close, 10), ta.sma(close, 20))

// ── Entry orders ──────────────────────────────────────────
if longCondition
    strategy.entry("Long", strategy.long, qty=1,
        alert_message='{"ticker":"' + syminfo.ticker + '","action":"buy","price":' + str.tostring(close) + ',"qty":1,"strategy":"TradVue Auto-Import"}')

if shortCondition
    strategy.entry("Short", strategy.short, qty=1,
        alert_message='{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close) + ',"qty":1,"strategy":"TradVue Auto-Import"}')`

  const pineAlertTemplate = `//@version=5
indicator("TradVue Alert", overlay=true)

// ── Your condition ────────────────────────────────────────
buySignal  = ta.crossover(ta.sma(close, 10), ta.sma(close, 20))
sellSignal = ta.crossunder(ta.sma(close, 10), ta.sma(close, 20))

// ── Plot signals ──────────────────────────────────────────
plotshape(buySignal,  style=shape.arrowup,   color=color.green, location=location.belowbar)
plotshape(sellSignal, style=shape.arrowdown, color=color.red,   location=location.abovebar)

// ── Alert conditions ──────────────────────────────────────
// In TradingView → Create Alert → Message, use:
// {"ticker":"{{ticker}}","action":"buy","price":{{close}},"qty":1,"strategy":"TradVue"}
alertcondition(buySignal,  title="Buy Signal",  message='{"ticker":"{{ticker}}","action":"buy","price":{{close}},"qty":1,"strategy":"TradVue"}')
alertcondition(sellSignal, title="Sell Signal", message='{"ticker":"{{ticker}}","action":"sell","price":{{close}},"qty":1,"strategy":"TradVue"}')`

  return (
    <div
      // Backdrop — clicking does NOT close. Use the X button to dismiss.
      // This prevents accidentally losing your place while following the setup steps.
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        overflowY: 'auto',
      }}
    >
      <div style={{
        background: 'var(--bg-2, #111118)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 700,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 24px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(74,158,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(74,158,255,0.15)',
              border: '1px solid rgba(74,158,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--blue, #4a9eff)',
            }}>
              <IconTV size={20} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-0, #f9fafb)', letterSpacing: '-0.01em' }}>
                Connect TradingView
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3, #6b7280)', marginTop: 2 }}>
                Auto-import trades directly from TradingView alerts
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-2, #9ca3af)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Plain-English Explanation ────────────────────────────────── */}
          <div style={{
            padding: '16px 18px',
            background: 'rgba(74,158,255,0.06)',
            border: '1px solid rgba(74,158,255,0.18)',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0, #f9fafb)', marginBottom: 8 }}>
              How this works
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1, #e0e0e0)', lineHeight: 1.7 }}>
              Every time one of your TradingView alerts fires, TradingView will automatically send the trade details
              to TradVue — no manual entry needed. You set the alert once in TradingView, and from then on your
              trades land in your journal the moment the alert triggers, 24/7.
            </p>
          </div>

          {/* ── Requirements ────────────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #6b7280)', marginBottom: 10 }}>
              Before you start
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { ok: true,  label: 'TradingView account', note: 'Free or paid' },
                { ok: false, label: 'TradingView Pro, Pro+, or Premium', note: 'Webhook URL alerts require a paid TradingView plan' },
                { ok: true,  label: 'Active TradVue account', note: 'You\'re already logged in ✓' },
              ].map((req, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 14px',
                  background: req.ok ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                  border: '1px solid ' + (req.ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'),
                  borderRadius: 8,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{req.ok ? '✓' : '⚠️'}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: req.ok ? 'var(--green, #10b981)' : '#f59e0b' }}>
                      {req.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3, #6b7280)', marginLeft: 8 }}>{req.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Webhook URL ─────────────────────────────────────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #6b7280)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconLink size={12} />
              Your Webhook URL
            </div>

            {loading && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-2, #9ca3af)', fontSize: 13 }}>
                Generating your unique URL...
              </div>
            )}

            {error && !loading && (
              <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#ef4444' }}>
                <IconAlert size={14} />
                {error}
                <button onClick={loadToken} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, padding: '3px 10px', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && webhookToken && (
              <>
                <CopyBox value={webhookUrl} />
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3, #6b7280)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  This URL is unique to your account. Do not share it.
                </div>
              </>
            )}

            {!loading && !error && !webhookToken && (
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 13, color: 'var(--text-2, #9ca3af)' }}>
                No webhook URL active.{' '}
                <button onClick={loadToken} style={{ background: 'none', border: 'none', color: 'var(--blue, #4a9eff)', cursor: 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline' }}>
                  Generate one
                </button>
              </div>
            )}
          </div>

          {/* ── Connection Status ────────────────────────────────────────── */}
          {!loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: webhookToken ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
              border: '1px solid ' + (webhookToken ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'),
              borderRadius: 10,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: webhookToken ? 'var(--green, #10b981)' : 'var(--text-3, #6b7280)',
                flexShrink: 0,
                boxShadow: webhookToken ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
              }} />
              <div style={{ fontSize: 13, color: webhookToken ? 'var(--green, #10b981)' : 'var(--text-2, #9ca3af)', fontWeight: 600 }}>
                {webhookToken ? 'Connected' : 'Not connected'}
              </div>
              {webhookToken && webhookToken.last_used_at && (
                <div style={{ fontSize: 12, color: 'var(--text-3, #6b7280)', marginLeft: 'auto' }}>
                  Last received: {relativeTime(webhookToken.last_used_at)}
                </div>
              )}
              {webhookToken && !webhookToken.last_used_at && (
                <div style={{ fontSize: 12, color: 'var(--text-3, #6b7280)', marginLeft: 'auto' }}>
                  No events yet — fire your first alert to test
                </div>
              )}
            </div>
          )}

          {/* ── Setup Guide: 3 independent expandable steps ─────────────── */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3, #6b7280)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              3-Step Setup — click any step to expand or collapse
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Step 1 */}
              <StepCard number={1} title="Open TradingView and create a new alert" defaultOpen={true}>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                  Go to <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>TradingView.com</strong> and open any chart.
                  Click the <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>clock icon</strong> in the right panel —
                  or right-click anywhere on the chart and choose{' '}
                  <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>"Add Alert"</strong>.
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                  Set your condition (price cross, indicator trigger, strategy signal — anything works).
                  Leave the alert dialog open and move to Step 2.
                </p>
              </StepCard>

              {/* Step 2 */}
              <StepCard number={2} title="Paste your webhook URL and message template" defaultOpen={true}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                      In the alert dialog, go to <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>Notifications</strong>,
                      check <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>Webhook URL</strong>, and paste your URL:
                    </p>
                    {webhookUrl ? (
                      <CopyBox value={webhookUrl} compact />
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-3, #6b7280)', fontFamily: 'var(--mono, monospace)' }}>
                        [Your webhook URL will appear once connected above]
                      </div>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                      In the <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>Message</strong> field, paste one of these templates:
                    </p>

                    {/* Pine Script templates — prominent section */}
                    <div style={{ marginBottom: 14, padding: '14px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                        </svg>
                        Pine Script Templates
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                        If you&apos;re writing a Pine Script strategy or indicator, use one of these templates to fire
                        alerts with the correct JSON payload automatically.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <CopyCode code={pineTemplate} label="Strategy (strategy.entry with alert_message)" />
                        <CopyCode code={pineAlertTemplate} label="Indicator (alertcondition)" />
                      </div>
                    </div>

                    {/* Plain JSON template */}
                    <CopyCode code={jsonTemplate} label="Alert message JSON (for non-Pine-Script alerts)" />

                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 12, color: 'var(--text-1, #e0e0e0)', lineHeight: 1.6 }}>
                      <strong style={{ color: '#f59e0b' }}>Tip:</strong> Change{' '}
                      <code style={{ fontFamily: 'var(--mono, monospace)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>"action"</code>{' '}
                      to <code style={{ fontFamily: 'var(--mono, monospace)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>"sell"</code>{' '}
                      for sell alerts. Adjust{' '}
                      <code style={{ fontFamily: 'var(--mono, monospace)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>qty</code>{' '}
                      to match your position size.
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3, #6b7280)', lineHeight: 1.6 }}>
                      Available TradingView variables:{' '}
                      {['{{ticker}}', '{{close}}', '{{open}}', '{{high}}', '{{low}}', '{{volume}}', '{{time}}'].map((v) => (
                        <code key={v} style={{ fontFamily: 'var(--mono, monospace)', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4, marginRight: 4, display: 'inline-block', marginBottom: 4 }}>
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </StepCard>

              {/* Step 3 */}
              <StepCard number={3} title="Save the alert — you're done" defaultOpen={true}>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-2, #9ca3af)', lineHeight: 1.6 }}>
                  Click <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>Create</strong> (or Save) in TradingView.
                  That&apos;s it — from now on, every time that alert fires, TradingView will send the trade data
                  to TradVue and it will appear in your{' '}
                  <strong style={{ color: 'var(--text-1, #e0e0e0)' }}>Trade Log</strong> within seconds.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'No manual entry needed',
                    'Runs 24/7 — even when you\'re away',
                    'Works with any alert type: price, indicator, Pine Script strategy',
                    'Repeating alerts create a new journal entry each time',
                  ].map((line, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--green, #10b981)' }}>
                      <IconCheck size={13} />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </StepCard>

            </div>
          </div>

          {/* ── Disconnect ───────────────────────────────────────────────── */}
          {webhookToken && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
              {!showDisconnectConfirm ? (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3, #6b7280)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  <IconTrash size={13} />
                  Disconnect TradingView
                </button>
              ) : (
                <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 6 }}>Are you sure?</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2, #9ca3af)', marginBottom: 12, lineHeight: 1.5 }}>
                    This will revoke your webhook URL and stop auto-importing trades from TradingView.
                    You can reconnect at any time.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      style={{
                        background: 'rgba(239,68,68,0.2)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: 8,
                        padding: '7px 16px',
                        color: '#ef4444',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: disconnecting ? 'not-allowed' : 'pointer',
                        opacity: disconnecting ? 0.6 : 1,
                      }}
                    >
                      {disconnecting ? 'Disconnecting...' : 'Yes, disconnect'}
                    </button>
                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      style={{
                        background: 'var(--bg-1, #1a1a2e)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '7px 16px',
                        color: 'var(--text-0, #f9fafb)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Security disclaimer ─────────────────────────────────────── */}
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 1 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-3)', lineHeight: 1.6 }}>
                TradVue only receives trade data sent by your alerts. We cannot access your TradingView account, broker account, place trades, or modify positions. Your broker credentials are never shared with TradVue. All data is transmitted over HTTPS. See our{' '}
                <a href="/legal/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Re-usable trigger button ──────────────────────────────────────────────────

export function TradingViewConnectButton({
  onOpen,
  compact,
}: {
  onOpen: () => void
  compact?: boolean
}) {
  return (
    <button
      onClick={onOpen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'transparent',
        border: '1px solid rgba(74,158,255,0.45)',
        borderRadius: 'var(--btn-radius, 8px)',
        padding: compact ? '7px 14px' : '9px 18px',
        color: 'var(--blue, #4a9eff)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(74,158,255,0.1)'
        e.currentTarget.style.borderColor = 'rgba(74,158,255,0.7)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'rgba(74,158,255,0.45)'
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
      Connect TradingView
    </button>
  )
}
