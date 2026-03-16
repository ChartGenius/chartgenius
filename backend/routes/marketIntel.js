/**
 * Market Intelligence Routes
 *
 * Public endpoints (no JWT required) for:
 *   GET /api/economic-indicators  — FRED macroeconomic data
 *   GET /api/insider-trades       — SEC EDGAR + Finnhub insider transactions
 *   GET /api/earnings-calendar    — Upcoming earnings (Finnhub)
 *   GET /api/ipo-calendar         — Upcoming IPOs (Finnhub)
 *
 * Rate limit: 100 req/min per IP (via express-rate-limit)
 */

'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const fredService = require('../services/fred');
const secEdgar = require('../services/secEdgar');
const finnhub = require('../services/finnhub');

// ─── Per-route rate limit: 100 req/min per IP ─────────────────────────────────

const intelLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── GET /api/economic-indicators ────────────────────────────────────────────

router.get('/economic-indicators', intelLimiter, async (req, res) => {
  try {
    const data = await fredService.getAllIndicators();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Route] /economic-indicators error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch economic indicators' });
  }
});

// ─── GET /api/insider-trades ──────────────────────────────────────────────────

router.get('/insider-trades', intelLimiter, async (req, res) => {
  const symbol = req.query.symbol ? req.query.symbol.toUpperCase().trim() : null;

  try {
    // Fetch from both SEC EDGAR and Finnhub in parallel
    const [secData, finnhubData] = await Promise.allSettled([
      secEdgar.getRecentActivity({ symbol }),
      symbol ? finnhub.getInsiderTransactions(symbol) : Promise.resolve({ data: [] }),
    ]);

    const secItems = secData.status === 'fulfilled' ? secData.value : [];
    const finnhubItems = finnhubData.status === 'fulfilled'
      ? (finnhubData.value?.data || []).map(t => ({
          title: `${t.transactionType}: ${t.symbol} — ${t.name}`,
          summary: `${t.transactionType} ${Math.abs(t.change || 0).toLocaleString()} shares on ${t.transactionDate || 'N/A'}`,
          url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${t.symbol}&type=4&dateb=&owner=include&count=10`,
          source: 'Finnhub',
          category: 'insider',
          ticker: t.symbol,
          filingType: '4',
          date: t.transactionDate || t.filingDate || new Date().toISOString(),
          transactionType: t.transactionType,
          shares: Math.abs(t.change || 0),
          name: t.name,
        }))
      : [];

    // Merge and deduplicate by title+date
    const seen = new Set();
    const combined = [...secItems, ...finnhubItems].filter(item => {
      const key = `${item.title}:${item.date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({
      success: true,
      data: combined,
      symbol: symbol || null,
      count: combined.length,
    });
  } catch (err) {
    console.error('[Route] /insider-trades error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch insider trades' });
  }
});

// ─── GET /api/earnings-calendar ──────────────────────────────────────────────

router.get('/earnings-calendar', intelLimiter, async (req, res) => {
  const { from, to } = req.query;

  try {
    const data = await finnhub.getEarningsCalendar({ from, to });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Route] /earnings-calendar error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch earnings calendar' });
  }
});

// ─── GET /api/ipo-calendar ────────────────────────────────────────────────────

router.get('/ipo-calendar', intelLimiter, async (req, res) => {
  const { from, to } = req.query;

  try {
    const data = await finnhub.getIPOCalendar({ from, to });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Route] /ipo-calendar error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch IPO calendar' });
  }
});

module.exports = router;
