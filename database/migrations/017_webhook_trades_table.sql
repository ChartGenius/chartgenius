-- ================================================================
-- Migration 017: Webhook Trades Table
--
-- Dedicated table for trades auto-created by TradingView webhooks.
-- Replaces the complex user_data JSON blob approach.
-- ================================================================

CREATE TABLE IF NOT EXISTS webhook_trades (
    id              SERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id        INTEGER REFERENCES webhook_events(id),
    symbol          VARCHAR(20) NOT NULL,
    direction       VARCHAR(10) NOT NULL CHECK (direction IN ('Long', 'Short')),
    asset_class     VARCHAR(20) DEFAULT 'Stock',
    entry_price     NUMERIC(14,4),
    exit_price      NUMERIC(14,4),
    quantity        NUMERIC(12,4) DEFAULT 1,
    strategy        VARCHAR(100),
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    source          VARCHAR(20) DEFAULT 'webhook',
    traded_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_trades_user   ON webhook_trades (user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_trades_symbol ON webhook_trades (symbol, user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE webhook_trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS webhook_trades_select_own ON webhook_trades;
CREATE POLICY webhook_trades_select_own
    ON webhook_trades FOR SELECT
    USING (auth.uid() = user_id);

-- Service role has full access (for webhook receiver)
DROP POLICY IF EXISTS webhook_trades_service_role ON webhook_trades;
CREATE POLICY webhook_trades_service_role
    ON webhook_trades FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Also update webhook_events status check to include 'test'
-- (already added in earlier migrations; this is a no-op if already present)

-- =============================================================================
