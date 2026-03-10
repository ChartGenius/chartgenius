/**
 * Market Data Routes (Finnhub-backed)
 *
 * GET /api/market-data/quote/:symbol          - Real-time quote
 * GET /api/market-data/batch                  - Batch quotes (POST body or ?symbols=)
 * GET /api/market-data/candles/:symbol        - OHLCV candlestick data
 * GET /api/market-data/status/:exchange       - Market open/close status
 * GET /api/market-data/news/:symbol           - Company news from Finnhub
 * GET /api/market-data/profile/:symbol        - Company profile + key metrics
 * GET /api/market-data/movers                 - Top movers (gainers/losers)
 */

const express = require('express');
const router  = express.Router();
const finnhub = require('../services/finnhub');
const cache   = require('../services/cache');

const DEFAULT_STOCK_SYMBOLS  = ['AAPL', 'GOOGL', 'TSLA', 'MSFT', 'NVDA', 'AMZN'];
const DEFAULT_FOREX_SYMBOLS  = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
const DEFAULT_CRYPTO_SYMBOLS = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT'];

// ─── Cache-control header helpers ────────────────────────────────────────────

/**
 * Market data: 30-second browser cache; data is real-time but not critical to be
 * pixel-perfect — a 30 s stale copy is fine and saves a lot of edge latency.
 */
function marketDataHeaders(res) {
  res.set('Cache-Control', 'public, max-age=30');
}

/**
 * News: 2-minute browser cache; new articles don't appear every second.
 */
function newsHeaders(res) {
  res.set('Cache-Control', 'public, max-age=120');
}

/**
 * Static data (profiles, ratings): 1-hour browser cache; rarely changes intra-day.
 */
function staticDataHeaders(res) {
  res.set('Cache-Control', 'public, max-age=3600');
}

// ─── Concurrency-limited batch fetch ─────────────────────────────────────────

/**
 * Fetch up to `concurrency` symbols at a time using Promise.allSettled.
 * Each symbol is cached independently so partial cache hits work — if 8 of 11
 * symbols are already cached, only 3 real HTTP calls go out.
 *
 * Finnhub free tier: 60 req/min. Default concurrency=5 keeps bursts safe.
 */
async function batchQuotesConcurrent(symbols, concurrency = 5) {
  const results  = {};
  const chunks   = [];

  for (let i = 0; i < symbols.length; i += concurrency) {
    chunks.push(symbols.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const settled = await Promise.allSettled(chunk.map(sym => finnhub.getQuote(sym)));
    settled.forEach((r, idx) => {
      const sym = chunk[idx].toUpperCase();
      results[sym] = r.status === 'fulfilled' ? r.value : { symbol: sym, error: r.reason?.message };
    });
  }

  return results;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /api/market-data/quote/:symbol
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await finnhub.getQuote(symbol);

    marketDataHeaders(res);
    res.json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /quote error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quote' });
  }
});

// GET /api/market-data/batch?symbols=AAPL,TSLA,MSFT
// Parallelises with max 5 concurrent Finnhub calls; each symbol cached independently
// so partial cache hits avoid redundant API calls.
router.get('/batch', async (req, res) => {
  try {
    const { symbols, type = 'stocks' } = req.query;

    let symbolList;
    if (symbols) {
      symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).slice(0, 20);
    } else {
      symbolList = type === 'crypto' ? DEFAULT_CRYPTO_SYMBOLS
        : type === 'forex'  ? DEFAULT_FOREX_SYMBOLS
        : DEFAULT_STOCK_SYMBOLS;
    }

    // Use concurrency-limited batch (max 5 parallel) with per-symbol caching
    const quotes = await batchQuotesConcurrent(symbolList, 5);

    marketDataHeaders(res);
    res.json({
      success: true,
      count: Object.keys(quotes).length,
      data: quotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /batch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch batch quotes' });
  }
});

// GET /api/market-data/candles/:symbol?resolution=D&from=1700000000&to=1710000000
router.get('/candles/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { resolution = 'D', from, to } = req.query;

    const validResolutions = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({
        success: false,
        error: `Invalid resolution. Use one of: ${validResolutions.join(', ')}`
      });
    }

    const candles = await finnhub.getCandles(
      symbol,
      resolution,
      from ? parseInt(from) : null,
      to   ? parseInt(to)   : null
    );

    // Daily candles change once per day; intraday every few minutes
    const maxAge = resolution === 'D' || resolution === 'W' || resolution === 'M' ? 3600 : 120;
    res.set('Cache-Control', `public, max-age=${maxAge}`);

    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      resolution,
      count: candles.length,
      data: candles,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /candles error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch candle data' });
  }
});

// GET /api/market-data/status?exchange=US
router.get('/status', async (req, res) => {
  try {
    const { exchange = 'US' } = req.query;
    const status = await finnhub.getMarketStatus(exchange);

    marketDataHeaders(res);
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /status error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch market status' });
  }
});

// GET /api/market-data/news/:symbol?days=7
router.get('/news/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 7 } = req.query;

    const news = await finnhub.getCompanyNews(symbol, {
      days: Math.min(parseInt(days) || 7, 30)
    });

    newsHeaders(res);
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: news.length,
      data: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /news error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch company news' });
  }
});

// GET /api/market-data/profile/:symbol — company profile + key metrics
router.get('/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const profile = await finnhub.getCompanyProfile(symbol);

    if (!profile) {
      return res.json({
        success: false,
        error: 'No profile data available',
        symbol: symbol.toUpperCase()
      });
    }

    staticDataHeaders(res);
    res.json({
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch company profile' });
  }
});

// GET /api/market-data/movers — returns top gainers/losers from default watchlist
router.get('/movers', async (req, res) => {
  try {
    const { symbols } = req.query;
    const symbolList = symbols
      ? symbols.split(',').map(s => s.trim().toUpperCase())
      : DEFAULT_STOCK_SYMBOLS;

    const quotes    = await batchQuotesConcurrent(symbolList, 5);
    const quoteList = Object.values(quotes).filter(q => q.changePct != null);

    quoteList.sort((a, b) => b.changePct - a.changePct);

    const gainers = quoteList.filter(q => q.changePct > 0).slice(0, 5);
    const losers  = [...quoteList].filter(q => q.changePct < 0).reverse().slice(0, 5);

    marketDataHeaders(res);
    res.json({
      success: true,
      gainers,
      losers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MarketData] /movers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch movers' });
  }
});

module.exports = router;
