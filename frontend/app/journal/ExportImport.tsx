'use client'

import { useState, useRef, useEffect } from 'react'
import { IconDownload, IconUpload, IconClose, IconFile, IconChart, IconSave, IconMerge, IconRefresh } from '../components/Icons'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trade {
  id: string
  date: string
  time: string
  symbol: string
  assetClass: string
  direction: string
  entryPrice: number
  exitPrice: number
  positionSize: number
  stopLoss: number
  takeProfit: number
  commissions: number
  pnl: number
  rMultiple: number
  pctGainLoss: number
  holdMinutes: number
  setupTag: string
  mistakeTag: string
  rating: number
  notes: string
  screenshot: string
  tags_setup_types?: string[]
  tags_mistakes?: string[]
  tags_strategies?: string[]
}

interface Note {
  id: string
  title: string
  content: string
  template: string
  createdAt: string
  updatedAt: string
}

// ─── Export Helpers ────────────────────────────────────────────────────────────

function downloadBlob(data: string, filename: string, type: string) {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportJournalJSON(trades: Trade[], notes: Note[]) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'journal',
    trades: trades.map(t => ({ ...t, screenshot: t.screenshot ? '[screenshot_data]' : '' })),
    notes,
    customTags: (() => { try { return JSON.parse(localStorage.getItem('cg_journal_custom_tags') || '[]') } catch { return [] } })(),
  }
  downloadBlob(JSON.stringify(data, null, 2), `tradvue-journal-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
}

export function exportJournalCSV(trades: Trade[]) {
  const headers = [
    'Date', 'Time', 'Symbol', 'Asset Class', 'Direction',
    'Entry Price', 'Exit Price', 'Position Size', 'Stop Loss', 'Take Profit',
    'Commissions', 'P&L', 'R-Multiple', '% Gain/Loss',
    'Setup Tag', 'Mistake Tag', 'Setup Types', 'Mistakes', 'Strategies',
    'Rating', 'Notes',
  ]
  const rows = trades.map(t => [
    t.date, t.time, t.symbol, t.assetClass, t.direction,
    t.entryPrice, t.exitPrice, t.positionSize, t.stopLoss, t.takeProfit,
    t.commissions, t.pnl, t.rMultiple, t.pctGainLoss,
    t.setupTag, t.mistakeTag,
    (t.tags_setup_types || []).join(';'),
    (t.tags_mistakes || []).join(';'),
    (t.tags_strategies || []).join(';'),
    t.rating,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadBlob(csv, `tradvue-journal-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
}

export function exportPortfolioJSON() {
  const keys = ['tv_portfolio_holdings', 'tv_portfolio_settings', 'tv_portfolio_dividends', 'cg_watchlist']
  const data: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'portfolio',
  }
  keys.forEach(key => {
    try { data[key] = JSON.parse(localStorage.getItem(key) || 'null') } catch { data[key] = null }
  })
  downloadBlob(JSON.stringify(data, null, 2), `tradvue-portfolio-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
}

export function exportPortfolioCSV() {
  let holdings: { ticker: string; company: string; shares: number; avgCost: number; buyDate: string; sector: string; notes?: string }[] = []
  try { holdings = JSON.parse(localStorage.getItem('tv_portfolio_holdings') || '[]') } catch {}
  
  const headers = ['Ticker', 'Company', 'Shares', 'Avg Cost', 'Buy Date', 'Sector', 'Notes']
  const rows = holdings.map(h => [
    h.ticker, `"${(h.company || '').replace(/"/g, '""')}"`, h.shares, h.avgCost, h.buyDate, h.sector,
    `"${(h.notes || '').replace(/"/g, '""')}"`,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadBlob(csv, `tradvue-portfolio-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
}

export function exportFullBackup(trades: Trade[], notes: Note[]) {
  let holdings = null, portfolioSettings = null, dividends = null, watchlist = null, customTags = null
  try { holdings = JSON.parse(localStorage.getItem('tv_portfolio_holdings') || 'null') } catch {}
  try { portfolioSettings = JSON.parse(localStorage.getItem('tv_portfolio_settings') || 'null') } catch {}
  try { dividends = JSON.parse(localStorage.getItem('tv_portfolio_dividends') || 'null') } catch {}
  try { watchlist = JSON.parse(localStorage.getItem('cg_watchlist') || 'null') } catch {}
  try { customTags = JSON.parse(localStorage.getItem('cg_journal_custom_tags') || 'null') } catch {}

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    type: 'full_backup',
    journal: {
      trades: trades.map(t => ({ ...t, screenshot: t.screenshot ? '[screenshot_data]' : '' })),
      notes,
      customTags,
    },
    portfolio: {
      holdings,
      settings: portfolioSettings,
      dividends,
      watchlist,
    },
  }
  downloadBlob(JSON.stringify(backup, null, 2), `tradvue-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
}

