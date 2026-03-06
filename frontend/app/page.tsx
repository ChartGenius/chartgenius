'use client'

import { useState, useEffect, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

// Sidebar market quotes symbols
const SIDEBAR_SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'META', 'NVDA', 'AMZN', 'SPY']

// Ticker bar symbols — dedicated set with display name mapping
const TICKER_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'BTC-USD', 'ETH-USD', 'EURUSD', 'GBPUSD', 'GC=F', 'CL=F', 'VIX']
const TICKER_DISPLAY: Record<string, string> = {
  'SPY':     'S&P 500',
  'QQQ':     'NASDAQ',
  'DIA':     'DOW',
  'BTC-USD': 'BTC/USD',
  'ETH-USD': 'ETH/USD',
  'EURUSD':  'EUR/USD',
  'GBPUSD':  'GBP/USD',
  'GC=F':    'GOLD',
  'CL=F':    'CRUDE',
  'VIX':     'VIX',
}

const TICKER_FALLBACK = [
  { symbol: 'S&P 500', price: 5234.18, change: 0.42 },
  { symbol: 'NASDAQ',  price: 16432.90, change: 0.68 },
  { symbol: 'DOW',     price: 38996.39, change: 0.18 },
  { symbol: 'BTC/USD', price: 67420.50, change: -1.23 },
  { symbol: 'ETH/USD', price: 3512.80,  change: 2.14 },
  { symbol: 'EUR/USD', price: 1.0852,   change: -0.08 },
  { symbol: 'GBP/USD', price: 1.2634,   change: 0.12 },
  { symbol: 'GOLD',    price: 2312.40,  change: 0.31 },
  { symbol: 'CRUDE',   price: 83.72,    change: -0.55 },
  { symbol: 'VIX',     price: 14.32,    change: -3.21 },
]

const CATEGORIES = ['All', 'Equities', 'Forex', 'Crypto', 'Commodities', 'Macro', 'Calendar']

