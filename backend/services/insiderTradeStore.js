/**
 * Insider Trade Store — Persistent Supabase ingestion service.
 *
 * Rolling 90-day window: records older than 90 days are pruned after every
 * ingestion cycle to keep the table small (~5,000–10,000 rows, ~5MB max).
 *
 * NOTE: Migrated from db.query (direct Postgres/IPv6) to Supabase REST
 * (HTTPS/IPv4) to fix intermittent connectivity issues on Render.
 *
 * EXCEPTION: ensureTable() still uses db.query because DDL (CREATE TABLE,
 * CREATE INDEX, ALTER TABLE) is not supported via Supabase REST/JS client.
 * ensureTable() is called only during local setup / migrations, not on
 * production request paths.
 */

'use strict';

const { createClient } = require('@supabase/supabase-js');
const db = require('./db'); // kept only for DDL in ensureTable()

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ─── Table Bootstrap ──────────────────────────────────────────────────────────

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS insider_trades (
      id SERIAL PRIMARY KEY,
      ticker VARCHAR(10) NOT NULL,
      company_name VARCHAR(255),
      insider_name VARCHAR(255) NOT NULL,
      officer_title VARCHAR(255),
      transaction_type VARCHAR(50) NOT NULL,
      shares NUMERIC,
      price_per_share NUMERIC(12,4),
      transaction_value NUMERIC(14,2),
      holdings_after NUMERIC,
      filing_date DATE NOT NULL,
      filing_url TEXT,
      accession_number VARCHAR(30),
      cik VARCHAR(15),
      source VARCHAR(20) NOT NULL DEFAULT 'SEC EDGAR',
      source_api VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(ticker, insider_name, filing_date, transaction_type, shares)
    )
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_insider_trades_ticker ON insider_trades(ticker)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_insider_trades_date ON insider_trades(filing_date DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_insider_trades_type ON insider_trades(transaction_type)`);

  try {
    await db.query(`ALTER TABLE insider_trades ENABLE ROW LEVEL SECURITY`);
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'insider_trades' AND policyname = 'public_read'
        ) THEN
          CREATE POLICY public_read ON insider_trades FOR SELECT USING (true);
        END IF;
      END
      $$
    `);
  } catch (err) {
    console.warn('[InsiderTradeStore] RLS setup skipped (non-fatal):', err.message);
  }

  console.log('[InsiderTradeStore] Table ready: insider_trades');
}

// ─── 90-Day Pruning ───────────────────────────────────────────────────────────

async function pruneOldRecords() {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const { error, count } = await getSupabase()
      .from('insider_trades')
      .delete({ count: 'exact' })
      .lt('filing_date', cutoff);

    if (error) {
      console.warn('[InsiderTradeStore] Prune error (non-fatal):', error.message);
      return 0;
    }
    if (count > 0) {
      console.log(`[InsiderTradeStore] Pruned ${count} records older than 90 days`);
    }
    return count || 0;
  } catch (err) {
    console.warn('[InsiderTradeStore] Prune error (non-fatal):', err.message);
    return 0;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _extractAccessionFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/Archives\/edgar\/data\/\d+\/(\d{18})\//);
  if (!m) return null;
  const raw = m[1];
  return `${raw.slice(0, 10)}-${raw.slice(10, 12)}-${raw.slice(12)}`;
}

function _extractCikFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/Archives\/edgar\/data\/(\d+)\//);
  return m ? m[1] : null;
}

// ─── Ingestion: EDGAR ─────────────────────────────────────────────────────────

