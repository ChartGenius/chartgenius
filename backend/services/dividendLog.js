/**
 * Dividend Log Service
 *
 * Handles the portfolio_dividend_log table — an immutable ledger of
 * dividend payments per user/symbol.
 *
 * Key contract:
 *   - Once is_confirmed = true, entries are NEVER auto-updated
 *   - Selling shares does NOT touch historical log entries
 *   - DRIP reinvestment updates portfolio_holdings.shares
 *   - backfill() is idempotent (ON CONFLICT DO NOTHING for confirmed entries)
 */

const db = require('./db');
const { getStockInfo } = require('./stockInfo');

/**
 * Get all dividend log entries for a user (optionally filtered by symbol).
 */
async function getLog(userId, { symbol = null } = {}) {
  if (symbol) {
    const { rows } = await db.query(
      `SELECT * FROM portfolio_dividend_log
       WHERE user_id = $1 AND symbol = $2
       ORDER BY payment_date DESC`,
      [userId, symbol.toUpperCase()]
    );
    return rows;
  }
  const { rows } = await db.query(
    `SELECT * FROM portfolio_dividend_log
     WHERE user_id = $1
     ORDER BY payment_date DESC`,
    [userId]
  );
  return rows;
}

/**
 * Get total dividends received for a symbol within a date range.
 * Used by sold positions to show total dividends earned during hold period.
 */
async function getTotalForSymbol(userId, symbol, { fromDate = null, toDate = null } = {}) {
  let query = `SELECT COALESCE(SUM(total_received), 0) AS total
               FROM portfolio_dividend_log
               WHERE user_id = $1 AND symbol = $2`;
  const params = [userId, symbol.toUpperCase()];

  if (fromDate) {
    params.push(fromDate);
    query += ` AND payment_date >= $${params.length}`;
  }
  if (toDate) {
    params.push(toDate);
    query += ` AND payment_date <= $${params.length}`;
  }

  const { rows } = await db.query(query, params);
  return parseFloat(rows[0].total);
}

/**
 * Upsert a single dividend log entry.
 * If entry exists and is_confirmed = true, skip update (immutable).
 * If entry exists and not confirmed, update it (auto recalculation).
 */
async function upsertEntry(userId, entry) {
  const {
    symbol,
    payment_date,
    ex_date = null,
    dividend_per_share,
    shares_held,
    total_received,
    source = 'auto',
    is_confirmed = false,
    drip_reinvested = false,
    drip_shares_added = null,
    drip_price = null,
    notes = null,
  } = entry;

  const { rows } = await db.query(
    `INSERT INTO portfolio_dividend_log
       (user_id, symbol, payment_date, ex_date, dividend_per_share, shares_held,
        total_received, source, is_confirmed, drip_reinvested, drip_shares_added,
        drip_price, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (user_id, symbol, payment_date) DO UPDATE SET
       ex_date = EXCLUDED.ex_date,
       dividend_per_share = EXCLUDED.dividend_per_share,
       shares_held = EXCLUDED.shares_held,
       total_received = EXCLUDED.total_received,
       source = EXCLUDED.source,
       drip_reinvested = EXCLUDED.drip_reinvested,
       drip_shares_added = EXCLUDED.drip_shares_added,
       drip_price = EXCLUDED.drip_price,
       notes = COALESCE(EXCLUDED.notes, portfolio_dividend_log.notes),
       updated_at = NOW()
     WHERE portfolio_dividend_log.is_confirmed = false
     RETURNING *`,
    [userId, symbol.toUpperCase(), payment_date, ex_date, dividend_per_share, shares_held,
     total_received, source, is_confirmed, drip_reinvested, drip_shares_added, drip_price, notes]
  );

  // If rows is empty, the entry was confirmed (skipped update)
  if (rows.length === 0) {
    const { rows: existing } = await db.query(
      `SELECT * FROM portfolio_dividend_log WHERE user_id = $1 AND symbol = $2 AND payment_date = $3`,
      [userId, symbol.toUpperCase(), payment_date]
    );
    return { entry: existing[0], skipped: true };
  }

  return { entry: rows[0], skipped: false };
}

/**
 * Update a single entry (user-initiated edit).
 * Sets source = 'manual', is_confirmed = true.
 */
async function updateEntry(userId, entryId, updates) {
  const allowedFields = ['shares_held', 'total_received', 'notes', 'dividend_per_share'];
  const setClauses = [];
  const params = [userId, entryId];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      params.push(updates[field]);
      setClauses.push(`${field} = $${params.length}`);
    }
  }

  if (setClauses.length === 0) throw new Error('No valid fields to update');

  // User edit always marks as manual + confirmed
  setClauses.push(`source = 'manual'`);
  setClauses.push(`is_confirmed = true`);
  setClauses.push(`updated_at = NOW()`);

  const { rows } = await db.query(
    `UPDATE portfolio_dividend_log
     SET ${setClauses.join(', ')}
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    params
  );

  if (!rows.length) throw new Error('Entry not found or unauthorized');
  return rows[0];
}

/**
 * Confirm an entry (mark is_confirmed = true without changing values).
 */
async function confirmEntry(userId, entryId) {
  const { rows } = await db.query(
    `UPDATE portfolio_dividend_log
     SET is_confirmed = true, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    [userId, entryId]
  );
  if (!rows.length) throw new Error('Entry not found or unauthorized');
  return rows[0];
}

/**
 * Delete an entry (only non-confirmed entries).
 */
