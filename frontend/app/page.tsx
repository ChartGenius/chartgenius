'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

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

interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string | null
  source: string
  category: string
  publishedAt: string
  sentimentScore: number
  sentimentLabel: 'bullish' | 'bearish' | 'neutral'
  impactScore: number
  impactLabel: 'High' | 'Medium' | 'Low'
  tags: string[]
  symbols: string[]
  imageUrl: string | null
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const FALLBACK_SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT']

const NEWS_CATEGORIES = ['all', 'markets', 'crypto', 'forex', 'economy', 'stocks', 'business']

// ──────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Format a price number for display */
function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Format a percentage change for display */
function formatChangePct(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

/** Format a calendar event date to a human-readable time string */
function formatEventTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return dateStr
  }
}

/** Format a publish date to relative time */
function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  } catch {
    return ''
  }
}

/** Impact level to display label + tailwind classes */
function impactLabel(impact: number): { label: string; className: string } {
  if (impact >= 3) return { label: 'High', className: 'bg-red-100 text-red-700' }
  if (impact >= 2) return { label: 'Med', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Low', className: 'bg-gray-100 text-gray-600' }
}

/** Sentiment badge styles */
function sentimentBadge(label: string): { emoji: string; className: string } {
  switch (label) {
    case 'bullish':
      return { emoji: '↑', className: 'bg-green-100 text-green-700' }
    case 'bearish':
      return { emoji: '↓', className: 'bg-red-100 text-red-700' }
    default:
      return { emoji: '→', className: 'bg-gray-100 text-gray-600' }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

/** Animated skeleton block */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

/** Offline / API error banner */
function AlertBanner({ message, type = 'warning' }: { message: string; type?: 'warning' | 'error' | 'offline' }) {
  const styles = {
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    offline: 'bg-orange-50 border-orange-200 text-orange-800',
  }
  const icons = { warning: '⚠️', error: '❌', offline: '📡' }

  return (
    <div className={`border-b px-4 py-2 text-sm text-center ${styles[type]}`}>
      {icons[type]} {message}
    </div>
  )
}

/** Market card with Add to Watchlist button */
function MarketCard({
  quote,
  isWatchlisted,
  onToggleWatchlist,
}: {
  quote: Quote
  isWatchlisted: boolean
  onToggleWatchlist: (symbol: string) => void
}) {
  const isUp = quote.changePct >= 0

  return (
    <div className="p-4 border rounded-lg hover:border-primary-300 transition-colors relative group">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{quote.symbol}</h4>
          <span className="text-xs text-gray-500 uppercase">stock</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {formatChangePct(quote.changePct)}
          </span>
          <button
            onClick={() => onToggleWatchlist(quote.symbol)}
            title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`text-lg leading-none transition-all ${
              isWatchlisted
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWatchlisted ? `Remove ${quote.symbol} from watchlist` : `Add ${quote.symbol} to watchlist`}
          >
            ★
          </button>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">${formatPrice(quote.current)}</div>
      <div className={`text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
        {quote.change >= 0 ? '+' : ''}
        {quote.change.toFixed(2)}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        H: ${formatPrice(quote.high)} · L: ${formatPrice(quote.low)}
      </div>
    </div>
  )
}

/** Watchlist item row */
function WatchlistRow({
  symbol,
  quote,
  onRemove,
}: {
  symbol: string
  quote: Quote | undefined
  onRemove: (symbol: string) => void
}) {
  if (!quote) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{symbol}</span>
          <Skeleton className="h-3 w-16" />
        </div>
        <button
          onClick={() => onRemove(symbol)}
          className="text-gray-300 hover:text-red-400 text-sm"
          aria-label={`Remove ${symbol} from watchlist`}
        >
          ✕
        </button>
      </div>
    )
  }
  const isUp = quote.changePct >= 0
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <span className="font-medium text-gray-900">{symbol}</span>
        <span className={`ml-2 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {formatChangePct(quote.changePct)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900">${formatPrice(quote.current)}</span>
        <button
          onClick={() => onRemove(symbol)}
          className="text-gray-300 hover:text-red-400 text-xs"
          aria-label={`Remove ${symbol} from watchlist`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/** News article card with sentiment badge */
function NewsCard({ article }: { article: NewsArticle }) {
  const sentiment = sentimentBadge(article.sentimentLabel)
  const impactColor =
    article.impactLabel === 'High'
      ? 'text-red-600 bg-red-50'
      : article.impactLabel === 'Medium'
      ? 'text-yellow-600 bg-yellow-50'
      : 'text-gray-500 bg-gray-50'

  return (
    <div className="border-b last:border-b-0 py-3">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400">{article.source}</span>
          <span className="text-gray-300 text-xs">·</span>
          <span className="text-xs text-gray-400">{formatRelativeTime(article.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sentiment.className}`}>
            {sentiment.emoji} {article.sentimentLabel}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${impactColor}`}>
            {article.impactLabel}
          </span>
        </div>
      </div>
      <a
        href={article.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-gray-900 hover:text-primary-600 leading-snug block"
      >
        {article.title}
      </a>
      {article.summary && (
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{article.summary}</p>
      )}
      {article.symbols.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {article.symbols.slice(0, 4).map((sym) => (
            <span key={sym} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {sym}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Time & connection state ────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isOffline, setIsOffline] = useState(false)

  // ── Market data ────────────────────────────────────────────────────────────
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [quotesError, setQuotesError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)

  // ── Watchlist ──────────────────────────────────────────────────────────────
  const [watchlist, setWatchlist] = useState<string[]>([])

  // ── Calendar ───────────────────────────────────────────────────────────────
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState(true)

  // ── News feed ─────────────────────────────────────────────────────────────
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [newsCategory, setNewsCategory] = useState<string>('all')
  const [newsSymbolFilter, setNewsSymbolFilter] = useState<string>('')

  // Debounce timer ref for symbol filter
  const symbolFilterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Live clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Offline detection ─────────────────────────────────────────────────────
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    setIsOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // ── Persist watchlist to localStorage ────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cg_watchlist')
      if (saved) setWatchlist(JSON.parse(saved))
    } catch {
      /* ignore parse errors */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('cg_watchlist', JSON.stringify(watchlist))
    } catch {
      /* ignore storage errors */
    }
  }, [watchlist])

  // ── API calls ─────────────────────────────────────────────────────────────

  /**
   * Fetch batch stock quotes from the Finnhub-backed backend
   */
  const fetchQuotes = useCallback(async () => {
    if (isOffline) return
    try {
      const symbols = FALLBACK_SYMBOLS.join(',')
      const res = await fetch(`${API_BASE}/api/market-data/batch?symbols=${symbols}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      if (json.success) {
        setQuotes(json.data)
        setLastUpdated(new Date().toLocaleTimeString())
        setQuotesError(null)
      } else {
        throw new Error(json.error || 'Unknown API error')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Frontend] Quote fetch error:', msg)
      setQuotesError(`Unable to fetch live quotes — ${msg}`)
    } finally {
      setLoadingQuotes(false)
    }
  }, [isOffline])

  /**
   * Fetch market open/close status
   */
  const fetchMarketStatus = useCallback(async () => {
    if (isOffline) return
    try {
      const res = await fetch(`${API_BASE}/api/market-data/status?exchange=US`)
      if (!res.ok) return
      const json = await res.json()
      if (json.success) setMarketStatus(json.data)
    } catch {
      // Non-critical — fail silently
    }
  }, [isOffline])

  /**
   * Fetch today's economic calendar events
   */
  const fetchCalendar = useCallback(async () => {
    if (isOffline) return
    try {
      const res = await fetch(`${API_BASE}/api/calendar/today`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.success) setCalendarEvents(json.data.slice(0, 5))
    } catch (err) {
      console.error('[Frontend] Calendar fetch error:', err)
    } finally {
      setLoadingCalendar(false)
    }
  }, [isOffline])

  /**
   * Fetch news articles from the RSS aggregator feed
   */
  const fetchNews = useCallback(
    async (category: string, symbolFilter: string) => {
      if (isOffline) {
        setLoadingNews(false)
        return
      }
      setLoadingNews(true)
      setNewsError(null)
      try {
        const params = new URLSearchParams({ limit: '12' })
        if (category && category !== 'all') params.set('category', category)

        const endpoint = symbolFilter.trim()
          ? `${API_BASE}/api/feed/news/symbol/${encodeURIComponent(symbolFilter.trim().toUpperCase())}?limit=12`
          : `${API_BASE}/api/feed/news?${params.toString()}`

        const res = await fetch(endpoint)
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const json = await res.json()

        if (json.success) {
          setNewsArticles(json.data || [])
        } else {
          throw new Error(json.error || 'Unknown API error')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error('[Frontend] News fetch error:', msg)
        setNewsError(`Unable to load news — ${msg}`)
        setNewsArticles([])
      } finally {
        setLoadingNews(false)
      }
    },
    [isOffline]
  )

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchQuotes()
    fetchMarketStatus()
    fetchCalendar()
    fetchNews('all', '')
  }, [fetchQuotes, fetchMarketStatus, fetchCalendar, fetchNews])

  // ── Auto-refresh quotes every 60 seconds ─────────────────────────────────
  useEffect(() => {
    const interval = setInterval(fetchQuotes, 60_000)
    return () => clearInterval(interval)
  }, [fetchQuotes])

  // ── Refetch news when category changes ───────────────────────────────────
  useEffect(() => {
    fetchNews(newsCategory, newsSymbolFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsCategory])

  // ── Debounced news refetch on symbol filter change ────────────────────────
  const handleSymbolFilterChange = (value: string) => {
    setNewsSymbolFilter(value)
    if (symbolFilterTimer.current) clearTimeout(symbolFilterTimer.current)
    symbolFilterTimer.current = setTimeout(() => {
      fetchNews(newsCategory, value)
    }, 500)
  }

  // ── Watchlist helpers ─────────────────────────────────────────────────────
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    )
  }, [])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol))
  }, [])

  const quoteList = Object.values(quotes)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">ChartGenius</h1>
              <span className="ml-2 text-xs text-gray-400 border border-gray-200 px-1.5 rounded">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 tabular-nums">{currentTime}</span>
              {marketStatus && (
                <span
                  className={`hidden sm:inline-flex text-xs font-medium px-2 py-1 rounded-full ${
                    marketStatus.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {marketStatus.isOpen ? '● Market Open' : '○ Market Closed'}
                </span>
              )}
              <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Banners ─────────────────────────────────────────────────────────── */}
      {isOffline && (
        <AlertBanner
          message="You're offline. Data may be stale. Reconnect to see live prices."
          type="offline"
        />
      )}
      {!isOffline && quotesError && <AlertBanner message={quotesError} type="warning" />}

      {/* ── Main Dashboard ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Trading Intelligence</h2>
          <p className="text-gray-600">
            Real-time market data, news sentiment, and portfolio tracking in one platform
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastUpdated}
              {quoteList[0]?.source === 'finnhub' && (
                <span className="ml-2 text-green-600 font-medium">● Live</span>
              )}
              {quoteList[0]?.source === 'mock' && (
                <span className="ml-2 text-yellow-500 font-medium">● Simulated</span>
              )}
            </p>
          )}
        </div>

        {/* ── Row 1: Market Overview + Stats ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Market Data */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Market Overview</h3>
                <button
                  onClick={fetchQuotes}
                  disabled={isOffline}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40"
                >
                  ↻ Refresh
                </button>
              </div>

              {loadingQuotes ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FALLBACK_SYMBOLS.map((sym) => (
                    <div key={sym} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-8 w-24 mb-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              ) : quoteList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quoteList.map((quote) => (
                    <MarketCard
                      key={quote.symbol}
                      quote={quote}
                      isWatchlisted={watchlist.includes(quote.symbol)}
                      onToggleWatchlist={toggleWatchlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="col-span-2 text-center py-10 text-gray-400">
                  <p className="text-4xl mb-2">📉</p>
                  <p className="text-sm">
                    {isOffline ? 'Offline — connect to the internet to load prices.' : 'No quote data available. Check if the backend is running.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Highlights</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Market Status</span>
                  {marketStatus ? (
                    <span
                      className={`font-medium text-sm ${
                        marketStatus.isOpen ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {marketStatus.isOpen ? '● Open' : '○ Closed'}
                    </span>
                  ) : (
                    <Skeleton className="h-4 w-16" />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Calendar Events</span>
                  <span className="text-gray-900 font-medium text-sm">
                    {loadingCalendar ? <Skeleton className="h-4 w-8 inline-block" /> : `${calendarEvents.length} today`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Quotes Tracked</span>
                  <span className="text-gray-900 font-medium text-sm">{quoteList.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Watchlist Items</span>
                  <span className="text-gray-900 font-medium text-sm">{watchlist.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1">Free</div>
                <div className="text-sm text-gray-500 mb-4">Up to 10 watchlist items</div>
                <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Calendar + Watchlist ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Economic Calendar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Economic Calendar — Today</h3>

            {loadingCalendar ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : calendarEvents.length > 0 ? (
              <div className="space-y-3">
                {calendarEvents.map((event) => {
                  const impact = impactLabel(event.impact)
                  return (
                    <div key={event.id} className="border-l-4 border-primary-400 pl-3 py-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-400">
                          {formatEventTime(event.date)} · {event.currency}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${impact.className}`}
                        >
                          {impact.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      {(event.forecast || event.previous) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {event.actual && (
                            <span>
                              Actual: <strong>{event.actual}</strong> ·{' '}
                            </span>
                          )}
                          {event.forecast && <span>Forecast: {event.forecast} · </span>}
                          {event.previous && <span>Prev: {event.previous}</span>}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
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

          {/* Watchlist */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Watchlist</h3>
              {watchlist.length > 0 && (
                <span className="text-xs text-gray-400">{watchlist.length}/10 (free)</span>
              )}
            </div>

            {watchlist.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">★</div>
                <p className="text-gray-500 text-sm mb-4">
                  Hover a market card and click ★ to track an asset
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FALLBACK_SYMBOLS.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => toggleWatchlist(sym)}
                      className="border border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 text-sm py-1.5 rounded transition-colors"
                    >
                      + {sym}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {watchlist.map((symbol) => (
                  <WatchlistRow
                    key={symbol}
                    symbol={symbol}
                    quote={quotes[symbol]}
                    onRemove={removeFromWatchlist}
                  />
                ))}
                <button
                  onClick={fetchQuotes}
                  disabled={isOffline}
                  className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40"
                >
                  ↻ Refresh prices
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 3: News Feed ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📰 Market News</h3>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Symbol filter */}
              <input
                type="text"
                value={newsSymbolFilter}
                onChange={(e) => handleSymbolFilterChange(e.target.value)}
                placeholder="Filter by symbol (e.g. BTC)"
                className="text-xs border border-gray-200 rounded px-2.5 py-1.5 w-44 focus:outline-none focus:border-primary-400"
              />

              {/* Category filter */}
              <div className="flex flex-wrap gap-1">
                {NEWS_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setNewsSymbolFilter('')
                      setNewsCategory(cat)
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      newsCategory === cat && !newsSymbolFilter
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchNews(newsCategory, newsSymbolFilter)}
                disabled={isOffline}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-40 ml-1"
              >
                ↻
              </button>
            </div>
          </div>

          {/* News content */}
          {loadingNews ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="py-3 border-b">
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : newsError ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📡</p>
              <p className="text-sm">{newsError}</p>
              <button
                onClick={() => fetchNews(newsCategory, newsSymbolFilter)}
                className="mt-3 text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                Retry
              </button>
            </div>
          ) : newsArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              {newsArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              {isOffline
                ? 'Offline — news unavailable without internet connection.'
                : `No articles found${newsSymbolFilter ? ` for "${newsSymbolFilter.toUpperCase()}"` : ''}.`}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mt-12 py-6 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          ChartGenius · ApexLogics · Market data provided by Finnhub · News via RSS aggregation
        </div>
      </footer>
    </div>
  )
}