// ─── Export Dropdown Button ───────────────────────────────────────────────────

export function ExportButton({ trades, notes, variant = 'journal' }: {
  trades?: Trade[]
  notes?: Note[]
  variant: 'journal' | 'portfolio' | 'backup'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const labels: Record<string, React.ReactNode> = {
    journal: 'Export',
    portfolio: 'Export',
    backup: 'Backup',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bg-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--btn-radius)', padding: '8px 14px',
        color: 'var(--text-0)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>
        <IconDownload size={14} />
        {labels[variant]}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 6, minWidth: 180,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {variant === 'journal' && trades && notes && (
            <>
              <DropdownItem icon={<IconFile size={13} />} label="Export as JSON" sub="Full data with tags & notes" onClick={() => { exportJournalJSON(trades, notes); setOpen(false) }} />
              <DropdownItem icon={<IconChart size={13} />} label="Export as CSV" sub="Simplified spreadsheet" onClick={() => { exportJournalCSV(trades); setOpen(false) }} />
            </>
          )}
          {variant === 'portfolio' && (
            <>
              <DropdownItem icon={<IconFile size={13} />} label="Export as JSON" sub="Holdings, dividends, settings" onClick={() => { exportPortfolioJSON(); setOpen(false) }} />
              <DropdownItem icon={<IconChart size={13} />} label="Export as CSV" sub="Holdings spreadsheet" onClick={() => { exportPortfolioCSV(); setOpen(false) }} />
            </>
          )}
          {variant === 'backup' && trades && notes && (
            <DropdownItem icon={<IconSave size={13} />} label="Download Full Backup" sub="Journal + Portfolio (JSON)" onClick={() => { exportFullBackup(trades, notes); setOpen(false) }} />
          )}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      background: 'transparent', border: 'none', borderRadius: 6,
      padding: '8px 10px', cursor: 'pointer', color: 'var(--text-0)',
      transition: 'background 0.1s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ opacity: 0.7 }}>{icon}</span>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 1 }}>{sub}</div>
    </button>
  )
}

// ─── Import Backup Modal ──────────────────────────────────────────────────────

