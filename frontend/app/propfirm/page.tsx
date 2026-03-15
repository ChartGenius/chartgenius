'use client'

import { useState, useEffect, useCallback } from 'react'
import PersistentNav from '../components/PersistentNav'
import { IconTarget } from '../components/Icons'
import {
  loadPropFirmAccounts,
  addPropFirmAccount,
  updatePropFirmAccount,
  deletePropFirmAccount,
  getDrawdownUsedPct,
  getProfitPct,
  getDailyLossPct,
  getDrawdownColor,
  getPhaseLabel,
  getStatusLabel,
  getStatusColor,
  type PropFirmAccount,
  type PropFirmRules,
  type FirmId,
  type PhaseId,
  type AccountStatus,
} from '../utils/propFirmData'
import {
  FIRM_LIST,
  getFirmPreset,
  getPresetRules,
  formatAccountSize,
  type FirmPreset,
} from '../utils/propFirmPresets'

// ─── Drawdown Gauge (SVG semicircle) ─────────────────────────────────────────

function DrawdownGauge({ pctUsed, limit, current }: { pctUsed: number; limit: number; current: number }) {
  const clampedPct = Math.min(pctUsed, 100)
  const color = getDrawdownColor(pctUsed)
  const remaining = Math.max(limit - current, 0)

  // SVG arc params: semicircle, radius=40, stroke=8
  const r = 40
  const cx = 52
  const cy = 52
  const strokeW = 9
  // Full arc length (180° semicircle)
  const arcLen = Math.PI * r  // ≈125.66
  // Used portion of arc
  const usedArc = (clampedPct / 100) * arcLen
  const gapArc = arcLen - usedArc

  // Track arc: starts at left (180°) sweeping right (0°) — rotate the coordinate system
  // Path: from 180° to 0° (left to right)
  const startX = cx - r
  const startY = cy
  const endX   = cx + r
  const endY   = cy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width="104" height="60" viewBox="0 0 104 60" style={{ overflow: 'visible' }}>
        {/* Track (background) */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="var(--bg-4)"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Used portion */}
        {clampedPct > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={`${usedArc} ${gapArc + 999}`}
            style={{ transition: 'stroke-dasharray 0.4s ease, stroke 0.3s ease' }}
          />
        )}
        {/* Center label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>
          {pctUsed.toFixed(0)}%
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text-2)">
          used
        </text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--text-1)', textAlign: 'center', lineHeight: 1.3 }}>
        <span style={{ color: color, fontWeight: 600 }}>${remaining.toLocaleString()}</span>
        <span style={{ color: 'var(--text-3)' }}> remaining</span>
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color, label, current, limit, noLimit }: {
  pct: number
  color: string
  label: string
  current: number
  limit: number
  noLimit?: boolean
}) {
  const clampedPct = Math.min(Math.max(pct, 0), 100)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        {noLimit ? (
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>No limit</span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--text-1)' }}>
            ${Math.abs(current).toLocaleString()} / ${limit.toLocaleString()}
          </span>
        )}
      </div>
      <div style={{ height: 5, background: 'var(--bg-4)', borderRadius: 99, overflow: 'hidden' }}>
        {!noLimit && (
          <div style={{
            height: '100%',
            width: `${clampedPct}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.3s ease',
          }} />
        )}
      </div>
    </div>
  )
}

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({ account, onSelect, onDelete }: {
  account: PropFirmAccount
  onSelect: (acc: PropFirmAccount) => void
  onDelete: (id: string) => void
}) {
  const firm = getFirmPreset(account.firm)
  const drawdownPct = getDrawdownUsedPct(account.rules)
  const profitPct   = getProfitPct(account.rules)
  const dailyPct    = getDailyLossPct(account.rules)
  const statusColor = getStatusColor(account.status)
  const drawdownColor = getDrawdownColor(drawdownPct)
  const profitColor = profitPct >= 100 ? 'var(--green)' : 'var(--accent)'
  const dailyColor  = getDrawdownColor(dailyPct)
  const firmColor   = firm?.color ?? '#6366f1'
  const [confirmDel, setConfirmDel] = useState(false)

  const hasMinDays = !!(account.rules.minTradingDays && account.rules.minTradingDays > 0)

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onClick={() => onSelect(account)}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = firmColor
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 1px ${firmColor}22, 0 4px 20px rgba(0,0,0,0.3)`
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {/* Firm color dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: firmColor, flexShrink: 0, marginTop: 2,
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-0)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {account.accountName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
              {firm?.displayName ?? account.firm} · {formatAccountSize(account.accountSize)}
            </div>
          </div>
        </div>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99,
            background: `${firmColor}22`, color: firmColor, fontWeight: 500,
          }}>
            {getPhaseLabel(account.phase)}
          </span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99,
            background: `${statusColor}18`, color: statusColor, fontWeight: 500,
          }}>
            {getStatusLabel(account.status)}
          </span>
        </div>
      </div>

      {/* Gauge + bars row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Drawdown Gauge */}
        <div style={{ flexShrink: 0 }}>
          <DrawdownGauge
            pctUsed={drawdownPct}
            limit={account.rules.maxDrawdown.limit}
            current={account.rules.maxDrawdown.current}
          />
          <div style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'center', marginTop: 2 }}>
            {account.rules.maxDrawdown.type === 'trailing' ? '▼ trailing' : '▼ static'}
          </div>
        </div>

        {/* Progress bars */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          {/* Profit Target */}
          <ProgressBar
            label="Profit Target"
            pct={profitPct}
            color={profitColor}
            current={account.rules.profitTarget.currentPnl}
            limit={account.rules.profitTarget.target}
            noLimit={account.rules.profitTarget.target === 0}
          />
          {/* Daily Loss */}
          <ProgressBar
            label="Daily Loss"
            pct={dailyPct}
            color={dailyColor}
            current={Math.max(-account.rules.dailyLossLimit.todayPnl, 0)}
            limit={account.rules.dailyLossLimit.limit}
            noLimit={account.rules.dailyLossLimit.limit === 0}
          />
          {/* Trading days */}
          {hasMinDays && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>
              <span>Trading Days</span>
              <span style={{ color: 'var(--text-0)' }}>
                {account.rules.tradingDaysCompleted ?? 0} / {account.rules.minTradingDays}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete button */}
      <div
        style={{ position: 'absolute', bottom: 12, right: 14 }}
        onClick={e => e.stopPropagation()}
      >
        {confirmDel ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onDelete(account.id)}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: 'var(--red-dim)', color: 'var(--red)',
                border: '1px solid var(--red)', cursor: 'pointer',
              }}
            >Confirm</button>
            <button
              onClick={() => setConfirmDel(false)}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: 'var(--bg-3)', color: 'var(--text-2)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: 'none', color: 'var(--text-3)',
              border: '1px solid transparent', cursor: 'pointer',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Add Account Modal ────────────────────────────────────────────────────────

function AddAccountModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (account: Omit<PropFirmAccount, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [firmId, setFirmId]         = useState<FirmId>('ftmo')
  const [accountSize, setAccountSize] = useState<number>(100000)
  const [customSize, setCustomSize]  = useState<string>('')
  const [useCustomSize, setUseCustomSize] = useState(false)
  const [phase, setPhase]           = useState<PhaseId>('phase1')
  const [accountName, setAccountName] = useState('')
  const [error, setError]           = useState<string | null>(null)

  const firm = getFirmPreset(firmId)

  // Auto-set default account size when firm changes
  useEffect(() => {
    if (firm) {
      const defaultSize = firm.accountSizes.includes(100000)
        ? 100000
        : firm.accountSizes[Math.floor(firm.accountSizes.length / 2)]
      setAccountSize(defaultSize)
      setUseCustomSize(false)
      setCustomSize('')
      // Default phase
      setPhase(firm.phases[0])
      // Auto-generate name
      setAccountName(`${firm.shortName} ${formatAccountSize(defaultSize)} ${getPhaseLabel(firm.phases[0])}`)
    }
  }, [firmId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update name when size or phase changes
  useEffect(() => {
    if (!accountName || accountName.match(/^(FTMO|TopStep|Apex|MFF|5%ers|Custom)/)) {
      const size = useCustomSize ? (parseInt(customSize) || accountSize) : accountSize
      setAccountName(`${firm?.shortName ?? firmId} ${formatAccountSize(size)} ${getPhaseLabel(phase)}`)
    }
  }, [accountSize, phase, useCustomSize, customSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = () => {
    setError(null)
    const finalSize = useCustomSize ? parseInt(customSize) : accountSize
    if (!finalSize || finalSize <= 0 || !isFinite(finalSize)) {
      setError('Account size must be a positive number.')
      return
    }
    if (finalSize > 10_000_000) {
      setError('Account size seems too large. Max is $10,000,000.')
      return
    }
    const trimmedName = accountName.trim()
    if (!trimmedName) {
      setError('Account name is required.')
      return
    }
    if (trimmedName.length > 60) {
      setError('Account name must be 60 characters or less.')
      return
    }

    const rules = getPresetRules(firmId, finalSize, phase)
    onAdd({
      firm: firmId,
      accountName: trimmedName,
      accountSize: finalSize,
      phase,
      status: 'active',
      rules,
      trades: [],
    })
    onClose()
  }

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-3)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-0)',
    fontSize: 13,
    padding: '9px 12px',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-2)',
    marginBottom: 5,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-0)' }}>Add Prop Firm Account</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-2)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4,
            }}
          >✕</button>
        </div>

        {/* Firm selector */}
        <div>
          <label style={labelStyle}>Prop Firm</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {FIRM_LIST.map(f => (
              <button
                key={f.id}
                onClick={() => setFirmId(f.id)}
                style={{
                  padding: '8px 6px',
                  border: `1px solid ${firmId === f.id ? f.color : 'var(--border)'}`,
                  borderRadius: 8,
                  background: firmId === f.id ? `${f.color}18` : 'var(--bg-3)',
                  color: firmId === f.id ? f.color : 'var(--text-1)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: firmId === f.id ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {f.shortName}
              </button>
            ))}
          </div>
        </div>

        {/* Account Size */}
        <div>
          <label style={labelStyle}>Account Size</label>
          {firm && !useCustomSize ? (
            <select
              value={accountSize}
              onChange={e => setAccountSize(Number(e.target.value))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {firm.accountSizes.map(s => (
                <option key={s} value={s}>{formatAccountSize(s)}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              min={1}
              max={10000000}
              value={customSize}
              onChange={e => setCustomSize(e.target.value)}
              placeholder="e.g. 100000"
              style={inputStyle}
            />
          )}
          {firm && (
            <button
              onClick={() => {
                setUseCustomSize(v => !v)
                setCustomSize(String(accountSize))
              }}
              style={{
                marginTop: 6, background: 'none', border: 'none',
                color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0,
              }}
            >
              {useCustomSize ? '← Use preset sizes' : 'Enter custom size →'}
            </button>
          )}
        </div>

        {/* Phase */}
        <div>
          <label style={labelStyle}>Phase</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(firm?.phases ?? (['phase1', 'phase2', 'funded', 'payout'] as PhaseId[])).map(p => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                style={{
                  padding: '7px 14px',
                  border: `1px solid ${phase === p ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  background: phase === p ? 'var(--accent-dim)' : 'var(--bg-3)',
                  color: phase === p ? 'var(--accent)' : 'var(--text-1)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: phase === p ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {getPhaseLabel(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Account name */}
        <div>
          <label style={labelStyle}>Account Label</label>
          <input
            type="text"
            maxLength={60}
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="e.g. FTMO 100K Phase 1"
            style={inputStyle}
          />
        </div>

        {/* Rules preview */}
        {firm && (
          <div style={{
            background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rules Preview (auto-populated)
            </div>
            {(() => {
              const finalSize = useCustomSize ? (parseInt(customSize) || accountSize) : accountSize
              const rules = getPresetRules(firmId, finalSize, phase)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <RuleRow label="Max Drawdown" value={`$${rules.maxDrawdown.limit.toLocaleString()} (${rules.maxDrawdown.type})`} />
                  <RuleRow label="Daily Loss Limit" value={rules.dailyLossLimit.limit === 0 ? 'None' : `$${rules.dailyLossLimit.limit.toLocaleString()}`} />
                  <RuleRow label="Profit Target" value={rules.profitTarget.target === 0 ? 'N/A' : `$${rules.profitTarget.target.toLocaleString()}`} />
                  {rules.minTradingDays && <RuleRow label="Min Trading Days" value={String(rules.minTradingDays)} />}
                  {rules.newsTrading === false && <RuleRow label="News Trading" value="Restricted ⚠️" />}
                </div>
              )
            })()}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--red)',
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-3)', color: 'var(--text-1)',
              cursor: 'pointer', fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '9px 20px', borderRadius: 8,
              border: 'none', background: 'var(--accent)',
              color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >Create Account</button>
        </div>
      </div>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <span style={{ color: 'var(--text-0)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function AccountDetail({ account, onBack, onUpdate }: {
  account: PropFirmAccount
  onBack: () => void
  onUpdate: (updates: Partial<PropFirmAccount>) => void
}) {
  const firm = getFirmPreset(account.firm)
  const firmColor = firm?.color ?? '#6366f1'
  const drawdownPct = getDrawdownUsedPct(account.rules)
  const profitPct   = getProfitPct(account.rules)
  const dailyPct    = getDailyLossPct(account.rules)
  const drawdownColor = getDrawdownColor(drawdownPct)
  const statusColor   = getStatusColor(account.status)

  // Editable fields for updating progress
  const [editingPnl, setEditingPnl] = useState(false)
  const [editingDrawdown, setEditingDrawdown] = useState(false)
  const [editingDaily, setEditingDaily] = useState(false)
  const [pnlVal, setPnlVal] = useState(String(account.rules.profitTarget.currentPnl))
  const [drawdownVal, setDrawdownVal] = useState(String(account.rules.maxDrawdown.current))
  const [dailyVal, setDailyVal] = useState(String(account.rules.dailyLossLimit.todayPnl))

  const handleUpdateRules = (partial: Partial<PropFirmRules>) => {
    onUpdate({ rules: { ...account.rules, ...partial } })
  }

  const handleSavePnl = () => {
    const v = parseFloat(pnlVal)
    if (isFinite(v)) handleUpdateRules({ profitTarget: { ...account.rules.profitTarget, currentPnl: v } })
    setEditingPnl(false)
  }

  const handleSaveDrawdown = () => {
    const v = parseFloat(drawdownVal)
    if (isFinite(v) && v >= 0) handleUpdateRules({ maxDrawdown: { ...account.rules.maxDrawdown, current: v } })
    setEditingDrawdown(false)
  }

  const handleSaveDaily = () => {
    const v = parseFloat(dailyVal)
    if (isFinite(v)) handleUpdateRules({ dailyLossLimit: { ...account.rules.dailyLossLimit, todayPnl: v } })
    setEditingDaily(false)
  }

  const sectionStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 16,
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-3)',
    border: '1px solid var(--accent)',
    borderRadius: 6,
    color: 'var(--text-0)',
    fontSize: 13,
    padding: '4px 8px',
    outline: 'none',
    width: 100,
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text-1)', cursor: 'pointer',
            padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-0)' }}>{account.accountName}</h1>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {firm?.displayName} · {formatAccountSize(account.accountSize)} · {getPhaseLabel(account.phase)}
          </div>
        </div>
        {/* Status selector */}
        <select
          value={account.status}
          onChange={e => onUpdate({ status: e.target.value as AccountStatus })}
          style={{
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}`,
            borderRadius: 8, color: statusColor,
            fontSize: 12, fontWeight: 600, padding: '6px 10px', cursor: 'pointer', outline: 'none',
          }}
        >
          {(['active', 'passed', 'failed', 'withdrawn'] as AccountStatus[]).map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Drawdown */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>Drawdown</h3>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {account.rules.maxDrawdown.type === 'trailing' ? '▼ Trailing from peak' : '▼ Static from start'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <DrawdownGauge
            pctUsed={drawdownPct}
            limit={account.rules.maxDrawdown.limit}
            current={account.rules.maxDrawdown.current}
          />
          <div style={{ flex: 1 }}>
            <RuleRow label="Max Drawdown Limit" value={`$${account.rules.maxDrawdown.limit.toLocaleString()}`} />
            <div style={{ height: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
              <span style={{ color: 'var(--text-2)' }}>Current Drawdown Used</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editingDrawdown ? (
                  <>
                    <input
                      type="number"
                      value={drawdownVal}
                      onChange={e => setDrawdownVal(e.target.value)}
                      style={inputStyle}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveDrawdown(); if (e.key === 'Escape') setEditingDrawdown(false) }}
                    />
                    <button onClick={handleSaveDrawdown} style={{ fontSize: 10, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingDrawdown(false)} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ color: drawdownColor, fontWeight: 600 }}>${account.rules.maxDrawdown.current.toLocaleString()}</span>
                    <button onClick={() => { setDrawdownVal(String(account.rules.maxDrawdown.current)); setEditingDrawdown(true) }} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Target */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>Profit Target</h3>
          <span style={{ fontSize: 12, color: profitPct >= 100 ? 'var(--green)' : 'var(--text-2)' }}>
            {profitPct.toFixed(1)}%
          </span>
        </div>
        {account.rules.profitTarget.target > 0 ? (
          <>
            <ProgressBar
              label=""
              pct={profitPct}
              color={profitPct >= 100 ? 'var(--green)' : 'var(--accent)'}
              current={account.rules.profitTarget.currentPnl}
              limit={account.rules.profitTarget.target}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <RuleRow label="Target" value={`$${account.rules.profitTarget.target.toLocaleString()}`} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Current P&L: </span>
                {editingPnl ? (
                  <>
                    <input type="number" value={pnlVal} onChange={e => setPnlVal(e.target.value)} style={inputStyle} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSavePnl(); if (e.key === 'Escape') setEditingPnl(false) }} />
                    <button onClick={handleSavePnl} style={{ fontSize: 10, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingPnl(false)} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, color: account.rules.profitTarget.currentPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      ${account.rules.profitTarget.currentPnl.toLocaleString()}
                    </span>
                    <button onClick={() => { setPnlVal(String(account.rules.profitTarget.currentPnl)); setEditingPnl(true) }} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No profit target for this phase.</div>
        )}
      </div>

      {/* Daily Loss Limit */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>Daily Loss Limit</h3>
          {account.rules.dailyLossLimit.limit > 0 && (
            <span style={{ fontSize: 12, color: getDrawdownColor(dailyPct) }}>
              {dailyPct.toFixed(1)}% used today
            </span>
          )}
        </div>
        {account.rules.dailyLossLimit.limit > 0 ? (
          <>
            <ProgressBar
              label=""
              pct={dailyPct}
              color={getDrawdownColor(dailyPct)}
              current={Math.max(-account.rules.dailyLossLimit.todayPnl, 0)}
              limit={account.rules.dailyLossLimit.limit}
            />
            {/* Alert zones */}
            {dailyPct >= 75 && (
              <div style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 6,
                background: dailyPct >= 90 ? 'var(--red-dim)' : 'var(--yellow-dim)',
                border: `1px solid ${dailyPct >= 90 ? 'var(--red)' : 'var(--yellow)'}`,
                fontSize: 11,
                color: dailyPct >= 90 ? 'var(--red)' : 'var(--yellow)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                ⚠️ {dailyPct >= 90
                  ? 'DANGER: Over 90% of daily loss limit reached. Consider stopping.'
                  : 'WARNING: Over 75% of daily loss limit reached.'}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <RuleRow label="Limit" value={`$${account.rules.dailyLossLimit.limit.toLocaleString()}`} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Today&apos;s P&L: </span>
                {editingDaily ? (
                  <>
                    <input type="number" value={dailyVal} onChange={e => setDailyVal(e.target.value)} style={inputStyle} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveDaily(); if (e.key === 'Escape') setEditingDaily(false) }} />
                    <button onClick={handleSaveDaily} style={{ fontSize: 10, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingDaily(false)} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 600, color: account.rules.dailyLossLimit.todayPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      ${account.rules.dailyLossLimit.todayPnl.toLocaleString()}
                    </span>
                    <button onClick={() => { setDailyVal(String(account.rules.dailyLossLimit.todayPnl)); setEditingDaily(true) }} style={{ fontSize: 10, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>No daily loss limit for this firm.</div>
        )}
      </div>

      {/* Additional Rules */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', marginBottom: 12 }}>Additional Rules</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {account.rules.minTradingDays && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Min Trading Days</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 4, width: 80, background: 'var(--bg-4)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(((account.rules.tradingDaysCompleted ?? 0) / account.rules.minTradingDays) * 100, 100)}%`,
                    background: 'var(--accent)',
                    borderRadius: 99,
                  }} />
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-0)', fontWeight: 600 }}>
                  {account.rules.tradingDaysCompleted ?? 0} / {account.rules.minTradingDays}
                </span>
                {/* Quick increment */}
                <button
                  onClick={() => handleUpdateRules({ tradingDaysCompleted: Math.min((account.rules.tradingDaysCompleted ?? 0) + 1, account.rules.minTradingDays!) })}
                  style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                >+1</button>
              </div>
            </div>
          )}
          {account.rules.maxContracts && (
            <RuleRow label="Max Contracts" value={String(account.rules.maxContracts)} />
          )}
          {account.rules.maxDailyProfit && (
            <RuleRow label="Max Daily Profit" value={`$${account.rules.maxDailyProfit.toLocaleString()}`} />
          )}
          {account.rules.newsTrading === false && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>News Trading</span>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>⚠️ Restricted</span>
            </div>
          )}
          {account.rules.newsTrading === true && (
            <RuleRow label="News Trading" value="✓ Allowed" />
          )}
        </div>
      </div>

      {/* Linked trades */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', marginBottom: 8 }}>Linked Trades</h3>
        {account.trades.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            No trades linked yet. Log trades in the Journal and they will appear here.
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{account.trades.length} trade(s) linked.</div>
        )}
      </div>

      {/* Meta */}
      <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', marginTop: -8 }}>
        Created {new Date(account.createdAt).toLocaleDateString()} · Updated {new Date(account.updatedAt).toLocaleDateString()}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropFirmPage() {
  const [accounts, setAccounts]       = useState<PropFirmAccount[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<PropFirmAccount | null>(null)
  const [mounted, setMounted]         = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setAccounts(loadPropFirmAccounts())
    setMounted(true)
  }, [])

  const handleAdd = useCallback((accountData: Omit<PropFirmAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = addPropFirmAccount(accountData)
    setAccounts(loadPropFirmAccounts())
    setSelectedAccount(created)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deletePropFirmAccount(id)
    setAccounts(loadPropFirmAccounts())
    if (selectedAccount?.id === id) setSelectedAccount(null)
  }, [selectedAccount])

  const handleUpdate = useCallback((id: string, updates: Partial<PropFirmAccount>) => {
    const updated = updatePropFirmAccount(id, updates)
    if (updated) {
      setAccounts(loadPropFirmAccounts())
      setSelectedAccount(updated)
    }
  }, [])

  const handleSelect = useCallback((acc: PropFirmAccount) => {
    setSelectedAccount(acc)
  }, [])

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-0)' }}>
        <PersistentNav />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', color: 'var(--text-0)' }}>
      <PersistentNav />

      <main style={{
        maxWidth: 960,
        margin: '0 auto',
        padding: '32px 20px 60px',
        fontFamily: 'var(--font)',
      }}>
        {selectedAccount ? (
          <AccountDetail
            account={selectedAccount}
            onBack={() => setSelectedAccount(null)}
            onUpdate={updates => handleUpdate(selectedAccount.id, updates)}
          />
        ) : (
          <>
            {/* Page Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 28,
            }}>
              <div>
                <h1 style={{
                  fontSize: 24, fontWeight: 700, color: 'var(--text-0)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ color: 'var(--accent)' }}><IconTarget size={22} /></span>
                  Prop Firm Tracker
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                  Track your prop firm challenges and funded account rules in one place.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 8,
                  border: 'none', background: 'var(--accent)',
                  color: '#fff', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                + Add Account
              </button>
            </div>

            {/* Accounts grid */}
            {accounts.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                border: '1px dashed var(--border)', borderRadius: 12,
              }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-0)', marginBottom: 8 }}>
                  No prop firm accounts yet
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>
                  Add your first prop firm challenge to start tracking drawdown, profit targets, and daily limits.
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '10px 22px', borderRadius: 8,
                    border: 'none', background: 'var(--accent)',
                    color: '#fff', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                  }}
                >
                  + Add First Account
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}>
                {accounts.map(acc => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Summary stats (when accounts exist) */}
            {accounts.length > 0 && (
              <div style={{
                marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Total Accounts', value: String(accounts.length) },
                  { label: 'Active', value: String(accounts.filter(a => a.status === 'active').length), color: 'var(--accent)' },
                  { label: 'Passed', value: String(accounts.filter(a => a.status === 'passed').length), color: 'var(--green)' },
                  { label: 'Failed', value: String(accounts.filter(a => a.status === 'failed').length), color: 'var(--red)' },
                  { label: 'Capital at Risk', value: `$${accounts.filter(a => a.status === 'active').reduce((s, a) => s + a.accountSize, 0).toLocaleString()}` },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 18px',
                    minWidth: 120,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: stat.color ?? 'var(--text-0)' }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
