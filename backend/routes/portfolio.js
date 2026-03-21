/**
 * Portfolio Routes — Supabase-backed
 *
 * All routes require JWT authentication.
 *
 * Holdings
 *   GET    /api/portfolio/holdings
 *   POST   /api/portfolio/holdings          — upsert (by symbol)
 *   DELETE /api/portfolio/holdings/:symbol
 *
 * Transactions (add shares / partial sell log)
 *   GET    /api/portfolio/transactions/:symbol
 *   POST   /api/portfolio/transactions
 *
 * Dividend overrides
 *   GET    /api/portfolio/dividends
 *   POST   /api/portfolio/dividends         — upsert one override
 *   DELETE /api/portfolio/dividends/:symbol/:year/:month
 *
 * Sold positions
 *   GET    /api/portfolio/sold
 *   POST   /api/portfolio/sold
 *   DELETE /api/portfolio/sold/:id
 *
 * Watchlist
 *   GET    /api/portfolio/watchlist
 *   POST   /api/portfolio/watchlist         — upsert (by symbol)
 *   DELETE /api/portfolio/watchlist/:symbol
 *
 * Bulk sync (for import-from-localStorage on login)
 *   POST   /api/portfolio/sync
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { requireAuth } = require('../middleware/auth');
const dividendLog = require('../services/dividendLog');

// All portfolio routes require auth
router.use(requireAuth);

// ─── Holdings ────────────────────────────────────────────────────────────────

router.get('/holdings', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM portfolio_holdings WHERE user_id = $1 ORDER BY buy_date ASC, symbol ASC`,
      [req.user.id]
    );
    res.json({ holdings: rows });
  } catch (e) {
    console.error('[Portfolio] GET holdings error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/holdings', async (req, res) => {
  try {
    const { symbol, company_name, sector, shares, avg_cost, buy_date, annual_dividend, div_override_annual, notes, drip_enabled } = req.body;

    if (!symbol || !shares || !avg_cost) {
      return res.status(400).json({ error: 'symbol, shares, avg_cost required' });
    }

    const { rows } = await db.query(
      `INSERT INTO portfolio_holdings
         (user_id, symbol, company_name, sector, shares, avg_cost, buy_date, annual_dividend, div_override_annual, notes, drip_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (user_id, symbol)
       DO UPDATE SET
         company_name = EXCLUDED.company_name,
         sector = EXCLUDED.sector,
         shares = EXCLUDED.shares,
         avg_cost = EXCLUDED.avg_cost,
         buy_date = EXCLUDED.buy_date,
         annual_dividend = EXCLUDED.annual_dividend,
         div_override_annual = COALESCE(EXCLUDED.div_override_annual, portfolio_holdings.div_override_annual),
         notes = EXCLUDED.notes,
         drip_enabled = EXCLUDED.drip_enabled,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, symbol.toUpperCase(), company_name, sector, shares, avg_cost, buy_date || null,
       annual_dividend || 0, div_override_annual || null, notes || null, drip_enabled || false]
    );

    const holding = rows[0];

    // Auto-backfill dividend log for this holding (non-blocking)
    // Only runs if holding is new or we force it via ?backfill=true
    if (req.query.backfill !== 'false') {
      dividendLog.backfill(req.user.id, {
        symbol: symbol.toUpperCase(),
        shares,
        buy_date: buy_date || null,
        drip_enabled: drip_enabled || false,
      }).then(result => {
        console.info(`[Portfolio] Dividend backfill for ${symbol}: ${result.inserted} inserted, ${result.skipped} skipped`);
      }).catch(err => {
        console.warn(`[Portfolio] Dividend backfill failed for ${symbol}:`, err.message);
      });
    }

    res.json({ holding });
  } catch (e) {
    console.error('[Portfolio] POST holdings error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/holdings/:symbol', async (req, res) => {
  try {
    await db.query(
      `DELETE FROM portfolio_holdings WHERE user_id = $1 AND symbol = $2`,
      [req.user.id, req.params.symbol.toUpperCase()]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[Portfolio] DELETE holding error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Transactions ─────────────────────────────────────────────────────────────

router.get('/transactions/:symbol', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pt.* FROM portfolio_transactions pt
       JOIN portfolio_holdings ph ON pt.holding_id = ph.id
       WHERE pt.user_id = $1 AND ph.symbol = $2
       ORDER BY pt.date ASC`,
      [req.user.id, req.params.symbol.toUpperCase()]
    );
    res.json({ transactions: rows });
  } catch (e) {
    console.error('[Portfolio] GET transactions error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/transactions', async (req, res) => {
  try {
    const { symbol, type, shares, price, date, notes } = req.body;
    if (!symbol || !type || !shares || !price || !date) {
      return res.status(400).json({ error: 'symbol, type, shares, price, date required' });
    }

    // Find the holding
    const { rows: holdings } = await db.query(
      `SELECT id FROM portfolio_holdings WHERE user_id = $1 AND symbol = $2`,
      [req.user.id, symbol.toUpperCase()]
    );
    if (!holdings.length) return res.status(404).json({ error: 'Holding not found' });

    const { rows } = await db.query(
      `INSERT INTO portfolio_transactions (holding_id, user_id, type, shares, price, date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [holdings[0].id, req.user.id, type, shares, price, date, notes || null]
    );
    res.json({ transaction: rows[0] });
  } catch (e) {
    console.error('[Portfolio] POST transaction error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Dividend Overrides ──────────────────────────────────────────────────────

router.get('/dividends', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM portfolio_dividend_overrides WHERE user_id = $1`,
      [req.user.id]
    );
    // Convert to DividendCell format: { "year-month-symbol": amount }
    const cell = {};
    rows.forEach(r => {
      cell[`${r.year}-${r.month}-${r.symbol}`] = parseFloat(r.amount);
    });
    res.json({ overrides: cell, raw: rows });
  } catch (e) {
    console.error('[Portfolio] GET dividends error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/dividends', async (req, res) => {
  try {
    const { symbol, year, month, amount } = req.body;
    if (!symbol || year == null || month == null || amount == null) {
      return res.status(400).json({ error: 'symbol, year, month, amount required' });
    }
    const { rows } = await db.query(
      `INSERT INTO portfolio_dividend_overrides (user_id, symbol, year, month, amount)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, symbol, year, month)
       DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
       RETURNING *`,
      [req.user.id, symbol.toUpperCase(), year, month, amount]
    );
    res.json({ override: rows[0] });
  } catch (e) {
    console.error('[Portfolio] POST dividend override error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/dividends/:symbol/:year/:month', async (req, res) => {
  try {
    await db.query(
      `DELETE FROM portfolio_dividend_overrides WHERE user_id=$1 AND symbol=$2 AND year=$3 AND month=$4`,
      [req.user.id, req.params.symbol.toUpperCase(), req.params.year, req.params.month]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[Portfolio] DELETE dividend override error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Sold Positions ──────────────────────────────────────────────────────────

router.get('/sold', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM portfolio_sold WHERE user_id = $1 ORDER BY sell_date DESC`,
      [req.user.id]
    );
    res.json({ sold: rows });
  } catch (e) {
    console.error('[Portfolio] GET sold error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/sold', async (req, res) => {
  try {
    const { symbol, company_name, sector, shares, avg_cost, sale_price, buy_date, sell_date, dividends_received, notes } = req.body;
    if (!symbol || !shares || !avg_cost || !sale_price || !sell_date) {
      return res.status(400).json({ error: 'symbol, shares, avg_cost, sale_price, sell_date required' });
    }

    // Calculate actual dividends from the log (overrides passed-in value if log has data)
    let actualDividendsReceived = dividends_received || 0;
    try {
      const logTotal = await dividendLog.getTotalForSymbol(
        req.user.id, symbol, { fromDate: buy_date || null, toDate: sell_date }
      );
      if (logTotal > 0) actualDividendsReceived = logTotal;
    } catch (err) {
      console.warn('[Portfolio] Could not calculate dividends from log for sold position:', err.message);
    }

    const { rows } = await db.query(
      `INSERT INTO portfolio_sold
         (user_id, symbol, company_name, sector, shares, avg_cost, sale_price, buy_date, sell_date, dividends_received, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [req.user.id, symbol.toUpperCase(), company_name, sector, shares, avg_cost, sale_price,
       buy_date || null, sell_date, actualDividendsReceived, notes || null]
    );

    // NOTE: Dividend log entries are NOT deleted or modified on sell.
    // Historical entries stay immutable forever.
    res.json({ sold: rows[0] });
  } catch (e) {
    console.error('[Portfolio] POST sold error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/sold/:id', async (req, res) => {
  try {
    await db.query(
      `DELETE FROM portfolio_sold WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[Portfolio] DELETE sold error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Portfolio Watchlist ─────────────────────────────────────────────────────

router.get('/watchlist', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM portfolio_watchlist WHERE user_id = $1 ORDER BY symbol`,
      [req.user.id]
    );
    res.json({ watchlist: rows });
  } catch (e) {
    console.error('[Portfolio] GET watchlist error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/watchlist', async (req, res) => {
  try {
    const { symbol, company_name, sector, target_price, notes } = req.body;
    if (!symbol) return res.status(400).json({ error: 'symbol required' });
    const { rows } = await db.query(
      `INSERT INTO portfolio_watchlist (user_id, symbol, company_name, sector, target_price, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id, symbol)
       DO UPDATE SET company_name=EXCLUDED.company_name, sector=EXCLUDED.sector,
                     target_price=EXCLUDED.target_price, notes=EXCLUDED.notes, updated_at=NOW()
       RETURNING *`,
      [req.user.id, symbol.toUpperCase(), company_name, sector || 'Other', target_price || null, notes || null]
    );
    res.json({ item: rows[0] });
  } catch (e) {
    console.error('[Portfolio] POST watchlist error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/watchlist/:symbol', async (req, res) => {
  try {
    await db.query(
      `DELETE FROM portfolio_watchlist WHERE user_id=$1 AND symbol=$2`,
      [req.user.id, req.params.symbol.toUpperCase()]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('[Portfolio] DELETE watchlist error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Bulk sync (import from localStorage on login) ───────────────────────────

router.post('/sync', async (req, res) => {
  try {
    const { holdings = [], sold = [], watchlist = [], dividendOverrides = {} } = req.body;
    const userId = req.user.id;
    const results = { holdings: 0, sold: 0, watchlist: 0, dividends: 0 };

    // Upsert holdings
    for (const h of holdings) {
      if (!h.ticker || !h.shares || !h.avgCost) continue;
      await db.query(
        `INSERT INTO portfolio_holdings
           (user_id, symbol, company_name, sector, shares, avg_cost, buy_date, annual_dividend, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (user_id, symbol) DO NOTHING`,
        [userId, h.ticker.toUpperCase(), h.company, h.sector, h.shares, h.avgCost, h.buyDate || null, h.annualDividend || 0, h.notes || null]
      );
      results.holdings++;
    }

    // Upsert sold
    for (const s of sold) {
      if (!s.ticker || !s.shares || !s.avgCost || !s.salePrice) continue;
      await db.query(
        `INSERT INTO portfolio_sold
           (user_id, symbol, company_name, sector, shares, avg_cost, sale_price, sell_date, dividends_received)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT DO NOTHING`,
        [userId, s.ticker.toUpperCase(), s.company, s.sector, s.shares, s.avgCost, s.salePrice, s.dateSold || new Date().toISOString().slice(0,10), s.totalDividendsWhileHeld || 0]
      );
      results.sold++;
    }

    // Upsert watchlist
    for (const w of watchlist) {
      if (!w.ticker) continue;
      await db.query(
        `INSERT INTO portfolio_watchlist (user_id, symbol, company_name, sector, target_price)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, symbol) DO NOTHING`,
        [userId, w.ticker.toUpperCase(), w.company, w.sector || 'Other', w.targetPrice || null]
      );
      results.watchlist++;
    }

    // Upsert dividend overrides
    for (const [key, amount] of Object.entries(dividendOverrides)) {
      const parts = key.split('-');
      if (parts.length < 3) continue;
      const month = parts[1];
      const year = parts[0];
      const symbol = parts.slice(2).join('-').toUpperCase();
      await db.query(
        `INSERT INTO portfolio_dividend_overrides (user_id, symbol, year, month, amount)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id, symbol, year, month) DO NOTHING`,
        [userId, symbol, year, month, amount]
      );
      results.dividends++;
    }

    res.json({ ok: true, imported: results });
  } catch (e) {
    console.error('[Portfolio] POST sync error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Portfolio Settings (DRIP toggles, allocation targets, home currency) ──────

router.get('/settings', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT settings FROM portfolio_settings WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ settings: rows[0]?.settings || {} });
  } catch (e) {
    // Table may not exist yet — return empty
    res.json({ settings: {} });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object required' });
    }
    await db.query(
      `INSERT INTO portfolio_settings (user_id, settings)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET settings = $2, updated_at = NOW()`,
      [req.user.id, JSON.stringify(settings)]
    );
    res.json({ ok: true });
  } catch (e) {
    // Table may not exist yet — store in fallback
    console.warn('[Portfolio] settings table missing, skipping persist');
    res.json({ ok: true, warn: 'settings not persisted' });
  }
});

// ─── Dividend Log (Immutable Ledger) ─────────────────────────────────────────

/**
 * GET /api/portfolio/dividend-log?symbol=AAPL
 * Returns all log entries for the user, optionally filtered by symbol.
 */
