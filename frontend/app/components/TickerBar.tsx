'use client'

import { fmt, fmtPct } from '../utils/formatting'
import { TICKER_SYMBOLS, TICKER_DISPLAY, TICKER_FALLBACK } from '../constants'
import type { Quote } from '../types'

interface Props {
  tickerQuotes: Record<string, Quote>
  customSymbols: string[]
  isLoading: boolean
  hiddenSymbols?: Set<string>
  onOpenSettings?: () => void
  size?: 'compact' | 'normal' | 'large'
}

/**
 * Horizontally scrolling ticker bar showing live market quotes.
 * Duplicates items 3× for seamless CSS animation loop.
 */
export default function TickerBar({
  tickerQuotes,
  customSymbols,
  isLoading,
  hiddenSymbols = new Set<string>(),
  onOpenSettings,
  size = 'compact',
}: Props) {
  const defaultItems = Object.keys(tickerQuotes).length > 0
    ? TICKER_SYMBOLS
        .filter(sym => tickerQuotes[sym] && !hiddenSymbols.has(sym))
        .map(sym => {
          const q = tickerQuotes[sym]
          return { symbol: TICKER_DISPLAY[sym] || sym, price: q.current, change: q.changePct, isReal: q.source !== 'mock', raw: sym, isCustom: false }
        })
    : TICKER_FALLBACK
        .filter(t => {
          const originalSym = Object.entries(TICKER_DISPLAY).find(([, v]) => v === t.symbol)?.[0] || t.symbol
          return !hiddenSymbols.has(originalSym)
        })
        .map(t => ({ ...t, isReal: false, raw: t.symbol, isCustom: false }))

  const customItems = customSymbols
    .filter(sym => tickerQuotes[sym])
    .map(sym => {
      const q = tickerQuotes[sym]
      return { symbol: sym, price: q.current, change: q.changePct, isReal: q.source !== 'mock', raw: sym, isCustom: true }
    })

  const items = [...defaultItems, ...customItems]
  const duped = [...items, ...items, ...items]

  return (
    <div
      className={`ticker-bar ticker-${size}`}
      style={{ position: 'relative' }}
      role="region"
      aria-label="Live market ticker"
    >
      {isLoading && Object.keys(tickerQuotes).length === 0 && (
        <div
          className="connecting-banner"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 3, padding: '0 16px' }}
        >
          <span className="connecting-dot" />
          Connecting to live data…
        </div>
      )}
      <div className="ticker-track" aria-hidden="true">
        {duped.map((item, i) => (
          <span key={i} className={`ticker-item${item.isCustom ? ' ticker-item-custom' : ''}`}>
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-price">
              {item.price == null ? '—' : item.price < 10 ? fmt(item.price, 4) : item.price < 1000 ? fmt(item.price, 2) : fmt(item.price, 0)}
            </span>
            <span className={(item.change ?? 0) >= 0 ? 'ticker-up' : 'ticker-down'}>
              {fmtPct(item.change)}
            </span>
          </span>
        ))}
      </div>
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          title="Customize ticker symbols"
          aria-label="Open ticker settings"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            fontSize: 13,
            color: 'var(--text-2)',
            cursor: 'pointer',
            padding: '2px 5px',
            borderRadius: 3,
            lineHeight: 1,
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          ⚙
        </button>
      )}
    </div>
  )
}
