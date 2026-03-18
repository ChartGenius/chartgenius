'use client'

/**
 * /integrations — TradVue Integration Settings
 *
 * Sections:
 *   1. Webhook URL (generate, copy, rotate, delete)
 *   2. Quick Setup Guide (step-by-step accordion + Test Connection)
 *   3. Alert Message Templates (strategy + simple, with copy)
 *   4. Pine Script Templates (copy-ready scripts with How-to)
 *   5. Recent Events Log (auto-refresh every 30s)
 *   6. Token Management (multiple tokens list)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { API_BASE } from '../lib/api'
import PersistentNav from '../components/PersistentNav'

// ── Types ──────────────────────────────────────────────────────────────────────

interface WebhookToken {
  id: number
  token: string
  label: string
  source: string
  is_active: boolean
  last_used_at: string | null
  trade_count: number
  created_at: string
}

interface WebhookEvent {
  id: number
  token_id: number
  source_ip: string
  parsed_ticker: string | null
  parsed_action: string | null
  parsed_price: number | null
  parsed_quantity: number | null
  trade_id: number | null
  status: 'received' | 'matched' | 'ignored' | 'error' | 'test'
  error_message: string | null
  created_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const WEBHOOK_BASE = 'https://tradvue-api.onrender.com/api/webhook/tv'

const STRATEGY_TEMPLATE = `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{strategy.order.price}},
  "quantity": {{strategy.order.contracts}},
  "position": "{{strategy.market_position}}",
  "order_id": "{{strategy.order.id}}",
  "comment": "{{strategy.order.comment}}"
}`

const SIMPLE_TEMPLATE = `{
  "ticker": "{{ticker}}",
  "action": "buy",
  "price": {{close}}
}`

// ── Pine Script Templates ──────────────────────────────────────────────────────

const MA_CROSSOVER_SCRIPT = `//@version=6
// @strategy_alert_message {{strategy.order.alert_message}}

strategy(
    title       = "TradVue — EMA Crossover",
    shorttitle  = "TV EMA Cross",
    overlay     = true,
    default_qty_type  = strategy.percent_of_equity,
    default_qty_value = 10,
    initial_capital   = 10000,
    commission_type   = strategy.commission.percent,
    commission_value  = 0.1
)

fastLen  = input.int(9,  title="Fast EMA Period", minval=1, maxval=200)
slowLen  = input.int(21, title="Slow EMA Period", minval=1, maxval=200)
showEMAs = input.bool(true, title="Show EMAs on Chart")

emaFast = ta.ema(close, fastLen)
emaSlow = ta.ema(close, slowLen)

plot(showEMAs ? emaFast : na, title="EMA Fast", color=color.new(color.lime, 0),   linewidth=2)
plot(showEMAs ? emaSlow : na, title="EMA Slow", color=color.new(color.orange, 0), linewidth=2)

bullCross = ta.crossover(emaFast, emaSlow)
bearCross = ta.crossunder(emaFast, emaSlow)

// === TradVue Auto-Journal Integration ===
longMsg      = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"long","strategy":"EMA Crossover"}'
shortMsg     = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"short","strategy":"EMA Crossover"}'
exitLongMsg  = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"flat","strategy":"EMA Crossover"}'
exitShortMsg = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"flat","strategy":"EMA Crossover"}'

if bullCross
    strategy.close("Short", alert_message=exitShortMsg)
    strategy.entry("Long",  strategy.long,  alert_message=longMsg)

if bearCross
    strategy.close("Long",  alert_message=exitLongMsg)
    strategy.entry("Short", strategy.short, alert_message=shortMsg)

plotshape(bullCross, title="Bull Cross", style=shape.triangleup,   location=location.belowbar, color=color.new(color.lime, 0), size=size.small)
plotshape(bearCross, title="Bear Cross", style=shape.triangledown, location=location.abovebar, color=color.new(color.red,  0), size=size.small)`

const RSI_SCRIPT = `//@version=6
// @strategy_alert_message {{strategy.order.alert_message}}

strategy(
    title       = "TradVue — RSI Strategy",
    shorttitle  = "TV RSI",
    overlay     = false,
    default_qty_type  = strategy.percent_of_equity,
    default_qty_value = 10,
    initial_capital   = 10000,
    commission_type   = strategy.commission.percent,
    commission_value  = 0.1
)

rsiLen     = input.int(14, title="RSI Length", minval=1, maxval=100)
oversold   = input.int(30,  title="Oversold Level",   minval=1,  maxval=49)
overbought = input.int(70,  title="Overbought Level", minval=51, maxval=99)
useShorts  = input.bool(true, title="Enable Short Trades")

rsiVal = ta.rsi(close, rsiLen)

plot(rsiVal, title="RSI", color=color.new(color.purple, 0), linewidth=2)
hline(overbought, "Overbought", color=color.new(color.red,  30), linestyle=hline.style_dashed)
hline(oversold,   "Oversold",   color=color.new(color.lime, 30), linestyle=hline.style_dashed)

enterLong  = ta.crossover(rsiVal, oversold)
enterShort = ta.crossunder(rsiVal, overbought)
exitLong   = rsiVal >= overbought
exitShort  = rsiVal <= oversold

// === TradVue Auto-Journal Integration ===
longMsg      = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"long","strategy":"RSI"}'
shortMsg     = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"short","strategy":"RSI"}'
exitLongMsg  = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"flat","strategy":"RSI"}'
exitShortMsg = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"flat","strategy":"RSI"}'

if enterLong
    strategy.entry("Long", strategy.long, alert_message=longMsg)

if exitLong and strategy.position_size > 0
    strategy.close("Long", alert_message=exitLongMsg)

if useShorts
    if enterShort
        strategy.entry("Short", strategy.short, alert_message=shortMsg)
    if exitShort and strategy.position_size < 0
        strategy.close("Short", alert_message=exitShortMsg)`

const VWAP_SCRIPT = `//@version=6
// @strategy_alert_message {{strategy.order.alert_message}}

strategy(
    title       = "TradVue — VWAP Bounce",
    shorttitle  = "TV VWAP",
    overlay     = true,
    default_qty_type  = strategy.percent_of_equity,
    default_qty_value = 10,
    initial_capital   = 10000,
    commission_type   = strategy.commission.percent,
    commission_value  = 0.1
)

atrLen       = input.int(14,    title="ATR Length",            minval=1)
atrMult      = input.float(1.5, title="ATR Stop Multiplier",   minval=0.1, step=0.1)
bounceBuffer = input.float(0.1, title="VWAP Bounce Buffer %",  minval=0.0, step=0.05)
useShorts    = input.bool(true, title="Enable Short Trades")

vwapVal = ta.vwap(hlc3)
atrVal  = ta.atr(atrLen)
buffer  = vwapVal * (bounceBuffer / 100)

plot(vwapVal, title="VWAP", color=color.new(color.blue, 0), linewidth=2)
plot(vwapVal + buffer, title="VWAP Upper Buffer", color=color.new(color.blue, 70), linewidth=1, style=plot.style_stepline)
plot(vwapVal - buffer, title="VWAP Lower Buffer", color=color.new(color.blue, 70), linewidth=1, style=plot.style_stepline)

wasBelow    = close[1] < (vwapVal - buffer)
nowAbove    = close    > (vwapVal + buffer)
longSignal  = wasBelow and nowAbove

wasAbove    = close[1] > (vwapVal + buffer)
nowBelow    = close    < (vwapVal - buffer)
shortSignal = wasAbove and nowBelow

longStop    = close - (atrVal * atrMult)
shortStop   = close + (atrVal * atrMult)

// === TradVue Auto-Journal Integration ===
longMsg      = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"long","strategy":"VWAP Bounce"}'
shortMsg     = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"short","strategy":"VWAP Bounce"}'
exitLongMsg  = '{"ticker":"' + syminfo.ticker + '","action":"sell","price":' + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(strategy.position_size)          + ',"position":"flat","strategy":"VWAP Bounce"}'
exitShortMsg = '{"ticker":"' + syminfo.ticker + '","action":"buy","price":'  + str.tostring(close, "#.##") + ',"quantity":' + str.tostring(math.abs(strategy.position_size)) + ',"position":"flat","strategy":"VWAP Bounce"}'

if longSignal
    strategy.entry("Long",     strategy.long,  alert_message=longMsg)
    strategy.exit("Long SL",   from_entry="Long",  stop=longStop,  alert_message=exitLongMsg)

if useShorts and shortSignal
    strategy.entry("Short",    strategy.short, alert_message=shortMsg)
    strategy.exit("Short SL",  from_entry="Short", stop=shortStop, alert_message=exitShortMsg)

plotshape(longSignal,              title="Long Signal",  style=shape.triangleup,   location=location.belowbar, color=color.new(color.lime, 0), size=size.small)
plotshape(useShorts and shortSignal, title="Short Signal", style=shape.triangledown, location=location.abovebar, color=color.new(color.red,  0), size=size.small)`

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function maskToken(token: string): string {
  return token.slice(0, 6) + '...'
}

// ── Reusable components ────────────────────────────────────────────────────────

function SectionCard({ title, children, subtitle }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-1, #1a1a2e)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '24px 20px',
      marginBottom: 20,
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-3, #6b7280)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-2, #9ca3af)', margin: '6px 0 0', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    green:  { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   text: '#4ade80' },
    yellow: { bg: 'rgba(234,179,8,0.12)',   border: 'rgba(234,179,8,0.3)',   text: '#fbbf24' },
    red:    { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
    blue:   { bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.3)',  text: '#a78bfa' },
    teal:   { bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  text: '#2dd4bf' },
    gray:   { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: '#9ca3af' },
  }
  const c = colorMap[color] || colorMap.gray
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: 20,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function InlineButton({
  onClick, disabled, variant = 'default', children, small,
}: {
  onClick: () => void; disabled?: boolean; variant?: 'default' | 'danger' | 'primary' | 'ghost';
  children: React.ReactNode; small?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-1, #e5e7eb)' },
    primary: { background: 'rgba(99,102,241,0.2)',   border: '1px solid rgba(99,102,241,0.4)',   color: '#a78bfa' },
    danger:  { background: 'rgba(248,113,113,0.1)',  border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' },
    ghost:   { background: 'transparent',            border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-2, #9ca3af)' },
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '6px 12px' : '8px 14px',
      borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.15s', ...styles[variant],
    }}>
      {children}
    </button>
  )
}

// ── Copy hook ──────────────────────────────────────────────────────────────────

function useCopyText() {
  const { showToast } = useToast()
  return useCallback(async (text: string, label = 'Copied!') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    }
    showToast(label, 'success', 2500)
  }, [showToast])
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 1: Webhook URL
// ══════════════════════════════════════════════════════════════════════════════

function WebhookURLSection({ tokens, loading, onGenerate, onRotate, onDelete, generating }: {
  tokens: WebhookToken[]; loading: boolean; onGenerate: () => void;
  onRotate: (id: number) => void; onDelete: (id: number) => void; generating: boolean;
}) {
  const copyText = useCopyText()
  const [rotateConfirm, setRotateConfirm] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const primaryToken = tokens.find(t => t.is_active) || tokens[0]
  const webhookUrl = primaryToken ? `${WEBHOOK_BASE}/${primaryToken.token}` : null

  function getStatus(tk: WebhookToken) {
    if (!tk.is_active) return { icon: '🔴', label: 'Disabled' }
    if (!tk.last_used_at) return { icon: '🟡', label: 'Never used' }
    return { icon: '🟢', label: `Active · Last event ${timeAgo(tk.last_used_at)}` }
  }

  if (loading) return (
    <SectionCard title="Your Webhook URL">
      <div style={{ color: 'var(--text-2)', fontSize: 14 }}>Loading…</div>
    </SectionCard>
  )

  return (
    <SectionCard title="Your Webhook URL" subtitle="Paste this URL into TradingView when creating an alert.">
      {!primaryToken ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>
            No webhook URL yet. Generate one to get started.
          </p>
          <button onClick={onGenerate} disabled={generating} style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: generating ? 'wait' : 'pointer',
          }}>
            {generating ? 'Generating…' : '⚡ Generate Webhook URL'}
          </button>
        </div>
      ) : (
        <>
          {(() => {
            const s = getStatus(primaryToken)
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.label}</span>
              </div>
            )
          })()}

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <code style={{ flex: 1, fontSize: 12, color: '#a78bfa', fontFamily: 'monospace', wordBreak: 'break-all', minWidth: 0 }}>
              {webhookUrl}
            </code>
            <button onClick={() => copyText(webhookUrl!, 'Webhook URL copied!')} style={{
              flexShrink: 0, padding: '7px 14px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              📋 Copy URL
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {rotateConfirm === primaryToken.id ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                padding: '8px 14px',
                background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
                borderRadius: 8, fontSize: 13, color: '#fbbf24',
              }}>
                <span>⚠️ This will break existing TradingView alerts. Sure?</span>
                <button onClick={() => { onRotate(primaryToken.id); setRotateConfirm(null) }} style={{
                  padding: '4px 12px', background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)',
                  borderRadius: 6, color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Yes, rotate</button>
                <button onClick={() => setRotateConfirm(null)} style={{
                  padding: '4px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            ) : (
              <InlineButton onClick={() => setRotateConfirm(primaryToken.id)} variant="ghost">
                🔄 Rotate URL
              </InlineButton>
            )}

            {deleteConfirm === primaryToken.id ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                padding: '8px 14px',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 8, fontSize: 13, color: '#f87171',
              }}>
                <span>Delete this token? You&apos;ll lose your webhook URL.</span>
                <button onClick={() => { onDelete(primaryToken.id); setDeleteConfirm(null) }} style={{
                  padding: '4px 12px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)',
                  borderRadius: 6, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Delete</button>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  padding: '4px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            ) : (
              <InlineButton onClick={() => setDeleteConfirm(primaryToken.id)} variant="danger">
                🗑 Delete
              </InlineButton>
            )}
          </div>
        </>
      )}
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 2: Quick Setup Guide + Test Connection
// ══════════════════════════════════════════════════════════════════════════════

const SETUP_STEPS = [
  { n: 1, title: 'Open TradingView and add a strategy to your chart', body: 'Load any chart and apply a Pine Script strategy or indicator you want to alert on. Need a ready-to-use script? Check the Pine Script Templates section below.' },
  { n: 2, title: 'Click "Create Alert" (⏰ icon or right-click → Add Alert)', body: 'You can also press Alt+A on Windows / Option+A on Mac.' },
  { n: 3, title: 'Check the "Webhook URL" checkbox', body: 'In the "Notifications" tab of the Alert dialog, enable the Webhook URL option.' },
  { n: 4, title: 'Paste your TradVue webhook URL', body: 'Copy the URL from the section above and paste it into the Webhook URL field.' },
  { n: 5, title: 'Set the alert message to {{strategy.order.alert_message}}', body: 'In the "Message" field, type exactly: {{strategy.order.alert_message}} — TradingView will substitute the right JSON for each order automatically.', hasTemplate: true },
  { n: 6, title: 'Click "Create" — you\'re done!', body: 'TradingView will now send alerts to TradVue whenever your strategy fires. Trades will auto-journal.' },
]

function SetupGuideSection({ authToken, onTestSuccess }: { authToken: string; onTestSuccess: () => void }) {
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const copyText = useCopyText()

  async function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test failed')
      setTestResult({ ok: true, message: data.message || 'Test event created! Check the events log below.' })
      onTestSuccess()
    } catch (err: unknown) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Test failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <SectionCard title="Quick Setup Guide" subtitle="Get connected to TradingView in under 5 minutes.">
      <div style={{ padding: '10px 14px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, fontSize: 12, color: '#fbbf24', marginBottom: 16 }}>
        ⚠️ Webhooks require <strong>TradingView Essential plan or higher</strong>.
      </div>

      {SETUP_STEPS.map(step => (
        <div key={step.n} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setOpenStep(openStep === step.n ? null : step.n)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              color: '#a78bfa', fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{step.n}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-0, #f9fafb)' }}>{step.title}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{openStep === step.n ? '▲' : '▼'}</span>
          </button>

          {openStep === step.n && (
            <div style={{ padding: '0 0 16px 42px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px', lineHeight: 1.6 }}>{step.body}</p>
              {step.hasTemplate && (
                <div style={{ position: 'relative' }}>
                  <pre style={{
                    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#a78bfa',
                    fontFamily: 'monospace', overflowX: 'auto', margin: 0,
                  }}>{'{{strategy.order.alert_message}}'}</pre>
                  <button onClick={() => copyText('{{strategy.order.alert_message}}', 'Template copied!')} style={{
                    position: 'absolute', top: 8, right: 8, padding: '4px 10px',
                    background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
                    borderRadius: 6, color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}>Copy</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Test Connection */}
      <div style={{
        marginTop: 20,
        padding: '16px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)', marginBottom: 4 }}>
              🔌 Test Your Connection
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Send a test event to verify your webhook is working. It will appear in the Events Log below.
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            style={{
              flexShrink: 0,
              padding: '10px 20px',
              background: testing ? 'rgba(99,102,241,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: testing ? '1px solid rgba(99,102,241,0.3)' : 'none',
              borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: testing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {testing ? (
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Testing…</>
            ) : (
              '⚡ Send Test Event'
            )}
          </button>
        </div>

        {testResult && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${testResult.ok ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
            borderRadius: 8,
            fontSize: 13,
            color: testResult.ok ? '#4ade80' : '#f87171',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{testResult.ok ? '✅' : '❌'}</span>
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 3: Alert Message Templates
// ══════════════════════════════════════════════════════════════════════════════

function TemplatesSection() {
  const [activeTab, setActiveTab] = useState<'strategy' | 'simple'>('strategy')
  const copyText = useCopyText()

  const templates = {
    strategy: {
      label: 'Strategy Template', tag: 'Recommended', tagColor: 'blue', code: STRATEGY_TEMPLATE,
      desc: 'Use this with Pine Script strategy orders. Captures order action, price, quantity, and market position automatically from TradingView strategy variables.',
    },
    simple: {
      label: 'Simple Template', tag: 'Manual alerts', tagColor: 'gray', code: SIMPLE_TEMPLATE,
      desc: 'Use this for basic price alerts or indicators without strategy logic. You\'ll need to manually change "buy" to "sell" for sell alerts.',
    },
  }

  const active = templates[activeTab]

  return (
    <SectionCard title="Alert Message Templates" subtitle="Copy and paste into the TradingView alert message field.">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(Object.keys(templates) as Array<'strategy' | 'simple'>).map(key => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            background: activeTab === key ? 'rgba(99,102,241,0.15)' : 'transparent',
            borderColor: activeTab === key ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)',
            color: activeTab === key ? '#a78bfa' : 'var(--text-2)',
          }}>
            {templates[key].label}
            <Badge label={templates[key].tag} color={templates[key].tagColor} />
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '16px 14px', paddingRight: 80,
          fontSize: 12, color: '#a78bfa', fontFamily: 'monospace', overflowX: 'auto', margin: 0, lineHeight: 1.7,
        }}>{active.code}</pre>
        <button onClick={() => copyText(active.code, `${active.label} copied!`)} style={{
          position: 'absolute', top: 10, right: 10, padding: '5px 12px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Copy</button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-1)' }}>When to use:</strong> {active.desc}
      </p>
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 4: Pine Script Templates
// ══════════════════════════════════════════════════════════════════════════════

interface PineTemplate {
  id: string
  name: string
  emoji: string
  description: string
  whatItDoes: string
  difficulty: 'Beginner' | 'Intermediate'
  difficultyColor: string
  script: string
  downloadFile: string
}

const PINE_TEMPLATES: PineTemplate[] = [
  {
    id: 'ma-crossover',
    name: 'Moving Average Crossover',
    emoji: '📊',
    description: 'EMA 9/21 crossover strategy — classic trend-following entry/exit signals.',
    whatItDoes: 'Enters long when the 9-period EMA crosses above the 21-period EMA, and short when it crosses below. Configurable periods. Sends full TradVue JSON with each order.',
    difficulty: 'Beginner',
    difficultyColor: 'green',
    script: MA_CROSSOVER_SCRIPT,
    downloadFile: '/scripts/tradingview-ma-crossover.pine',
  },
  {
    id: 'rsi',
    name: 'RSI Overbought / Oversold',
    emoji: '📈',
    description: 'Mean-reversion strategy using RSI with configurable overbought/oversold levels.',
    whatItDoes: 'Enters long when RSI crosses back above the oversold level (default 30), exits when it reaches overbought (default 70). Reverse for shorts. Ideal for range-bound markets.',
    difficulty: 'Beginner',
    difficultyColor: 'green',
    script: RSI_SCRIPT,
    downloadFile: '/scripts/tradingview-rsi.pine',
  },
  {
    id: 'vwap-bounce',
    name: 'VWAP Bounce',
    emoji: '🎯',
    description: 'Intraday VWAP bounce strategy with ATR-based stop loss.',
    whatItDoes: 'Enters long when price bounces off VWAP from below, short when it rejects from above. Uses an ATR multiplier for dynamic stop placement. Best on 1m–15m intraday charts.',
    difficulty: 'Intermediate',
    difficultyColor: 'yellow',
    script: VWAP_SCRIPT,
    downloadFile: '/scripts/tradingview-vwap-bounce.pine',
  },
]

const HOW_TO_STEPS = [
  { n: 1, text: 'Click "Copy Script" to copy the Pine Script code' },
  { n: 2, text: 'Open TradingView → Pine Editor (bottom panel) → paste the code' },
  { n: 3, text: 'Click "Add to Chart" — the strategy will appear on your chart' },
  { n: 4, text: 'Right-click the strategy → "Add Alert on Strategy"' },
  { n: 5, text: 'In the "Notifications" tab, enable "Webhook URL" and paste your TradVue URL' },
  { n: 6, text: 'Set the Message field to: {{strategy.order.alert_message}}' },
  { n: 7, text: 'Click "Create" — every trade auto-journals in TradVue! 🎉' },
]

function ScriptsSection() {
  const copyText = useCopyText()
  const [expandedHowTo, setExpandedHowTo] = useState<string | null>(null)

  return (
    <SectionCard
      title="Pine Script Templates"
      subtitle="Ready-to-use TradingView strategies with TradVue auto-journaling built in."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PINE_TEMPLATES.map(tpl => (
          <div key={tpl.id} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{tpl.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>
                      {tpl.name}
                    </h3>
                    <Badge label={tpl.difficulty} color={tpl.difficultyColor} />
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {tpl.description}
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text-2)' }}>What it does:</strong> {tpl.whatItDoes}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyText(tpl.script, `${tpl.name} copied!`)}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', borderRadius: 8, color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  📋 Copy Script
                </button>
                <a
                  href={tpl.downloadFile}
                  download
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, color: 'var(--text-1)',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  ⬇ Download .pine
                </a>
                <button
                  onClick={() => setExpandedHowTo(expandedHowTo === tpl.id ? null : tpl.id)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, color: 'var(--text-2)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {expandedHowTo === tpl.id ? '▲ Hide' : '▼ How to Use'}
                </button>
              </div>
            </div>

            {/* How to Use accordion */}
            {expandedHowTo === tpl.id && (
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.07)',
                padding: '16px 18px',
                background: 'rgba(99,102,241,0.04)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>
                  How to use with TradVue:
                </div>
                <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {HOW_TO_STEPS.map(step => (
                    <li key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)',
                        color: '#a78bfa', fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{step.n}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, paddingTop: 2 }}>
                        {step.n === 6 ? (
                          <>Set the Message field to:{' '}
                            <code style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 4 }}>
                              {'{{strategy.order.alert_message}}'}
                            </code>
                          </>
                        ) : step.text}
                      </span>
                    </li>
                  ))}
                </ol>
                <div style={{
                  marginTop: 14, padding: '10px 14px',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 8, fontSize: 12, color: '#4ade80',
                }}>
                  💡 <strong>Tip:</strong> Use the &ldquo;Send Test Event&rdquo; button in the Setup Guide above to verify your webhook before going live.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 5: Recent Events Log
// ══════════════════════════════════════════════════════════════════════════════

function EventsSection({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/events?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load events')
      const data = await res.json()
      setEvents(data.events || [])
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents, refreshKey])

  useEffect(() => {
    intervalRef.current = setInterval(() => { if (!document.hidden) fetchEvents() }, 30000)
    const onVisibility = () => { if (!document.hidden) fetchEvents() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchEvents])

  function statusBadge(status: WebhookEvent['status']) {
    const map: Record<string, { icon: string; label: string; color: string }> = {
      matched:  { icon: '✅', label: 'Matched',   color: 'green' },
      received: { icon: '⏳', label: 'Received',  color: 'blue' },
      ignored:  { icon: '⚠️', label: 'Unmatched', color: 'yellow' },
      error:    { icon: '❌', label: 'Error',      color: 'red' },
      test:     { icon: '🔌', label: 'Test',       color: 'teal' },
    }
    const s = map[status] || map.ignored
    return <Badge label={`${s.icon} ${s.label}`} color={s.color} />
  }

  return (
    <SectionCard title="Recent Events" subtitle="Last 50 webhook events received. Refreshes every 30 seconds.">
      {loading ? (
        <div style={{ color: 'var(--text-2)', fontSize: 14 }}>Loading events…</div>
      ) : error ? (
        <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-2)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <p style={{ margin: 0 }}>No webhook events yet. Use &ldquo;Send Test Event&rdquo; above to verify your setup, or fire an alert from TradingView.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Time', 'Ticker', 'Action', 'Price', 'Status', 'Trade'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 50).map((ev, i) => (
                <tr key={ev.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '10px 10px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{timeAgo(ev.created_at)}</td>
                  <td style={{ padding: '10px 10px', fontWeight: 600, color: 'var(--text-0)' }}>{ev.parsed_ticker || '—'}</td>
                  <td style={{ padding: '10px 10px' }}>
                    {ev.parsed_action ? (
                      <span style={{ fontWeight: 700, color: ev.parsed_action === 'buy' ? '#4ade80' : '#f87171', textTransform: 'capitalize' }}>
                        {ev.parsed_action === 'buy' ? '▲ Buy' : '▼ Sell'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 10px', color: 'var(--text-1)', fontFamily: 'monospace', fontSize: 12 }}>
                    {ev.parsed_price != null ? `$${ev.parsed_price.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '10px 10px' }}>{statusBadge(ev.status)}</td>
                  <td style={{ padding: '10px 10px' }}>
                    {ev.trade_id ? (
                      <a href={`/journal?trade=${ev.trade_id}`} style={{ color: '#a78bfa', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>View →</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 6: Token Management (multi-token)
// ══════════════════════════════════════════════════════════════════════════════

function TokenManagementSection({ tokens, onDelete, onGenerate, generating }: {
  tokens: WebhookToken[]; onDelete: (id: number) => void; onGenerate: () => void; generating: boolean;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  if (tokens.length <= 1) return null

  return (
    <SectionCard title="Token Management" subtitle={`You have ${tokens.length} webhook token${tokens.length !== 1 ? 's' : ''}. Max 5 per account.`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tokens.map(tk => (
          <div key={tk.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', marginBottom: 2 }}>{tk.label}</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)' }}>{maskToken(tk.token)}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {tk.last_used_at ? timeAgo(tk.last_used_at) : 'Never used'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {tk.trade_count} trade{tk.trade_count !== 1 ? 's' : ''}
            </div>
            <Badge label={tk.is_active ? '🟢 Active' : '🔴 Inactive'} color={tk.is_active ? 'green' : 'red'} />
            {deleteConfirm === tk.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { onDelete(tk.id); setDeleteConfirm(null) }} style={{
                  padding: '4px 10px', background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.4)',
                  borderRadius: 6, color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Confirm</button>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  padding: '4px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                }}>Cancel</button>
              </div>
            ) : (
              <InlineButton onClick={() => setDeleteConfirm(tk.id)} variant="danger" small>Delete</InlineButton>
            )}
          </div>
        ))}
      </div>
      {tokens.length < 5 && (
        <button onClick={onGenerate} disabled={generating} style={{
          marginTop: 14, padding: '8px 16px',
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 10, color: '#a78bfa', fontSize: 13, fontWeight: 600,
          cursor: generating ? 'wait' : 'pointer',
        }}>
          {generating ? 'Generating…' : '+ Add Another Token'}
        </button>
      )}
    </SectionCard>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════

export default function IntegrationsPage() {
  const router = useRouter()
  const { user, token, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [tokens, setTokens] = useState<WebhookToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0)

  const fetchTokens = useCallback(async () => {
    if (!token) return
    setTokensLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/tokens`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load tokens')
      const data = await res.json()
      setTokens(data.tokens || [])
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load tokens', 'error')
    } finally {
      setTokensLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    if (!authLoading && token) fetchTokens()
    else if (!authLoading) setTokensLoading(false)
  }, [authLoading, token, fetchTokens])

  async function handleGenerate() {
    if (!token) return
    setGenerating(true)
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: 'TradingView' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate token')
      showToast('Webhook URL generated!', 'success')
      await fetchTokens()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to generate token', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRotate(id: number) {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/tokens/${id}/rotate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to rotate token')
      showToast('Webhook URL rotated! Update your TradingView alerts.', 'warning', 6000)
      await fetchTokens()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to rotate token', 'error')
    }
  }

  async function handleDelete(id: number) {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/webhooks/tokens/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete token')
      }
      showToast('Webhook token deleted', 'success')
      await fetchTokens()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete token', 'error')
    }
  }

  if (authLoading) {
    return (
      <div style={pageStyle}>
        <PersistentNav />
        <div style={{ color: 'var(--text-2)', padding: '80px 0', textAlign: 'center' }}>Loading…</div>
      </div>
    )
  }

  if (!user || !token) {
    return (
      <div style={pageStyle}>
        <PersistentNav />
        <div style={{ maxWidth: 440, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-0)', marginBottom: 12 }}>
            Sign in to access Integrations
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24 }}>
            You need to be signed in to manage your webhook integrations.
          </p>
          <button onClick={() => router.push('/')} style={primaryBtnStyle}>Go to sign in →</button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <PersistentNav />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>📡</span>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)', letterSpacing: '-0.02em', margin: 0 }}>
              Integrations
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
            Connect TradingView to auto-journal your trades via webhook alerts.
          </p>
        </div>

        {/* TradingView card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, marginBottom: 20,
        }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>TradingView</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Webhook Integration</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Badge
              label={tokens.some(t => t.is_active) ? '🟢 Connected' : '⚪ Not connected'}
              color={tokens.some(t => t.is_active) ? 'green' : 'gray'}
            />
          </div>
        </div>

        <WebhookURLSection tokens={tokens} loading={tokensLoading} onGenerate={handleGenerate} onRotate={handleRotate} onDelete={handleDelete} generating={generating} />
        <SetupGuideSection authToken={token} onTestSuccess={() => setEventsRefreshKey(k => k + 1)} />
        <TemplatesSection />
        <ScriptsSection />
        <EventsSection token={token} refreshKey={eventsRefreshKey} />
        <TokenManagementSection tokens={tokens} onDelete={handleDelete} onGenerate={handleGenerate} generating={generating} />

        {/* Footer */}
        <div style={{ marginTop: 32, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
            Webhook alerts are processed in real-time. TradingView requires the Essential plan or higher for webhook functionality.
            Your webhook URL is private — do not share it. If compromised, use &ldquo;Rotate URL&rdquo; to generate a new one.
            This is not financial advice.
          </p>
        </div>

      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: 'var(--bg-0, #111827)' }

const primaryBtnStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '13px 20px',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
}
