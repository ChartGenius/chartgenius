-- ================================================================
-- Migration 018: Portfolio Dividend Log (Immutable Ledger)
--
-- Adds the portfolio_dividend_log table — a persistent, immutable
-- record of dividend payments. Replaces on-the-fly recalculation.
--
-- Key design decisions:
--   - user_id is INTEGER (matches existing schema — custom JWT auth)
--   - UNIQUE(user_id, symbol, payment_date) prevents duplicates
--   - is_confirmed = true means user has verified; never auto-recalculate
--   - drip_* columns support reinvestment tracking
--   - source: 'auto' (API-calculated) vs 'manual' (user-edited)
--
-- Also adds drip_enabled column to portfolio_holdings for per-holding toggle.
--
-- Safe to run multiple times (IF NOT EXISTS + DROP POLICY IF EXISTS).
-- ================================================================

-- ── Main dividend log table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_dividend_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  payment_date DATE NOT NULL,
  ex_date DATE,
  dividend_per_share DECIMAL(10,6) NOT NULL,
  shares_held DECIMAL(15,6) NOT NULL,
  total_received DECIMAL(15,4) NOT NULL,
  source TEXT DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  is_confirmed BOOLEAN DEFAULT false,
  drip_reinvested BOOLEAN DEFAULT false,
  drip_shares_added DECIMAL(15,6),
  drip_price DECIMAL(15,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, symbol, payment_date)
);

CREATE INDEX IF NOT EXISTS idx_dividend_log_user ON portfolio_dividend_log (user_id);
CREATE INDEX IF NOT EXISTS idx_dividend_log_symbol ON portfolio_dividend_log (user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_dividend_log_date ON portfolio_dividend_log (payment_date);

-- Auto-update trigger
DROP TRIGGER IF EXISTS portfolio_dividend_log_updated_at ON portfolio_dividend_log;
CREATE TRIGGER portfolio_dividend_log_updated_at
  BEFORE UPDATE ON portfolio_dividend_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Add drip_enabled to portfolio_holdings if missing ────────────────────────

ALTER TABLE portfolio_holdings
  ADD COLUMN IF NOT EXISTS drip_enabled BOOLEAN DEFAULT false;

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.portfolio_dividend_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_dividend_log: select own"  ON public.portfolio_dividend_log;
DROP POLICY IF EXISTS "portfolio_dividend_log: insert own"  ON public.portfolio_dividend_log;
DROP POLICY IF EXISTS "portfolio_dividend_log: update own"  ON public.portfolio_dividend_log;
DROP POLICY IF EXISTS "portfolio_dividend_log: delete own"  ON public.portfolio_dividend_log;

-- Users can only see their own dividend log entries
CREATE POLICY "portfolio_dividend_log: select own"
  ON public.portfolio_dividend_log FOR SELECT
  USING (user_id = public.current_user_id());

-- Users can insert for themselves; service_role can insert for any user (backfill)
CREATE POLICY "portfolio_dividend_log: insert own"
  ON public.portfolio_dividend_log FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

-- Users can update their own entries (to edit shares_held, mark confirmed, etc.)
-- Confirmed entries: frontend enforces this — policy allows edits but UI warns
CREATE POLICY "portfolio_dividend_log: update own"
  ON public.portfolio_dividend_log FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

-- Users can delete their own unconfirmed entries only
-- (confirmed entries: policy allows, but service logic prevents it)
CREATE POLICY "portfolio_dividend_log: delete own"
  ON public.portfolio_dividend_log FOR DELETE
  USING (user_id = public.current_user_id());

-- ── Verify ───────────────────────────────────────────────────────────────────
-- After running this migration, verify with:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'portfolio_dividend_log';
--   SELECT policyname FROM pg_policies WHERE tablename = 'portfolio_dividend_log';
