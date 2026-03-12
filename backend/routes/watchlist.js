/**
 * Watchlist Routes — PostgreSQL + Live Finnhub prices
 *
 * GET    /api/watchlist              - User's watchlist with live prices
 * POST   /api/watchlist              - Add instrument to watchlist
 * PUT    /api/watchlist/:id/alerts   - Update price alert thresholds
 * DELETE /api/watchlist/:id          - Remove from watchlist
 * GET    /api/watchlist/performance  - P&L summary
 */

const express = require('express');
const router = express.Router();
const db = require('../services/db');
const finnhub = require('../services/finnhub');
const { requireAuth } = require('../middleware/auth');

// Helper: map DB instrument + quote into enriched item
function enrichItem(dbItem, quote) {
  const currentPrice = quote?.current || 0;
  return {
    id: dbItem.id,
    symbol: dbItem.symbol,
    name: dbItem.name,
    type: dbItem.type,
    exchange: dbItem.exchange,
    current_price: currentPrice,
    change: quote?.change ?? null,
    change_pct: quote?.changePct ?? null,
    quote_source: quote?.source || 'unknown',
    alert_threshold_up: dbItem.alert_threshold_up ? parseFloat(dbItem.alert_threshold_up) : null,
    alert_threshold_down: dbItem.alert_threshold_down ? parseFloat(dbItem.alert_threshold_down) : null,
    notes: dbItem.notes || null,
    added_at: dbItem.created_at,
    performance: dbItem.purchase_price
      ? {
          purchase_price: parseFloat(dbItem.purchase_price),
          current_value: currentPrice,
          change: parseFloat((currentPrice - dbItem.purchase_price).toFixed(4)),
          change_percent: parseFloat(
            (((currentPrice - dbItem.purchase_price) / dbItem.purchase_price) * 100).toFixed(2)
          ),
        }
      : null,
  };
}

// ──────────────────────────────────────────
// GET /api/watchlist
// ──────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT w.id, w.alert_threshold_up, w.alert_threshold_down, w.notes, w.created_at,
              i.symbol, i.name, i.type, i.exchange
       FROM watchlists w
       JOIN instruments i ON i.id = w.instrument_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ watchlist: [], total_items: 0 });
    }

    // Fetch live quotes for all symbols in one batch
    const symbols = [...new Set(rows.map(r => r.symbol))];
    const quotes = await finnhub.getBatchQuotes(symbols);

    const enriched = rows.map(row => enrichItem(row, quotes[row.symbol.toUpperCase()]));

    res.json({ watchlist: enriched, total_items: enriched.length });
  } catch (error) {
    console.error('[Watchlist] GET error:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// ──────────────────────────────────────────
// POST /api/watchlist
// ──────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { symbol, alert_threshold_up, alert_threshold_down, purchase_price, notes } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Find instrument in DB
    const { rows: instruments } = await db.query(
      'SELECT * FROM instruments WHERE UPPER(symbol) = $1 AND active = true',
      [symbol.toUpperCase()]
    );

    if (instruments.length === 0) {
      return res.status(404).json({ error: `Instrument '${symbol}' not found` });
    }
    const instrument = instruments[0];

    // Check duplicate
    const { rows: existing } = await db.query(
      'SELECT id FROM watchlists WHERE user_id = $1 AND instrument_id = $2',
      [req.user.id, instrument.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Instrument already in watchlist' });
    }

    // Free tier limit
    if (req.user.subscription_tier === 'free') {
      const { rows: countRows } = await db.query(
        'SELECT COUNT(*) FROM watchlists WHERE user_id = $1',
        [req.user.id]
      );
      if (parseInt(countRows[0].count) >= 10) {
        return res.status(403).json({
          error: 'Free tier limited to 10 watchlist items. Upgrade to add more.',
        });
      }
    }

    // Insert
    const { rows } = await db.query(
      `INSERT INTO watchlists (user_id, instrument_id, alert_threshold_up, alert_threshold_down, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [
        req.user.id,
        instrument.id,
        alert_threshold_up || null,
        alert_threshold_down || null,
        notes || null,
      ]
    );

    const quote = await finnhub.getQuote(instrument.symbol);
    const watchlistRow = rows[0];

    res.status(201).json({
      message: 'Added to watchlist',
      item: enrichItem(
        {
          id: watchlistRow.id,
          symbol: instrument.symbol,
          name: instrument.name,
          type: instrument.type,
          exchange: instrument.exchange,
          alert_threshold_up: watchlistRow.alert_threshold_up,
          alert_threshold_down: watchlistRow.alert_threshold_down,
          notes: watchlistRow.notes,
          purchase_price: watchlistRow.purchase_price,
          created_at: watchlistRow.created_at,
        },
        quote
      ),
    });
  } catch (error) {
    console.error('[Watchlist] POST error:', error);
    res.status(500).json({ error: 'Failed to add item to watchlist' });
  }
});

// ──────────────────────────────────────────
// PUT /api/watchlist/:id/alerts
// ──────────────────────────────────────────
router.put('/:id/alerts', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_threshold_up, alert_threshold_down } = req.body;

    const { rows } = await db.query(
      `UPDATE watchlists
       SET alert_threshold_up = COALESCE($1, alert_threshold_up),
           alert_threshold_down = COALESCE($2, alert_threshold_down)
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [
        alert_threshold_up ?? null,
        alert_threshold_down ?? null,
        parseInt(id),
        req.user.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    res.json({ message: 'Alert thresholds updated', item: rows[0] });
  } catch (error) {
    console.error('[Watchlist] PUT alerts error:', error);
    res.status(500).json({ error: 'Failed to update alert thresholds' });
  }
});

// ──────────────────────────────────────────
// DELETE /api/watchlist/:id
// ──────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await db.query(
      'DELETE FROM watchlists WHERE id = $1 AND user_id = $2 RETURNING *',
      [parseInt(id), req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    res.json({ message: 'Removed from watchlist', removed_id: rows[0].id });
  } catch (error) {
    console.error('[Watchlist] DELETE error:', error);
    res.status(500).json({ error: 'Failed to remove item from watchlist' });
  }
});

