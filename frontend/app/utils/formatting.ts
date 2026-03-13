import { formatEventTime, formatEventDate } from '../lib/timezone'

/** Format a price number to a locale string with `dec` decimal places. */
export function fmt(price: number | null | undefined, dec = 2): string {
  if (price == null || isNaN(price)) return '—'
  return price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

/** Format a percentage with sign prefix. */
export function fmtPct(pct: number | null | undefined): string {
  if (pct == null || isNaN(pct)) return '—'
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

/** Format a market-cap value as T/B/M suffix. */
export function fmtMarketCap(val: number | null): string {
  if (!val) return '—'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(2)}M`
  return `$${val.toLocaleString()}`
}

/** Format a timestamp as a human-readable "time ago" string. */
export function fmtTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  } catch { return '' }
}

/** Format a calendar event time string. */
export function fmtEventTime(dateStr: string): string {
  return formatEventTime(dateStr) || dateStr
}

/** Format a calendar event date string. */
export function fmtEventDate(dateStr: string): string {
  return formatEventDate(dateStr) || dateStr
}
