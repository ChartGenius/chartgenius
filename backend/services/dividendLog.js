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
 *
 * NOTE: Migrated from db.query (direct Postgres/IPv6) to Supabase REST
 * (HTTPS/IPv4) to fix intermittent connectivity issues on Render.
 */

const { createClient } = require('@supabase/supabase-js');
const { getStockInfo } = require('./stockInfo');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getLog(userId, { symbol = null } = {}) {
  const supabase = getSupabase();
  let query = supabase
    .from('portfolio_dividend_log')
    .select('*')
    .eq('user_id', userId)
    .order('payment_date', { ascending: false });
  if (symbol) query = query.eq('symbol', symbol.toUpperCase());
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function getTotalForSymbol(userId, symbol, { fromDate = null, toDate = null } = {}) {
  const supabase = getSupabase();
  let query = supabase
    .from('portfolio_dividend_log')
    .select('total_received')
    .eq('user_id', userId)
    .eq('symbol', symbol.toUpperCase());
  if (fromDate) query = query.gte('payment_date', fromDate);
  if (toDate) query = query.lte('payment_date', toDate);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).reduce((sum, row) => sum + parseFloat(row.total_received || 0), 0);
}

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

  const supabase = getSupabase();

  // Check if confirmed entry exists first (immutable)
  const { data: existing, error: checkErr } = await supabase
    .from('portfolio_dividend_log')
    .select('*')
    .eq('user_id', userId)
    .eq('symbol', symbol.toUpperCase())
    .eq('payment_date', payment_date)
    .maybeSingle();

  if (checkErr) throw new Error(checkErr.message);

  if (existing && existing.is_confirmed) {
    return { entry: existing, skipped: true };
  }

  const payload = {
    user_id: userId,
    symbol: symbol.toUpperCase(),
    payment_date,
    ex_date,
    dividend_per_share,
    shares_held,
    total_received,
    source,
    is_confirmed,
    drip_reinvested,
    drip_shares_added,
    drip_price,
    notes,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('portfolio_dividend_log')
    .upsert(payload, { onConflict: 'user_id,symbol,payment_date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { entry: data, skipped: false };
}

async function updateEntry(userId, entryId, updates) {
  const allowedFields = ['shares_held', 'total_received', 'notes', 'dividend_per_share'];
  const payload = { source: 'manual', is_confirmed: true, updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (updates[field] !== undefined) payload[field] = updates[field];
  }
  if (Object.keys(payload).length === 3) throw new Error('No valid fields to update');

  const { data, error } = await getSupabase()
    .from('portfolio_dividend_log')
    .update(payload)
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Entry not found or unauthorized');
  return data;
}

async function confirmEntry(userId, entryId) {
  const { data, error } = await getSupabase()
    .from('portfolio_dividend_log')
    .update({ is_confirmed: true, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Entry not found or unauthorized');
  return data;
}

async function deleteEntry(userId, entryId) {
  const supabase = getSupabase();
  // Only non-confirmed entries can be deleted
  const { data: existing, error: checkErr } = await supabase
    .from('portfolio_dividend_log')
    .select('id, is_confirmed')
    .eq('id', entryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkErr) throw new Error(checkErr.message);
  if (!existing) throw new Error('Entry not found or unauthorized');
  if (existing.is_confirmed) throw new Error('Cannot delete confirmed entries');

  const { data, error } = await supabase
    .from('portfolio_dividend_log')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

async function backfill(userId, { symbol, shares, buy_date, drip_enabled = false }) {
  const upperSymbol = symbol.toUpperCase();
  const buyDate = buy_date ? new Date(buy_date) : null;

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

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  let currentShares = parseFloat(shares);
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const div of sorted) {
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
      if (result.skipped) skipped++;
      else inserted++;
    } catch (err) {
      console.error(`[DividendLog] Error inserting ${upperSymbol} ${div.date}:`, err.message);
      errors++;
    }
  }

  return { symbol: upperSymbol, inserted, skipped, errors, totalDividends: sorted.length };
}

async function backfillAllHoldings(userId) {
  const supabase = getSupabase();
  const { data: holdings, error } = await supabase
    .from('portfolio_holdings')
    .select('symbol,shares,buy_date,drip_enabled')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const results = [];
  for (const holding of (holdings || [])) {
    const { count, error: cntErr } = await supabase
      .from('portfolio_dividend_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('symbol', holding.symbol);

    if (cntErr) {
      results.push({ symbol: holding.symbol, status: 'error', error: cntErr.message });
      continue;
    }

    if (count > 0) {
      results.push({ symbol: holding.symbol, status: 'already_populated', count });
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

async function processDRIP(userId, entryId, priceAtPayment) {
  const supabase = getSupabase();
  const { data: entries, error: fetchErr } = await supabase
    .from('portfolio_dividend_log')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', userId)
    .limit(1);

  if (fetchErr) throw new Error(fetchErr.message);
  if (!entries || entries.length === 0) throw new Error('Entry not found');

  const entry = entries[0];
  if (entry.drip_reinvested) throw new Error('DRIP already processed for this entry');
  if (priceAtPayment <= 0) throw new Error('Invalid price for DRIP calculation');

  const dripSharesAdded = parseFloat((entry.total_received / priceAtPayment).toFixed(6));

  const { error: updateLogErr } = await supabase
    .from('portfolio_dividend_log')
    .update({ drip_reinvested: true, drip_shares_added: dripSharesAdded, drip_price: priceAtPayment, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', userId);

  if (updateLogErr) throw new Error(updateLogErr.message);

  // Add shares to the holding
  const { data: holding, error: holdingErr } = await supabase
    .from('portfolio_holdings')
    .select('shares')
    .eq('user_id', userId)
    .eq('symbol', entry.symbol)
    .maybeSingle();

  if (holdingErr) throw new Error(holdingErr.message);

  if (holding) {
    const { error: updateHoldingErr } = await supabase
      .from('portfolio_holdings')
      .update({ shares: parseFloat(holding.shares) + dripSharesAdded, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('symbol', entry.symbol);
    if (updateHoldingErr) throw new Error(updateHoldingErr.message);
  }

  return {
    symbol: entry.symbol,
    dripSharesAdded,
    priceAtPayment,
    totalReceived: entry.total_received,
    newShares: null,
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