async function deleteEntry(userId, entryId) {
  const { rows } = await db.query(
    `DELETE FROM portfolio_dividend_log
     WHERE user_id = $1 AND id = $2 AND is_confirmed = false
     RETURNING id`,
    [userId, entryId]
  );
  if (!rows.length) {
    throw new Error('Entry not found, unauthorized, or already confirmed (cannot delete confirmed entries)');
  }
  return rows[0];
}

/**
 * Backfill dividend history for a holding.
 *
 * Fetches dividend history from Yahoo Finance (via getStockInfo),
 * filters to payments after buy_date, and inserts into the log.
 *
 * Skips entries that are already confirmed (is_confirmed = true).
 * Returns summary: { inserted, skipped, errors }
 */
async function backfill(userId, { symbol, shares, buy_date, drip_enabled = false }) {
  const upperSymbol = symbol.toUpperCase();
  const buyDate = buy_date ? new Date(buy_date) : null;

  // Fetch dividend history
  let stockInfo;
  try {
    stockInfo = await getStockInfo(upperSymbol);
  } catch (err) {
    throw new Error(`Failed to fetch stock info for ${upperSymbol}: ${err.message}`);
  }

  const history = stockInfo?.dividendHistory || [];
  if (!history.length) {
    return {
      symbol: upperSymbol,
      inserted: 0,
      skipped: 0,
      errors: 0,
      message: 'No dividend history available from data source',
    };
  }

  // Sort chronologically for DRIP compounding
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  let currentShares = parseFloat(shares);
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const div of sorted) {
    // Skip dividends before buy date
    if (buyDate && new Date(div.date) <= buyDate) continue;

    const totalReceived = parseFloat((div.amount * currentShares).toFixed(4));

    try {
      const result = await upsertEntry(userId, {
        symbol: upperSymbol,
        payment_date: div.date,
        dividend_per_share: div.amount,
        shares_held: currentShares,
        total_received: totalReceived,
        source: 'auto',
        is_confirmed: false,
      });

      if (result.skipped) {
        skipped++;
      } else {
        inserted++;
      }

      // DRIP: add reinvested shares (we don't have price at ex-date in this pass,
      // so DRIP compounding uses the next payment's share count if DRIP enabled)
      // Full historical DRIP price calculation would require Alpaca historical data
      // For backfill: mark drip_reinvested but don't update shares (user reviews)
    } catch (err) {
      console.error(`[DividendLog] Error inserting ${upperSymbol} ${div.date}:`, err.message);
      errors++;
    }
  }

  return { symbol: upperSymbol, inserted, skipped, errors, totalDividends: sorted.length };
}

/**
 * Backfill all holdings for a user.
 * Called on sync/login for users who don't have log entries yet.
 */
async function backfillAllHoldings(userId) {
  const { rows: holdings } = await db.query(
    `SELECT symbol, shares, buy_date, drip_enabled FROM portfolio_holdings WHERE user_id = $1`,
    [userId]
  );

  const results = [];
  for (const holding of holdings) {
    // Check if this symbol already has entries
    const { rows: existing } = await db.query(
      `SELECT COUNT(*) as cnt FROM portfolio_dividend_log WHERE user_id = $1 AND symbol = $2`,
      [userId, holding.symbol]
    );
    const hasEntries = parseInt(existing[0].cnt) > 0;
    if (hasEntries) {
      results.push({ symbol: holding.symbol, status: 'already_populated', count: existing[0].cnt });
      continue;
    }

    try {
      const result = await backfill(userId, {
        symbol: holding.symbol,
        shares: holding.shares,
        buy_date: holding.buy_date,
        drip_enabled: holding.drip_enabled,
      });
      results.push({ ...result, status: 'backfilled' });
    } catch (err) {
      results.push({ symbol: holding.symbol, status: 'error', error: err.message });
    }
  }

  return results;
}

/**
 * Process DRIP for a dividend log entry.
 * Updates the entry with drip details and adds shares to the holding.
 *
 * @param {number} userId
 * @param {number} entryId - ID in portfolio_dividend_log
 * @param {number} priceAtPayment - Stock price on payment date
 */
async function processDRIP(userId, entryId, priceAtPayment) {
  // Get the entry
  const { rows: entries } = await db.query(
    `SELECT * FROM portfolio_dividend_log WHERE id = $1 AND user_id = $2`,
    [entryId, userId]
  );
  if (!entries.length) throw new Error('Entry not found');

  const entry = entries[0];
  if (entry.drip_reinvested) throw new Error('DRIP already processed for this entry');
  if (priceAtPayment <= 0) throw new Error('Invalid price for DRIP calculation');

  const dripSharesAdded = parseFloat((entry.total_received / priceAtPayment).toFixed(6));

  // Update the log entry
  await db.query(
    `UPDATE portfolio_dividend_log
     SET drip_reinvested = true, drip_shares_added = $1, drip_price = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4`,
    [dripSharesAdded, priceAtPayment, entryId, userId]
  );

  // Add shares to the holding
  await db.query(
    `UPDATE portfolio_holdings
     SET shares = shares + $1, updated_at = NOW()
     WHERE user_id = $2 AND symbol = $3`,
    [dripSharesAdded, userId, entry.symbol]
  );

  return {
    symbol: entry.symbol,
    dripSharesAdded,
    priceAtPayment,
    totalReceived: entry.total_received,
    newShares: null, // caller can query holdings for new total
  };
}

module.exports = {
  getLog,
  getTotalForSymbol,
  upsertEntry,
  updateEntry,
  confirmEntry,
  deleteEntry,
  backfill,
  backfillAllHoldings,
  processDRIP,
};
