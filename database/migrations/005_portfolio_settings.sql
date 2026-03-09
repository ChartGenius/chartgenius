-- Portfolio settings table (DRIP, allocation targets, home currency, etc.)
CREATE TABLE IF NOT EXISTS portfolio_settings (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  settings   JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE portfolio_settings IS 'Per-user portfolio settings: DRIP toggles, allocation targets, home currency.';
