'use client'

import { useState, useEffect, useRef } from 'react'
import { trackStockSearch } from '../utils/analytics'
import { TOP_SYMBOLS } from '../constants'

interface Props {
  onSelect: (symbol: string, name: string) => void
}

/**
 * Stock search input that allows searching by symbol or name from TOP_SYMBOLS,
 * and also allows adding any arbitrary ticker not already in the known list.
 */
export default function StockSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const knownResults = query.trim().length >= 1
    ? TOP_SYMBOLS.filter(s =>
        s.symbol.startsWith(query.trim().toUpperCase()) ||
        s.name.toLowerCase().includes(query.trim().toLowerCase())
      ).slice(0, 7)
    : []

  const upperQuery = query.trim().toUpperCase()
  const isCustom = upperQuery.length >= 1 && !knownResults.some(r => r.symbol === upperQuery)
  const results = isCustom
    ? [...knownResults, { symbol: upperQuery, name: `Add "${upperQuery}" →` }]
    : knownResults

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const pick = (sym: string, name: string) => {
    trackStockSearch(sym)
    const cleanName = name.startsWith('Add "') ? sym : name
    onSelect(sym, cleanName)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  return (
    <div ref={wrapRef} className="search-wrap" role="search" aria-label="Search stocks">
      <input
        type="text"
        className="symbol-search"
        placeholder="Search or add ticker…"
        value={query}
        autoComplete="off"
        aria-label="Search or add ticker symbol"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => { if (query) setOpen(true) }}
        onKeyDown={e => {
          if (e.key === 'Enter' && query.trim()) {
            e.preventDefault()
            if (open && results.length > 0) {
              pick(results[active].symbol, results[active].name)
            } else {
              pick(upperQuery, upperQuery)
            }
            return
          }
          if (!open || results.length === 0) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, results.length - 1)) }
          if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
          if (e.key === 'Escape')    { setOpen(false) }
        }}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {results.map((r, i) => (
            <button
              key={r.symbol}
              role="option"
              aria-selected={i === active}
              className={`search-result${i === active ? ' search-result-active' : ''}`}
              onMouseDown={() => pick(r.symbol, r.name)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="search-result-symbol">{r.symbol}</span>
              <span className="search-result-name">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
