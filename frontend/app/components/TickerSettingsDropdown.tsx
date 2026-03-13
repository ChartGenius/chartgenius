'use client'

import { useEffect, useRef } from 'react'
import { TICKER_SYMBOLS, TICKER_DISPLAY } from '../constants'

interface Props {
  hiddenSymbols: Set<string>
  onToggle: (sym: string) => void
  onClose: () => void
  tickerSize: 'compact' | 'normal' | 'large'
  onSizeChange: (size: 'compact' | 'normal' | 'large') => void
}

/**
 * Dropdown panel for customizing which symbols appear in the ticker bar
 * and the ticker's display size.
 */
export default function TickerSettingsDropdown({
  hiddenSymbols,
  onToggle,
  onClose,
  tickerSize,
  onSizeChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Ticker bar settings"
      style={{
        position: 'absolute',
        right: 0,
        top: '100%',
        marginTop: 4,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 0',
        minWidth: 200,
        zIndex: 200,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Size selector */}
      <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        TICKER SIZE
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '4px 12px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        {(['compact', 'normal', 'large'] as const).map(s => (
          <button
            key={s}
            onClick={() => onSizeChange(s)}
            aria-label={`Set ticker size to ${s}`}
            aria-pressed={tickerSize === s}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 4,
              cursor: 'pointer',
              textTransform: 'capitalize',
              background: tickerSize === s ? 'var(--accent)' : 'var(--bg-3)',
              color: tickerSize === s ? '#fff' : 'var(--text-2)',
              border: 'none',
              letterSpacing: '0.03em',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ padding: '4px 12px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 4 }}>
        TICKER SYMBOLS
      </div>
      {TICKER_SYMBOLS.map(sym => (
        <label
          key={sym}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            cursor: 'pointer',
            fontSize: 11,
            color: hiddenSymbols.has(sym) ? 'var(--text-3)' : 'var(--text-1)',
          }}
        >
          <input
            type="checkbox"
            checked={!hiddenSymbols.has(sym)}
            onChange={() => onToggle(sym)}
            aria-label={`${TICKER_DISPLAY[sym] || sym} ticker visibility`}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, minWidth: 60 }}>{TICKER_DISPLAY[sym] || sym}</span>
          <span style={{ color: 'var(--text-3)', fontSize: 9.5 }}>{sym}</span>
        </label>
      ))}
    </div>
  )
}