async function ingestFromEdgar(trades) {
  if (!trades || trades.length === 0) return { inserted: 0, skipped: 0 };

  let inserted = 0;
  let skipped = 0;

  for (const trade of trades) {
    const ticker = (trade.ticker || '').trim().toUpperCase();
    const insiderName = (trade.name || '').trim();
    const filingDate = trade.date || null;
    const transactionType = (trade.transactionType || '').trim();

    if (!ticker || !insiderName || !filingDate || !transactionType) { skipped++; continue; }

    const filingUrl = trade.filingUrl || null;
    const accessionNumber = _extractAccessionFromUrl(filingUrl);
    const cik = _extractCikFromUrl(filingUrl);

    let computedTransactionValue = trade.transactionValue || null;
    if (computedTransactionValue == null) {
      const s = trade.shares != null ? parseFloat(trade.shares) : null;
      const p = trade.pricePerShare != null ? parseFloat(trade.pricePerShare) : null;
      if (s != null && p != null && s > 0 && p > 0) {
        computedTransactionValue = Math.round(s * p * 100) / 100;
      }
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('insider_trades')
        .upsert(
          {
            ticker,
            company_name: trade.companyName || null,
            insider_name: insiderName,
            officer_title: trade.officerTitle || null,
            transaction_type: transactionType,
            shares: trade.shares || null,
            price_per_share: trade.pricePerShare || null,
            transaction_value: computedTransactionValue,
            holdings_after: trade.holdingsAfter || null,
            filing_date: filingDate,
            filing_url: filingUrl,
            accession_number: accessionNumber,
            cik,
            source: 'SEC EDGAR',
            source_api: 'EFTS',
          },
          { onConflict: 'ticker,insider_name,filing_date,transaction_type,shares', ignoreDuplicates: true }
        );

      if (error) {
        console.warn('[InsiderTradeStore] EDGAR insert error:', error.message, { ticker, insiderName, filingDate });
        skipped++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.warn('[InsiderTradeStore] EDGAR insert error:', err.message, { ticker, insiderName, filingDate });
      skipped++;
    }
  }

  console.log(`[InsiderTradeStore] EDGAR ingest — inserted: ${inserted}, skipped: ${skipped}`);
  return { inserted, skipped };
}

// ─── Ingestion: Finnhub ───────────────────────────────────────────────────────

async function ingestFromFinnhub(trades) {
  if (!trades || trades.length === 0) return { inserted: 0, skipped: 0 };

  let inserted = 0;
  let skipped = 0;

  for (const trade of trades) {
    const ticker = (trade.ticker || '').trim().toUpperCase();
    const insiderName = (trade.name || '').trim();
    const filingDate = trade.date || null;
    const transactionType = (trade.transactionType || '').trim();

    if (!ticker || !insiderName || !filingDate || !transactionType) { skipped++; continue; }

    try {
      const supabase = getSupabase();

      // Prefer EDGAR — skip if a richer record already covers this trade
      const { data: existing, error: checkErr } = await supabase
        .from('insider_trades')
        .select('id')
        .eq('ticker', ticker)
        .ilike('insider_name', insiderName)
        .eq('filing_date', filingDate)
        .ilike('transaction_type', transactionType)
        .eq('source', 'SEC EDGAR')
        .limit(1);

      if (checkErr) {
        console.warn('[InsiderTradeStore] Finnhub check error:', checkErr.message);
        skipped++;
        continue;
      }

      if (existing && existing.length > 0) { skipped++; continue; }

      const { error } = await supabase
        .from('insider_trades')
        .upsert(
          {
            ticker,
            company_name: trade.companyName || null,
            insider_name: insiderName,
            officer_title: null,
            transaction_type: transactionType,
            shares: trade.shares || null,
            price_per_share: null,
            transaction_value: null,
            holdings_after: null,
            filing_date: filingDate,
            filing_url: trade.filingUrl || null,
            accession_number: null,
            cik: null,
            source: 'Finnhub',
            source_api: 'Finnhub',
          },
          { onConflict: 'ticker,insider_name,filing_date,transaction_type,shares', ignoreDuplicates: true }
        );

      if (error) {
        console.warn('[InsiderTradeStore] Finnhub insert error:', error.message, { ticker, insiderName, filingDate });
        skipped++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.warn('[InsiderTradeStore] Finnhub insert error:', err.message, { ticker, insiderName, filingDate });
      skipped++;
    }
  }

  console.log(`[InsiderTradeStore] Finnhub ingest — inserted: ${inserted}, skipped: ${skipped}`);
  return { inserted, skipped };
}

// ─── Full Ingestion Cycle ─────────────────────────────────────────────────────

async function runIngestionCycle(edgarTrades, finnhubTrades) {
  const edgarResult = await ingestFromEdgar(edgarTrades);
  const finnhubResult = await ingestFromFinnhub(finnhubTrades);
  const pruned = await pruneOldRecords();
  return { edgarResult, finnhubResult, pruned };
}

// ─── Query: Paginated Records ─────────────────────────────────────────────────

async function queryTrades({ page = 1, limit = 50, from, to, symbol, type, source } = {}) {
  const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200);
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const effectiveFrom = from && from > ninetyDaysAgo ? from : ninetyDaysAgo;

  const supabase = getSupabase();

  // Build count query
  let countQuery = supabase
    .from('insider_trades')
    .select('*', { count: 'exact', head: true })
    .gte('filing_date', effectiveFrom);

  // Build data query
  let dataQuery = supabase
    .from('insider_trades')
    .select('id,ticker,company_name,insider_name,officer_title,transaction_type,shares,price_per_share,transaction_value,holdings_after,filing_date,filing_url,accession_number,cik,source,source_api,created_at')
    .gte('filing_date', effectiveFrom)
    .order('filing_date', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + safeLimit - 1);

  if (to) { countQuery = countQuery.lte('filing_date', to); dataQuery = dataQuery.lte('filing_date', to); }
  if (symbol) {
    const s = symbol.toUpperCase().trim();
    countQuery = countQuery.eq('ticker', s);
    dataQuery = dataQuery.eq('ticker', s);
  }
  if (type) {
    const t = type.toLowerCase();
    if (t === 'buy') {
      countQuery = countQuery.or('transaction_type.ilike.%buy%,transaction_type.ilike.%purchase%');
      dataQuery = dataQuery.or('transaction_type.ilike.%buy%,transaction_type.ilike.%purchase%');
    } else if (t === 'sell') {
      countQuery = countQuery.or('transaction_type.ilike.%sell%,transaction_type.ilike.%sale%');
      dataQuery = dataQuery.or('transaction_type.ilike.%sell%,transaction_type.ilike.%sale%');
    } else if (t === 'award') {
      countQuery = countQuery.ilike('transaction_type', '%award%');
      dataQuery = dataQuery.ilike('transaction_type', '%award%');
    } else if (t === 'gift') {
      countQuery = countQuery.ilike('transaction_type', '%gift%');
      dataQuery = dataQuery.ilike('transaction_type', '%gift%');
    } else {
      countQuery = countQuery.ilike('transaction_type', type);
      dataQuery = dataQuery.ilike('transaction_type', type);
    }
  }
  if (source) {
    const s = source.toLowerCase();
    if (s === 'edgar') { countQuery = countQuery.eq('source', 'SEC EDGAR'); dataQuery = dataQuery.eq('source', 'SEC EDGAR'); }
    else if (s === 'finnhub') { countQuery = countQuery.eq('source', 'Finnhub'); dataQuery = dataQuery.eq('source', 'Finnhub'); }
  }

  const [countResult, dataResult, sourceResult] = await Promise.all([
    countQuery,
    dataQuery,
    supabase.from('insider_trades').select('source'),
  ]);

  if (countResult.error) throw new Error(countResult.error.message);
  if (dataResult.error) throw new Error(dataResult.error.message);

  const total = countResult.count || 0;

  // Source breakdown
  const sources = { edgar: 0, finnhub: 0 };
  if (sourceResult.data) {
    for (const row of sourceResult.data) {
      if (row.source === 'SEC EDGAR') sources.edgar++;
      else if (row.source === 'Finnhub') sources.finnhub++;
    }
  }

  return { data: dataResult.data || [], total, sources };
}

async function getRecordCount() {
  try {
    const { count, error } = await getSupabase()
      .from('insider_trades')
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  } catch (err) {
    return 0;
  }
}

module.exports = {
  ensureTable,
  ingestFromEdgar,
  ingestFromFinnhub,
  runIngestionCycle,
  pruneOldRecords,
  queryTrades,
  getRecordCount,
};
