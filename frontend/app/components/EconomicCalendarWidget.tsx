'use client'

import { useState } from 'react'
import { fmtEventTime, fmtEventDate } from '../utils/formatting'
import { CALENDAR_IMPACT_FILTERS, CALENDAR_CURRENCIES } from '../constants'
import { IconMic, IconChart, IconBuilding } from './Icons'
import type { CalendarEvent } from '../types'

interface Props {
  events: CalendarEvent[]
  loading: boolean
}

/** Normalize impact to a consistent string value */
function normalizeImpact(impact: number | string): string {
  if (typeof impact === 'string') return impact
  if (impact >= 3) return 'High'
  if (impact >= 2) return 'Medium'
  return 'Low'
}

/** Return an icon for the event type */
function typeIcon(e: CalendarEvent): React.ReactNode {
  if (e.type === 'speech')   return <IconMic size={10} />
  if (e.type === 'earnings') return <IconChart size={10} />
  if (e.type === 'holiday')  return <IconBuilding size={10} />
  return null
}

function impactColorClass(impact: number | string): string {
  const s = normalizeImpact(impact)
  if (s === 'High')   return 'ecal-impact-high'
  if (s === 'Medium') return 'ecal-impact-medium'
  return 'ecal-impact-low'
}

/**
 * Economic / earnings / speech calendar widget.
 * Filterable by impact level and currency.
 * Grouped by day.
 */
export default function EconomicCalendarWidget({ events, loading }: Props) {
  const [impactFilter, setImpactFilter]     = useState('All')
  const [currencyFilter, setCurrencyFilter] = useState('All')

  const filtered = events.filter(e => {
    const impStr = normalizeImpact(e.impact)
    const matchImpact   = impactFilter === 'All' || impStr === impactFilter
    const ccy           = (e.currency || e.country || '').toUpperCase()
    const matchCurrency = currencyFilter === 'All' || ccy === currencyFilter
    return matchImpact && matchCurrency
  })

  // Group by date
  const groups: Record<string, CalendarEvent[]> = {}
  filtered.forEach(e => {
    const dateStr = e.datetime || e.date || ''
    const dayKey  = dateStr ? fmtEventDate(dateStr) : 'Unknown'
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(e)
  })

  const getEventTime = (e: CalendarEvent) => fmtEventTime(e.datetime || e.date || '')

  const speechCount   = filtered.filter(e => e.type === 'speech').length
  const earningsCount = filtered.filter(e => e.type === 'earnings').length

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      role="region"
      aria-label="Economic calendar"
    >
      {/* Header */}
      <div className="ecal-header">
        <span className="ecal-title">
          <span style={{ color: 'var(--yellow)' }}>◈</span>
          CALENDAR
        </span>

        {speechCount > 0 && (
          <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.18)', color: '#f59e0b', padding: '2px 5px', borderRadius: 3, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <IconMic size={9} />{speechCount}
          </span>
        )}
        {earningsCount > 0 && (
          <span style={{ fontSize: 9, background: 'rgba(139,92,246,0.18)', color: '#8b5cf6', padding: '2px 5px', borderRadius: 3, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <IconChart size={9} />{earningsCount}
          </span>
        )}

        {/* Impact filter */}
        <div style={{ display: 'flex', gap: 3, marginLeft: 2 }}>
          {CALENDAR_IMPACT_FILTERS.map(f => (
            <button
              key={f}
              className={`ecal-filter-btn${impactFilter === f ? ' active' : ''}`}
              onClick={() => setImpactFilter(f)}
              aria-label={`Filter by ${f} impact`}
              aria-pressed={impactFilter === f}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Currency filter */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {CALENDAR_CURRENCIES.slice(0, 6).map(c => (
            <button
              key={c}
              className={`ecal-filter-btn${currencyFilter === c ? ' active' : ''}`}
              onClick={() => setCurrencyFilter(c)}
              aria-label={`Filter by ${c} currency`}
              aria-pressed={currencyFilter === c}
            >
              {c}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 9.5, color: 'var(--text-3)', marginLeft: 'auto' }}>
          {filtered.length} events
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '42px 20px 32px 1fr',
        gap: '0 6px',
        padding: '4px 12px',
        borderBottom: '1px solid var(--border-b)',
        background: 'var(--bg-2)',
      }}>
        {['TIME', 'IMP', 'CCY', 'EVENT & VALUES'].map((h, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-3)', textAlign: i === 0 ? 'right' : 'left' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Events */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 11, textAlign: 'center' }}>
            Loading calendar…
          </div>
        ) : Object.keys(groups).length === 0 ? (
          <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 11, textAlign: 'center' }}>
            No events match current filters.
          </div>
        ) : (
          Object.entries(groups).map(([day, dayEvents]) => (
            <div key={day} className="ecal-day-group">
              <div className="ecal-day-label">{day}</div>
              {dayEvents.map(ev => {
                const icon = typeIcon(ev)
                const ccy  = (ev.currency || ev.country || '').toUpperCase()
                return (
                  <div
                    key={ev.id}
                    className="ecal-event"
                    style={
                      ev.type === 'speech'   ? { borderLeft: '2px solid #f59e0b' } :
                      ev.type === 'earnings' ? { borderLeft: '2px solid #8b5cf6' } : {}
                    }
                  >
                    <span className="ecal-time">{getEventTime(ev)}</span>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {icon ? (
                        <span style={{ fontSize: 10 }}>{icon}</span>
                      ) : (
                        <span className={`ecal-impact-dot ${impactColorClass(ev.impact)}`} />
                      )}
                    </div>
                    <span className="ecal-currency">{ccy}</span>
                    <div className="ecal-body">
                      <span
                        className="ecal-event-name"
                        style={
                          ev.type === 'speech'   ? { color: '#f59e0b' } :
                          ev.type === 'earnings' ? { color: '#8b5cf6' } : {}
                        }
                      >
                        {ev.title}
                      </span>
                      {(ev.actual || ev.forecast || ev.previous) && (
                        <div className="ecal-values">
                          {ev.actual   && <span className="ecal-actual">A: {ev.actual}</span>}
                          {ev.forecast && <span className="ecal-forecast">F: {ev.forecast}</span>}
                          {ev.previous && <span className="ecal-previous">P: {ev.previous}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