// ──────────────────────────────────────────
// GET /api/watchlist/performance
// ──────────────────────────────────────────
router.get('/performance', requireAuth, async (req, res) => {
  try {
    // Must define this route BEFORE /:id — Express matches in order.
    // (OK here since 'performance' won't match a numeric id pattern from the other routes.)
    const { rows } = await db.query(
      `SELECT w.id, w.alert_threshold_up, w.alert_threshold_down, w.notes, w.created_at,
              i.symbol, i.name, i.type, i.exchange
       FROM watchlists w
       JOIN instruments i ON i.id = w.instrument_id
       WHERE w.user_id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.json({ summary: { total_items: 0 }, items: [] });
    }

    const symbols = [...new Set(rows.map(r => r.symbol))];
    const quotes = await finnhub.getBatchQuotes(symbols);

    let totalInvestment = 0;
    let totalCurrentValue = 0;
    const items = [];

    rows.forEach(row => {
      const quote = quotes[row.symbol.toUpperCase()];
      const currentPrice = quote?.current || 0;
      const purchasePrice = row.purchase_price ? parseFloat(row.purchase_price) : null;

      if (purchasePrice) {
        totalInvestment += purchasePrice;
        totalCurrentValue += currentPrice;
      }

      items.push({
        symbol: row.symbol,
        name: row.name,
        type: row.type,
        current_price: currentPrice,
        purchase_price: purchasePrice,
        change: purchasePrice ? parseFloat((currentPrice - purchasePrice).toFixed(4)) : null,
        change_percent: purchasePrice
          ? parseFloat((((currentPrice - purchasePrice) / purchasePrice) * 100).toFixed(2))
          : null,
        quote_source: quote?.source || 'unknown',
      });
    });

    const totalChange = totalCurrentValue - totalInvestment;

    res.json({
      summary: {
        total_items: rows.length,
        tracked_items: items.filter(i => i.purchase_price !== null).length,
        total_investment: parseFloat(totalInvestment.toFixed(2)),
        total_current_value: parseFloat(totalCurrentValue.toFixed(2)),
        total_change: parseFloat(totalChange.toFixed(2)),
        total_change_percent:
          totalInvestment > 0
            ? parseFloat(((totalChange / totalInvestment) * 100).toFixed(2))
            : 0,
      },
      items,
    });
  } catch (error) {
    console.error('[Watchlist] GET performance error:', error);
    res.status(500).json({ error: 'Failed to calculate performance' });
  }
});

module.exports = router;