const NEWS_CAT_MAP: Record<string, string> = {
  All: 'all',
  Equities: 'stocks',
  Forex: 'forex',
  Crypto: 'crypto',
  Commodities: 'commodities',
  Macro: 'economy',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(price: number, dec = 2) {
  return price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

function fmtPct(pct: number) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`
}

function fmtTime(dateStr: string) {
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

function fmtEventTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return dateStr }
}

// ─── Ticker Bar ──────────────────────────────────────────────────────────────

function TickerBar({ tickerQuotes }: { tickerQuotes: Record<string, Quote> }) {
  const items = Object.keys(tickerQuotes).length > 0
    ? TICKER_SYMBOLS
        .filter(sym => tickerQuotes[sym])
        .map(sym => {
          const q = tickerQuotes[sym]
          return {
            symbol: TICKER_DISPLAY[sym] || sym,
            price: q.current,
            change: q.changePct,
            isReal: q.source !== 'mock',
          }
        })
    : TICKER_FALLBACK.map(t => ({ ...t, isReal: false }))

  const duped = [...items, ...items, ...items]

  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {duped.map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span className="ticker-price">
              {item.price < 10 ? fmt(item.price, 4) : item.price < 1000 ? fmt(item.price, 2) : fmt(item.price, 0)}
            </span>
            <span className={item.change >= 0 ? 'ticker-up' : 'ticker-down'}>
              {fmtPct(item.change)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── News Row ────────────────────────────────────────────────────────────────

function NewsRow({ article, index }: { article: NewsArticle; index: number }) {
  const isHigh = article.impactLabel === 'High'
  return (
    <a
      href={article.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={`news-row ${index % 2 !== 0 ? 'news-row-even' : ''}`}
    >
      <span className="news-time">{fmtTime(article.publishedAt)}</span>
      <span className="news-source">{article.source}</span>
      <span className="news-title">
        {isHigh && <span className="news-flag-high">●</span>}
        {article.title}
      </span>
      <span className="news-sentiment">
        {article.sentimentLabel === 'bullish' && <span className="sentiment-bull">▲</span>}
        {article.sentimentLabel === 'bearish' && <span className="sentiment-bear">▼</span>}
      </span>
      <span className="news-symbols">
        {article.symbols.slice(0, 2).join(' ')}
      </span>
    </a>
  )
}

// ─── Mover Row ───────────────────────────────────────────────────────────────

function MoverRow({ quote, onWatch, watched }: { quote: Quote; onWatch?: (sym: string) => void; watched?: boolean }) {
  const isUp = quote.changePct >= 0
  return (
    <div className="mover-row" title={`H: $${fmt(quote.high)}  L: $${fmt(quote.low)}  O: $${fmt(quote.open)}`}>
      <span className="mover-symbol">
        {onWatch && (
          <button
            onClick={() => onWatch(quote.symbol)}
            style={{ marginRight: 5, fontSize: 10, color: watched ? '#f0a500' : '#404050', transition: 'color 0.15s' }}
          >
            ★
          </button>
        )}
        {quote.symbol}
      </span>
      <span className="mover-price">${fmt(quote.current)}</span>
      <span className={isUp ? 'mover-up' : 'mover-down'}>{fmtPct(quote.changePct)}</span>
    </div>
  )
}

// ─── Calendar Row ────────────────────────────────────────────────────────────

function CalendarRow({ event }: { event: CalendarEvent }) {
  const dots = ['', '●', '●●', '●●●']
  const impactColor = ['', '#606070', '#f0a500', '#ff4560'][event.impact] || '#606070'
  return (
    <div className="cal-row">
      <span className="cal-time">{fmtEventTime(event.date)}</span>
      <span className="cal-impact" style={{ color: impactColor, letterSpacing: -2 }}>
        {dots[event.impact] || '●'}
      </span>
      <span className="cal-currency">{event.currency}</span>
      <span className="cal-title">
        {event.title}
        {(event.actual || event.forecast) && (
          <span style={{ color: '#606070', marginLeft: 8 }}>
            {event.actual && <span style={{ color: '#00c06a' }}>A:{event.actual} </span>}
            {event.forecast && <span>F:{event.forecast} </span>}
            {event.previous && <span>P:{event.previous}</span>}
          </span>
        )}
      </span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [clock, setClock] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [symbolSearch, setSymbolSearch] = useState('')

  // Ticker bar state — dedicated to the 10 market index/commodity symbols
  const [tickerQuotes, setTickerQuotes] = useState<Record<string, Quote>>({})

  // Sidebar quotes — tech stocks & market ETFs
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null)

  const [watchlist, setWatchlist] = useState<string[]>([])

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [newsError, setNewsError] = useState<string | null>(null)

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Offline
  useEffect(() => {
    const off = () => setIsOffline(true)
    const on  = () => setIsOffline(false)
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    setIsOffline(!navigator.onLine)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
  }, [])

  // Watchlist persistence
  useEffect(() => {
    try { const s = localStorage.getItem('cg_wl'); if (s) setWatchlist(JSON.parse(s)) } catch {}
  }, [])
  useEffect(() => {
    try { localStorage.setItem('cg_wl', JSON.stringify(watchlist)) } catch {}
  }, [watchlist])

  // Fetch ticker bar quotes (SPY, QQQ, DIA, BTC-USD, etc.)
  const fetchTickerQuotes = useCallback(async () => {
    if (isOffline) return
    try {
      const syms = TICKER_SYMBOLS.join(',')
      const res = await fetch(`${API_BASE}/api/market-data/batch?symbols=${syms}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.success && j.data) setTickerQuotes(j.data)
    } catch (err) {
      console.warn('[TickerBar] fetch failed:', err)
    }
  }, [isOffline])

  // Fetch sidebar quotes (AAPL, GOOGL, TSLA, MSFT, META, NVDA)
  const fetchQuotes = useCallback(async () => {
    if (isOffline) return
    try {
      const res = await fetch(`${API_BASE}/api/market-data/batch?symbols=${SIDEBAR_SYMBOLS.join(',')}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.success && j.data) setQuotes(j.data)
    } catch (err) {
      console.warn('[MarketQuotes] fetch failed:', err)
    } finally {
      setLoadingQuotes(false)
    }
  }, [isOffline])

  // Fetch market status
  const fetchStatus = useCallback(async () => {
    if (isOffline) return
    try {
      const res = await fetch(`${API_BASE}/api/market-data/status?exchange=US`)
      if (!res.ok) return
      const j = await res.json()
      if (j.success) setMarketStatus(j.data)
    } catch {}
  }, [isOffline])

  // Fetch economic calendar
  const fetchCalendar = useCallback(async () => {
    if (isOffline) return
    try {
      const res = await fetch(`${API_BASE}/api/calendar/today`)
      if (!res.ok) return
      const j = await res.json()
      if (j.success) setCalendarEvents(j.data.slice(0, 20))
    } catch {}
  }, [isOffline])

  // Fetch news
  const fetchNews = useCallback(async (cat: string, sym?: string) => {
    if (isOffline) { setLoadingNews(false); return }
    setLoadingNews(true)
    setNewsError(null)
    try {
      let url: string
      if (sym?.trim()) {
        url = `${API_BASE}/api/feed/news/symbol/${encodeURIComponent(sym.trim().toUpperCase())}?limit=40`
      } else {
        const apiCat = NEWS_CAT_MAP[cat] || 'all'
        const p = new URLSearchParams({ limit: '40' })
        if (apiCat !== 'all') p.set('category', apiCat)
        url = `${API_BASE}/api/feed/news?${p.toString()}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const j = await res.json()
      if (j.success) setNewsArticles(j.data || [])
      else throw new Error(j.error || 'API error')
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : 'Unknown error')
      setNewsArticles([])
    } finally {
      setLoadingNews(false)
    }
  }, [isOffline])

  // Initial data load
  useEffect(() => {
    fetchTickerQuotes()
    fetchQuotes()
    fetchStatus()
    fetchCalendar()
    fetchNews('All')
  }, [fetchTickerQuotes, fetchQuotes, fetchStatus, fetchCalendar, fetchNews])

  // Auto-refresh every 30 seconds — ticker bar
  useEffect(() => {
    const t = setInterval(fetchTickerQuotes, 30_000)
    return () => clearInterval(t)
  }, [fetchTickerQuotes])

  // Auto-refresh every 30 seconds — sidebar quotes
  useEffect(() => {
    const t = setInterval(fetchQuotes, 30_000)
    return () => clearInterval(t)
  }, [fetchQuotes])

  // Handle category change
  const handleCategory = (cat: string) => {
    setActiveCategory(cat)
    if (cat !== 'Calendar') fetchNews(cat)
  }

  // Debounced symbol search
  useEffect(() => {
    const t = setTimeout(() => {
      if (symbolSearch.trim()) fetchNews(activeCategory, symbolSearch)
      else fetchNews(activeCategory)
    }, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolSearch])

  const toggleWatch = (sym: string) => {
    setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym])
  }

  const quoteList  = Object.values(quotes)
  const gainers    = [...quoteList].sort((a, b) => b.changePct - a.changePct).slice(0, 4)
  const losers     = [...quoteList].sort((a, b) => a.changePct - b.changePct).slice(0, 4)
  const showCalendar = activeCategory === 'Calendar'

  // Determine data quality for status indicator
  const hasRealTickerData = Object.values(tickerQuotes).some(q => q.source === 'finnhub')

  return (
    <>
      {/* ── Ticker Bar ─────────────────────────────────────────────────────── */}
      <TickerBar tickerQuotes={tickerQuotes} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="header-left">
          <span className="logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18" />
            </svg>
            ChartGenius
          </span>
          <span className="logo-badge">BETA</span>
        </div>

        <nav className="header-nav">
          {['Markets', 'News', 'Analysis', 'Calendar', 'Portfolio'].map(item => (
            <button key={item} className="nav-item">{item}</button>
          ))}
        </nav>

        <div className="header-right">
          {marketStatus && (
            <span className={`market-status ${marketStatus.isOpen ? 'market-open' : 'market-closed'}`}>
              <span className={`status-dot ${marketStatus.isOpen ? 'dot-open' : 'dot-closed'}`} />
              {marketStatus.isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          )}
          {!marketStatus && (
            <span className="market-status market-closed">
              <span className="status-dot dot-closed" />
              US EQUITIES
            </span>
          )}
          <span className="live-time">{clock}</span>
          <button className="login-btn">Sign In</button>
          <button className="pro-btn">PRO</button>
        </div>
      </header>

      {/* ── Offline Banner ─────────────────────────────────────────────────── */}
      {isOffline && (
        <div className="offline-banner">⊗ OFFLINE — displaying cached data. Reconnect for live prices.</div>
      )}

      {/* ── Category Tabs ──────────────────────────────────────────────────── */}
      <div className="cat-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategory(cat)}
            className={`cat-tab ${activeCategory === cat ? 'cat-tab-active' : ''}`}
          >
            {cat}
          </button>
        ))}
        <div className="cat-tabs-spacer" />
        <input
          type="text"
          className="symbol-search"
          placeholder="Search symbol..."
          value={symbolSearch}
          onChange={e => setSymbolSearch(e.target.value)}
        />
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="main-content">

        {/* Left: News/Calendar Feed (70%) */}
        <div className="news-feed">
          {/* Feed header bar */}
          <div className="feed-header">
            <span className="feed-title">
              <span className="live-dot" />
              {showCalendar ? 'ECONOMIC CALENDAR' : 'LIVE NEWS FEED'}
            </span>
            {!showCalendar && (
              <span style={{ fontSize: 10.5, color: '#404050', marginLeft: 12 }}>
                {hasRealTickerData ? '● LIVE DATA' : '○ SIMULATED'}
              </span>
            )}
            <span className="feed-count">
              {showCalendar ? `${calendarEvents.length} events` : `${newsArticles.length} articles`}
            </span>
            {!showCalendar && (
              <button onClick={() => fetchNews(activeCategory, symbolSearch)} className="refresh-btn">↻</button>
            )}
          </div>

          {/* Column headers for news */}
          {!showCalendar && (
            <div className="feed-col-header" style={{
              display: 'grid',
              gridTemplateColumns: '36px 80px 1fr auto auto',
              gap: '0 8px',
              padding: '4px 14px',
              borderBottom: '1px solid #1c1c24',
              background: '#0f0f12',
            }}>
              {['AGO', 'SOURCE', 'HEADLINE', '', 'SYMS'].map((h, i) => (
                <span key={i} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', color: '#404050', textAlign: i === 0 ? 'right' : 'left' }}>
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* Calendar view */}
          {showCalendar && (
            <>
              <div className="cal-header">
                <span>TIME</span>
                <span>IMP</span>
                <span>CCY</span>
                <span>EVENT</span>
              </div>
              {calendarEvents.length > 0
                ? calendarEvents.map(ev => <CalendarRow key={ev.id} event={ev} />)
                : <div className="feed-empty">No events scheduled today.</div>
              }
            </>
          )}

          {/* News view */}
          {!showCalendar && (
            <div className="news-list">
              {loadingNews
                ? Array.from({ length: 20 }).map((_, i) => <div key={i} className="news-row-skeleton" />)
                : newsError
                  ? (
                    <div className="feed-empty">
                      <p>⚠ Could not load feed — {newsError}</p>
                      <button onClick={() => fetchNews(activeCategory, symbolSearch)} className="retry-btn">↻ Retry</button>
                    </div>
                  )
                  : newsArticles.length > 0
                    ? newsArticles.map((a, i) => <NewsRow key={a.id} article={a} index={i} />)
                    : <div className="feed-empty">No articles found{symbolSearch ? ` for "${symbolSearch.toUpperCase()}"` : ''}.</div>
              }
            </div>
          )}
        </div>

        {/* Right: Sidebar (30%) */}
        <div className="sidebar">

          {/* Market Quotes */}
          <div className="sidebar-section">
            <div className="sidebar-title">MARKET QUOTES</div>
            {loadingQuotes
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="mover-row-skeleton" style={{ margin: '4px 14px', height: 27 }} />)
              : quoteList.length > 0
                ? quoteList.map(q => (
                  <MoverRow
                    key={q.symbol}
                    quote={q}
                    onWatch={toggleWatch}
                    watched={watchlist.includes(q.symbol)}
                  />
                ))
                : <div className="feed-empty" style={{ fontSize: 11 }}>Backend not responding</div>
            }
          </div>

          {/* Top Gainers */}
          {gainers.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-title sidebar-title-gain">▲ TOP GAINERS</div>
              {gainers.map(q => <MoverRow key={q.symbol} quote={q} />)}
            </div>
          )}

          {/* Top Losers */}
          {losers.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-title sidebar-title-loss">▼ TOP LOSERS</div>
              {losers.map(q => <MoverRow key={q.symbol} quote={q} />)}
            </div>
          )}

          {/* Watchlist */}
          <div className="sidebar-section">
            <div className="sidebar-title">★ WATCHLIST</div>
            {watchlist.length === 0 ? (
              <div className="watchlist-empty">Click ★ next to a symbol to track it</div>
            ) : (
              watchlist.map(sym => (
                <div key={sym} className="mover-row">
                  <span className="mover-symbol">{sym}</span>
                  {quotes[sym]
                    ? <>
                        <span className="mover-price">${fmt(quotes[sym].current)}</span>
                        <span className={quotes[sym].changePct >= 0 ? 'mover-up' : 'mover-down'}>
                          {fmtPct(quotes[sym].changePct)}
                        </span>
                      </>
                    : <span className="mover-price" style={{ color: '#404050' }}>—</span>
                  }
                  <button
                    onClick={() => toggleWatch(sym)}
                    className="remove-btn"
                    style={{ display: 'block' }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick-add watchlist buttons */}
          {quoteList.some(q => !watchlist.includes(q.symbol)) && (
            <div className="sidebar-section">
              <div className="sidebar-title">QUICK ADD</div>
              <div style={{ padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {quoteList.filter(q => !watchlist.includes(q.symbol)).map(q => (
                  <button key={q.symbol} className="watchlist-add-btn" onClick={() => toggleWatch(q.symbol)}>
                    + {q.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <span>
          <strong style={{ color: '#a0a0b0' }}>ChartGenius</strong> — ApexLogics © 2025
        </span>
        <span>Data: Finnhub · RSS Aggregation · Not financial advice</span>
        <span>
          {isOffline
            ? <span style={{ color: '#ff4560' }}>● OFFLINE</span>
            : <span style={{ color: '#00c06a' }}>● CONNECTED</span>
          }
        </span>
      </footer>
    </>
  )
}