router.get('/dividend-log', async (req, res) => {
  try {
    const { symbol } = req.query;
    const entries = await dividendLog.getLog(req.user.id, { symbol: symbol || null });
    res.json({ entries });
  } catch (e) {
    console.error('[Portfolio] GET dividend-log error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/portfolio/dividend-log
 * Upsert a single dividend log entry.
 */
router.post('/dividend-log', async (req, res) => {
  try {
    const { symbol, payment_date, ex_date, dividend_per_share, shares_held,
            total_received, source, is_confirmed, notes } = req.body;

    if (!symbol || !payment_date || dividend_per_share == null || shares_held == null) {
      return res.status(400).json({ error: 'symbol, payment_date, dividend_per_share, shares_held required' });
    }

    const result = await dividendLog.upsertEntry(req.user.id, {
      symbol, payment_date, ex_date, dividend_per_share, shares_held,
      total_received: total_received ?? parseFloat((dividend_per_share * shares_held).toFixed(4)),
      source: source || 'manual',
      is_confirmed: is_confirmed ?? false,
      notes,
    });

    res.json(result);
  } catch (e) {
    console.error('[Portfolio] POST dividend-log error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * PUT /api/portfolio/dividend-log/:id
 * Edit a single entry (sets source='manual', is_confirmed=true).
 */
router.put('/dividend-log/:id', async (req, res) => {
  try {
    const entry = await dividendLog.updateEntry(req.user.id, req.params.id, req.body);
    res.json({ entry });
  } catch (e) {
    console.error('[Portfolio] PUT dividend-log error:', e.message);
    res.status(e.message.includes('not found') ? 404 : 500).json({ error: e.message });
  }
});

/**
 * DELETE /api/portfolio/dividend-log/:id
 * Delete an entry (only non-confirmed entries).
 */
router.delete('/dividend-log/:id', async (req, res) => {
  try {
    const result = await dividendLog.deleteEntry(req.user.id, req.params.id);
    res.json({ ok: true, deleted: result });
  } catch (e) {
    console.error('[Portfolio] DELETE dividend-log error:', e.message);
    res.status(e.message.includes('confirmed') ? 403 : 500).json({ error: e.message });
  }
});

/**
 * POST /api/portfolio/dividend-log/backfill
 * Trigger backfill for a single holding.
 * Body: { symbol, shares, buy_date, drip_enabled? }
 */
router.post('/dividend-log/backfill', async (req, res) => {
  try {
    const { symbol, shares, buy_date, drip_enabled } = req.body;
    if (!symbol || shares == null) {
      return res.status(400).json({ error: 'symbol and shares required' });
    }
    const result = await dividendLog.backfill(req.user.id, { symbol, shares, buy_date, drip_enabled });
    res.json(result);
  } catch (e) {
    console.error('[Portfolio] POST dividend-log/backfill error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/portfolio/dividend-log/backfill-all
 * Backfill all holdings for the authenticated user.
 */
router.post('/dividend-log/backfill-all', async (req, res) => {
  try {
    const results = await dividendLog.backfillAllHoldings(req.user.id);
    res.json({ results });
  } catch (e) {
    console.error('[Portfolio] POST dividend-log/backfill-all error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/portfolio/dividend-log/confirm/:id
 * Mark an entry as confirmed (is_confirmed = true).
 */
router.post('/dividend-log/confirm/:id', async (req, res) => {
  try {
    const entry = await dividendLog.confirmEntry(req.user.id, req.params.id);
    res.json({ entry });
  } catch (e) {
    console.error('[Portfolio] POST dividend-log/confirm error:', e.message);
    res.status(e.message.includes('not found') ? 404 : 500).json({ error: e.message });
  }
});

/**
 * POST /api/portfolio/dividend-log/drip/:id
 * Process DRIP for a log entry — adds shares to holding.
 * Body: { price_at_payment }
 */
router.post('/dividend-log/drip/:id', async (req, res) => {
  try {
    const { price_at_payment } = req.body;
    if (!price_at_payment || price_at_payment <= 0) {
      return res.status(400).json({ error: 'price_at_payment required and must be positive' });
    }
    const result = await dividendLog.processDRIP(req.user.id, req.params.id, price_at_payment);
    res.json(result);
  } catch (e) {
    console.error('[Portfolio] POST dividend-log/drip error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/portfolio/dividend-log/summary/:symbol
 * Get total dividends received for a symbol (with optional date range).
 * Query params: from_date, to_date
 */
router.get('/dividend-log/summary/:symbol', async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const total = await dividendLog.getTotalForSymbol(
      req.user.id,
      req.params.symbol,
      { fromDate: from_date || null, toDate: to_date || null }
    );
    res.json({ symbol: req.params.symbol.toUpperCase(), total });
  } catch (e) {
    console.error('[Portfolio] GET dividend-log/summary error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
