'use client'

import { useState, useEffect, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

interface Quote {
  symbol: string
  current: number
  change: number
  changePct: number
  high: number
  low: number
  open: number
  prevClose: number
  timestamp: string
  source: 'finnhub' | 'mock'
}

interface CalendarEvent {
  id: string
  title: string
  currency: string
  impact: number
  date: string
  actual: string | null
  forecast: string | null
  previous: string | null
  source: string
}

interface MarketStatus {
  exchange: string
  isOpen: boolean
  session?: string
  source: string
}

// Fallback data shown while loading or on error
const FALLBACK_SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT']

/**
 * Format a price number for display (adds commas, 2 decimal places)
 */
function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Format a percentage change for display (e.g., +1.23% or -0.45%)
 */
function formatChangePct(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

/**
 * Format a calendar event date to a human-readable time string
 */
function formatEventTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    })
  } catch {
    return dateStr
  }
}

/**
 * Impact level to display label + color
 */
function impactLabel(impact: number): { label: string; className: string } {
  if (impact >= 3) return { label: 'High', className: 'bg-red-100 text-red-700' }
  if (impact >= 2) return { label: 'Med', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Low', className: 'bg-gray-100 text-gray-600' }
}

// ──────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────

export default function Home() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Live clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Fetch batch stock quotes from the real Finnhub-backed backend
   */
  const fetchQuotes = useCallback(async () => {
    try {
      const symbols = FALLBACK_SYMBOLS.join(',')
      const res = await fetch(`${API_BASE}/api/market-data/batch?symbols=${symbols}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      if (json.success) {
        setQuotes(json.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setApiError(null)
      }
    } catch (err) {
      console.error('[Frontend] Quote fetch error:', err)
      setApiError('Unable to fetch live quotes — backend may be offline')
    } finally {
      setLoadingQuotes(false)
    }
  }, [])

  /**
   * Fetch market open/close status
   */
  const fetchMarketStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market-data/status?exchange=US`)
      if (!res.ok) return
      const json = await res.json()
      if (json.success) setMarketStatus(json.data)
    } catch {
      // Non-critical, fail silently
    }
  }, [])

  /**
   * Fetch today's economic calendar events
   */
  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/calendar/today`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const json = await res.json()
      if (json.success) {
        // Show at most 5 events in the preview
        setCalendarEvents(json.data.slice(0, 5))
      }
    } catch (err) {
      console.error('[Frontend] Calendar fetch error:', err)
    } finally {
      setLoadingCalendar(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    fetchQuotes()
    fetchMarketStatus()
    fetchCalendar()
  }, [fetchQuotes, fetchMarketStatus, fetchCalendar])

  // Auto-refresh quotes every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchQuotes, 60_000)
    return () => clearInterval(interval)
  }, [fetchQuotes])

  const quoteList = Object.values(quotes)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">ChartGenius</h1>
              <span className="ml-2 text-sm text-gray-500">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{currentTime}</span>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {apiError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800 text-center">
          ⚠️ {apiError}
        </div>
      )}

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            AI-Powered Trading Intelligence
          </h2>
          <p className="text-gray-600">
            Real-time market data, economic calendar, and portfolio tracking in one platform
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastUpdated}
              {quoteList[0]?.source === 'finnhub' && (
                <span className="ml-2 text-green-600 font-medium">● Live</span>
              )}
              {quoteList[0]?.source === 'mock' && (
                <span className="ml-2 text-yellow-600 font-medium">● Simulated</span>
              )}
            </p>
          )}
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Market Data */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
                <button
                  onClick={fetchQuotes}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  ↻ Refresh
                </button>
              </div>

              {loadingQuotes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FALLBACK_SYMBOLS.map(sym => (
                    <div key={sym} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quoteList.length > 0 ? quoteList.map((quote) => (
                    <div key={quote.symbol} className="p-4 border rounded-lg hover:border-primary-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{quote.symbol}</h4>
                          <span className="text-xs text-gray-500 uppercase">stock</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          quote.changePct >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatChangePct(quote.changePct)}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${formatPrice(quote.current)}
                      </div>
                      <div className={`text-sm ${
                        quote.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        H: ${formatPrice(quote.high)} · L: ${formatPrice(quote.low)}
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No quote data available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Highlights</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Market Status</span>
                  {marketStatus ? (
                    <span className={`font-medium ${marketStatus.isOpen ? 'text-green-600' : 'text-gray-500'}`}>
                      {marketStatus.isOpen ? '● Open' : '○ Closed'}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Calendar Events</span>
                  <span className="text-gray-900 font-medium">{calendarEvents.length} today</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quotes Tracked</span>
                  <span className="text-gray-900 font-medium">{quoteList.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1">Free</div>
                <div className="text-sm text-gray-600 mb-4">Basic features</div>
                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Calendar + Watchlist Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Economic Calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Economic Calendar — Today
            </h3>

            {loadingCalendar ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : calendarEvents.length > 0 ? (
              <div className="space-y-3">
                {calendarEvents.map((event) => {
                  const impact = impactLabel(event.impact)
                  return (
                    <div key={event.id} className="border-l-4 border-primary-400 pl-3 py-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {formatEventTime(event.date)} · {event.currency}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${impact.className}`}>
                          {impact.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {(event.forecast || event.previous) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {event.actual && <span>Actual: <strong>{event.actual}</strong> · </span>}
                          {event.forecast && <span>Forecast: {event.forecast} · </span>}
                          {event.previous && <span>Prev: {event.previous}</span>}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No economic events scheduled for today
              </div>
            )}

            <button
              onClick={fetchCalendar}
              className="mt-4 text-primary-600 text-sm font-medium hover:text-primary-700"
            >
              View Full Calendar →
            </button>
          </div>

          {/* Watchlist Preview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Watchlist</h3>
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">Start tracking your favorite assets</p>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                Add Assets to Watchlist
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