export function ImportBackupModal({ onClose, onRestore }: {
  onClose: () => void
  onRestore: (data: { trades?: Trade[]; notes?: Note[] }) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const [restoreJournal, setRestoreJournal] = useState(true)
  const [restorePortfolio, setRestorePortfolio] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (!data.version || !data.type) {
          setError('Invalid backup file — missing version or type field')
          return
        }
        setParsed(data)
      } catch {
        setError('Could not parse JSON file')
      }
    }
    reader.readAsText(f)
  }

  const getSummary = () => {
    if (!parsed) return null
    const type = parsed.type as string
    const summary: { label: string; count: number | string }[] = []

    if (type === 'full_backup' || type === 'journal') {
      const journal = type === 'full_backup' ? (parsed.journal as Record<string, unknown>) : parsed
      const trades = (journal?.trades as unknown[]) || []
      const notes = (journal?.notes as unknown[]) || []
      summary.push({ label: 'Trades', count: trades.length })
      summary.push({ label: 'Notes', count: notes.length })
    }
    if (type === 'full_backup' || type === 'portfolio') {
      const portfolio = type === 'full_backup' ? (parsed.portfolio as Record<string, unknown>) : parsed
      const holdings = (portfolio?.holdings as unknown[]) || []
      summary.push({ label: 'Holdings', count: Array.isArray(holdings) ? holdings.length : 'present' })
    }
    return summary
  }

  const handleRestore = () => {
    if (!parsed) return
    const type = parsed.type as string

    // Restore journal data
    if (restoreJournal && (type === 'full_backup' || type === 'journal')) {
      const journal = type === 'full_backup' ? (parsed.journal as Record<string, unknown>) : parsed
      const trades = (journal?.trades as Trade[]) || []
      const notes = (journal?.notes as Note[]) || []
      const customTags = journal?.customTags

      if (mode === 'merge') {
        // Merge: add trades/notes that don't exist by ID
        const existingTrades: Trade[] = JSON.parse(localStorage.getItem('cg_journal_trades') || '[]')
        const existingNotes: Note[] = JSON.parse(localStorage.getItem('cg_journal_notes') || '[]')
        const existingIds = new Set(existingTrades.map(t => t.id))
        const existingNoteIds = new Set(existingNotes.map(n => n.id))
        const newTrades = trades.filter(t => !existingIds.has(t.id))
        const newNotes = notes.filter(n => !existingNoteIds.has(n.id))
        const mergedTrades = [...newTrades, ...existingTrades]
        const mergedNotes = [...newNotes, ...existingNotes]
        localStorage.setItem('cg_journal_trades', JSON.stringify(mergedTrades))
        localStorage.setItem('cg_journal_notes', JSON.stringify(mergedNotes))
        onRestore({ trades: mergedTrades, notes: mergedNotes })
      } else {
        localStorage.setItem('cg_journal_trades', JSON.stringify(trades))
        localStorage.setItem('cg_journal_notes', JSON.stringify(notes))
        onRestore({ trades, notes })
      }

      if (customTags) {
        if (mode === 'merge') {
          const existing = JSON.parse(localStorage.getItem('cg_journal_custom_tags') || '[]')
          const existingNames = new Set(existing.map((t: { name: string }) => t.name))
          const merged = [...existing, ...(customTags as unknown[]).filter((t: unknown) => !existingNames.has((t as { name: string }).name))]
          localStorage.setItem('cg_journal_custom_tags', JSON.stringify(merged))
        } else {
          localStorage.setItem('cg_journal_custom_tags', JSON.stringify(customTags))
        }
      }
    }

    // Restore portfolio data
    if (restorePortfolio && (type === 'full_backup' || type === 'portfolio')) {
      const portfolio = type === 'full_backup' ? (parsed.portfolio as Record<string, unknown>) : parsed
      if (portfolio) {
        const keys = ['tv_portfolio_holdings', 'tv_portfolio_settings', 'tv_portfolio_dividends', 'cg_watchlist']
        const dataKeys = ['holdings', 'settings', 'dividends', 'watchlist']
        keys.forEach((key, i) => {
          const val = portfolio[dataKeys[i]] || portfolio[key]
          if (val !== null && val !== undefined) {
            if (mode === 'merge' && Array.isArray(val)) {
              const existing = JSON.parse(localStorage.getItem(key) || '[]')
              const merged = [...existing, ...(val as unknown[])]
              localStorage.setItem(key, JSON.stringify(merged))
            } else {
              localStorage.setItem(key, JSON.stringify(val))
            }
          }
        })
      }
    }

    onClose()
  }

  const summary = getSummary()

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, zIndex: 1001,
        width: 'min(90vw, 520px)', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconUpload size={20} /> Import Backup
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
            <IconClose size={18} />
          </button>
        </div>

        {/* File upload */}
        <div onClick={() => fileRef.current?.click()} style={{
          border: '2px dashed var(--border)', borderRadius: 12,
          padding: '30px 20px', textAlign: 'center', cursor: 'pointer',
          background: file ? 'rgba(16,185,129,0.06)' : 'var(--bg-1)',
          marginBottom: 16,
        }}>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{ display: 'none' }} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ color: 'var(--green)' }}>✓</span>
              <span style={{ color: 'var(--text-0)', fontWeight: 600 }}>{file.name}</span>
            </div>
          ) : (
            <>
              <IconUpload size={28} style={{ color: 'var(--text-2)', marginBottom: 6 }} />
              <div style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600 }}>Select a backup JSON file</div>
            </>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* Backup summary */}
        {parsed && summary && (
          <>
            <div style={{ background: 'var(--bg-1)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 8 }}>Backup Contents</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {summary.map(s => (
                  <div key={s.label} style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)' }}>{s.label}: </span>
                    <span style={{ color: 'var(--text-0)', fontWeight: 700 }}>{s.count}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 6 }}>
                Exported: {(parsed.exportedAt as string)?.slice(0, 19).replace('T', ' ')}
              </div>
            </div>

            {/* Options */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 8 }}>Restore Mode</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['merge', 'replace'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    border: `2px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
                    background: mode === m ? 'rgba(99,102,241,0.1)' : 'var(--bg-1)',
                    color: mode === m ? 'var(--accent)' : 'var(--text-1)',
                    cursor: 'pointer', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>{m === 'merge' ? <><IconMerge size={13} />Merge</> : <><IconRefresh size={13} />Replace</>}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>
                      {m === 'merge' ? 'Add new items, keep existing' : 'Overwrite with backup data'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* What to restore */}
            {(parsed.type === 'full_backup') && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={restoreJournal} onChange={e => setRestoreJournal(e.target.checked)} />
                  Journal (trades, notes, tags)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-1)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={restorePortfolio} onChange={e => setRestorePortfolio(e.target.checked)} />
                  Portfolio (holdings, settings)
                </label>
              </div>
            )}

            {mode === 'replace' && (
              <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 11, color: 'var(--red)' }}>
                Replace mode will overwrite your current data. This cannot be undone.
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--btn-radius)',
            padding: '10px 20px', color: 'var(--text-0)', fontSize: 13, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleRestore} disabled={!parsed} style={{
            background: parsed ? 'var(--green)' : 'var(--bg-1)',
            border: 'none', borderRadius: 'var(--btn-radius)',
            padding: '10px 24px', color: parsed ? '#0a0a0c' : 'var(--text-2)',
            fontSize: 13, fontWeight: 700, cursor: parsed ? 'pointer' : 'not-allowed',
          }}>✓ Restore Data</button>
        </div>
      </div>
    </>
  )
}
