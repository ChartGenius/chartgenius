-- ================================================================
-- Migration 010: Enable Row Level Security (RLS) on All Tables
-- TradVue — CRITICAL SECURITY FIX
--
-- Background
-- ----------
-- This app uses a CUSTOM JWT auth system (not Supabase Auth).
-- JWT payload structure: { userId: <integer>, email: <string>, ... }
-- All user-scoped tables use INTEGER user_id FK → public.users(id)
--
-- How policies work here
-- ----------------------
-- Supabase's auth.uid() returns a UUID from auth.users — NOT usable
-- with this schema's integer user IDs. Instead, we extract `userId`
-- from the JWT claims using auth.jwt() which Supabase populates from
-- the verified JWT on every request.
--
-- REQUIREMENT: The JWT_SECRET used by the backend must be registered
-- in Supabase Dashboard → Settings → API → JWT Secret so Supabase
-- can verify and decode the custom JWTs.
--
-- The helper function public.current_user_id() reads the `userId`
-- claim from the verified JWT and casts it to INTEGER.
--
-- Idempotency
-- -----------
-- Uses ALTER TABLE ... ENABLE ROW LEVEL SECURITY (safe to re-run)
-- and DROP POLICY IF EXISTS before each CREATE POLICY.
-- Safe to run multiple times.
--
-- DO NOT RUN without reviewing. Test in staging first.
-- ================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- HELPER: Extract integer user ID from custom JWT claims
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NULLIF(
    (auth.jwt() ->> 'userId'),
    ''
  )::INTEGER;
$$;

-- Grant execute to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.current_user_id() TO authenticated, anon;

COMMENT ON FUNCTION public.current_user_id() IS
  'Extracts the integer userId from the custom JWT claim. '
  'Returns NULL if no valid JWT or userId claim is absent.';


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: USERS TABLE
-- Users can read and update their own row only.
-- INSERT is service_role only (done via backend API at registration).
-- DELETE is service_role only (account deletion is an admin op).
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users: select own row"   ON public.users;
DROP POLICY IF EXISTS "users: update own row"   ON public.users;
DROP POLICY IF EXISTS "users: insert service"   ON public.users;
DROP POLICY IF EXISTS "users: delete service"   ON public.users;

CREATE POLICY "users: select own row"
  ON public.users
  FOR SELECT
  USING (id = public.current_user_id());

CREATE POLICY "users: update own row"
  ON public.users
  FOR UPDATE
  USING (id = public.current_user_id())
  WITH CHECK (id = public.current_user_id());

-- Service role only for INSERT (account creation via API)
CREATE POLICY "users: insert service"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role only for DELETE (account deletion via API)
CREATE POLICY "users: delete service"
  ON public.users
  FOR DELETE
  USING (auth.role() = 'service_role');


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: REFRESH TOKENS ⚠️ CRITICAL
-- Highest-risk table — contains raw auth tokens.
-- Users can only access their own tokens.
-- Token column must NEVER be readable by other users.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "refresh_tokens: select own"  ON public.refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens: insert own"  ON public.refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens: delete own"  ON public.refresh_tokens;
DROP POLICY IF EXISTS "refresh_tokens: no update"   ON public.refresh_tokens;

-- Users can only see their own tokens
CREATE POLICY "refresh_tokens: select own"
  ON public.refresh_tokens
  FOR SELECT
  USING (user_id = public.current_user_id());

-- Users/service can insert tokens for themselves only
-- (Backend inserts with service_role connection, so also allow service_role)
CREATE POLICY "refresh_tokens: insert own"
  ON public.refresh_tokens
  FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

-- Users can delete (revoke) their own tokens; service_role can too
CREATE POLICY "refresh_tokens: delete own"
  ON public.refresh_tokens
  FOR DELETE
  USING (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

-- Tokens are immutable — no UPDATE allowed (prevents token hijacking)
-- No UPDATE policy created intentionally; UPDATE is denied by default with RLS.


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: PORTFOLIO TABLES
-- All scoped to user_id. Full CRUD for own rows only.
-- ════════════════════════════════════════════════════════════════════════════

-- ── portfolio_holdings ───────────────────────────────────────────────────────

ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_holdings: select own"  ON public.portfolio_holdings;
DROP POLICY IF EXISTS "portfolio_holdings: insert own"  ON public.portfolio_holdings;
DROP POLICY IF EXISTS "portfolio_holdings: update own"  ON public.portfolio_holdings;
DROP POLICY IF EXISTS "portfolio_holdings: delete own"  ON public.portfolio_holdings;

CREATE POLICY "portfolio_holdings: select own"
  ON public.portfolio_holdings FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_holdings: insert own"
  ON public.portfolio_holdings FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_holdings: update own"
  ON public.portfolio_holdings FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_holdings: delete own"
  ON public.portfolio_holdings FOR DELETE
  USING (user_id = public.current_user_id());


-- ── portfolio_transactions ────────────────────────────────────────────────────

ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_transactions: select own"  ON public.portfolio_transactions;
DROP POLICY IF EXISTS "portfolio_transactions: insert own"  ON public.portfolio_transactions;
DROP POLICY IF EXISTS "portfolio_transactions: update own"  ON public.portfolio_transactions;
DROP POLICY IF EXISTS "portfolio_transactions: delete own"  ON public.portfolio_transactions;

CREATE POLICY "portfolio_transactions: select own"
  ON public.portfolio_transactions FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_transactions: insert own"
  ON public.portfolio_transactions FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_transactions: update own"
  ON public.portfolio_transactions FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_transactions: delete own"
  ON public.portfolio_transactions FOR DELETE
  USING (user_id = public.current_user_id());


-- ── portfolio_sold ────────────────────────────────────────────────────────────

ALTER TABLE public.portfolio_sold ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_sold: select own"  ON public.portfolio_sold;
DROP POLICY IF EXISTS "portfolio_sold: insert own"  ON public.portfolio_sold;
DROP POLICY IF EXISTS "portfolio_sold: update own"  ON public.portfolio_sold;
DROP POLICY IF EXISTS "portfolio_sold: delete own"  ON public.portfolio_sold;

CREATE POLICY "portfolio_sold: select own"
  ON public.portfolio_sold FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_sold: insert own"
  ON public.portfolio_sold FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_sold: update own"
  ON public.portfolio_sold FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_sold: delete own"
  ON public.portfolio_sold FOR DELETE
  USING (user_id = public.current_user_id());


-- ── portfolio_settings ────────────────────────────────────────────────────────
-- PK is user_id — one row per user.

ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_settings: select own"  ON public.portfolio_settings;
DROP POLICY IF EXISTS "portfolio_settings: insert own"  ON public.portfolio_settings;
DROP POLICY IF EXISTS "portfolio_settings: update own"  ON public.portfolio_settings;
DROP POLICY IF EXISTS "portfolio_settings: delete own"  ON public.portfolio_settings;

CREATE POLICY "portfolio_settings: select own"
  ON public.portfolio_settings FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_settings: insert own"
  ON public.portfolio_settings FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_settings: update own"
  ON public.portfolio_settings FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_settings: delete own"
  ON public.portfolio_settings FOR DELETE
  USING (user_id = public.current_user_id());


-- ── portfolio_dividend_overrides ──────────────────────────────────────────────

ALTER TABLE public.portfolio_dividend_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_dividend_overrides: select own"  ON public.portfolio_dividend_overrides;
DROP POLICY IF EXISTS "portfolio_dividend_overrides: insert own"  ON public.portfolio_dividend_overrides;
DROP POLICY IF EXISTS "portfolio_dividend_overrides: update own"  ON public.portfolio_dividend_overrides;
DROP POLICY IF EXISTS "portfolio_dividend_overrides: delete own"  ON public.portfolio_dividend_overrides;

CREATE POLICY "portfolio_dividend_overrides: select own"
  ON public.portfolio_dividend_overrides FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_dividend_overrides: insert own"
  ON public.portfolio_dividend_overrides FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_dividend_overrides: update own"
  ON public.portfolio_dividend_overrides FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_dividend_overrides: delete own"
  ON public.portfolio_dividend_overrides FOR DELETE
  USING (user_id = public.current_user_id());


-- ── portfolio_watchlist ───────────────────────────────────────────────────────

ALTER TABLE public.portfolio_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_watchlist: select own"  ON public.portfolio_watchlist;
DROP POLICY IF EXISTS "portfolio_watchlist: insert own"  ON public.portfolio_watchlist;
DROP POLICY IF EXISTS "portfolio_watchlist: update own"  ON public.portfolio_watchlist;
DROP POLICY IF EXISTS "portfolio_watchlist: delete own"  ON public.portfolio_watchlist;

CREATE POLICY "portfolio_watchlist: select own"
  ON public.portfolio_watchlist FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "portfolio_watchlist: insert own"
  ON public.portfolio_watchlist FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_watchlist: update own"
  ON public.portfolio_watchlist FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "portfolio_watchlist: delete own"
  ON public.portfolio_watchlist FOR DELETE
  USING (user_id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: WATCHLISTS & ALERT NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════════════════

-- ── watchlists ────────────────────────────────────────────────────────────────

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "watchlists: select own"  ON public.watchlists;
DROP POLICY IF EXISTS "watchlists: insert own"  ON public.watchlists;
DROP POLICY IF EXISTS "watchlists: update own"  ON public.watchlists;
DROP POLICY IF EXISTS "watchlists: delete own"  ON public.watchlists;

CREATE POLICY "watchlists: select own"
  ON public.watchlists FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "watchlists: insert own"
  ON public.watchlists FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "watchlists: update own"
  ON public.watchlists FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "watchlists: delete own"
  ON public.watchlists FOR DELETE
  USING (user_id = public.current_user_id());


-- ── alert_notifications ───────────────────────────────────────────────────────

ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alert_notifications: select own"  ON public.alert_notifications;
DROP POLICY IF EXISTS "alert_notifications: insert own"  ON public.alert_notifications;
DROP POLICY IF EXISTS "alert_notifications: update own"  ON public.alert_notifications;
DROP POLICY IF EXISTS "alert_notifications: delete own"  ON public.alert_notifications;

-- Users can read their own alerts
CREATE POLICY "alert_notifications: select own"
  ON public.alert_notifications FOR SELECT
  USING (user_id = public.current_user_id());

-- INSERT allowed for own user_id OR service_role (alerts are created by the backend)
CREATE POLICY "alert_notifications: insert own"
  ON public.alert_notifications FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

-- Users can update their own alerts (e.g., mark as delivered/read)
CREATE POLICY "alert_notifications: update own"
  ON public.alert_notifications FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

-- Users can delete their own alerts
CREATE POLICY "alert_notifications: delete own"
  ON public.alert_notifications FOR DELETE
  USING (user_id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: CALENDAR EVENTS
-- No user_id column — this is a global market/economic calendar.
-- Public SELECT (like market data), service_role only for writes.
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events: public read"    ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events: service write"  ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events: service update" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events: service delete" ON public.calendar_events;

CREATE POLICY "calendar_events: public read"
  ON public.calendar_events FOR SELECT
  USING (true);

CREATE POLICY "calendar_events: service write"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "calendar_events: service update"
  ON public.calendar_events FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "calendar_events: service delete"
  ON public.calendar_events FOR DELETE
  USING (auth.role() = 'service_role');


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: DASHBOARD TABLES
-- All backed by user_id INTEGER.
-- ════════════════════════════════════════════════════════════════════════════

-- ── dashboard_settings ────────────────────────────────────────────────────────
-- PK is user_id — one row per user.

ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_settings: select own"  ON public.dashboard_settings;
DROP POLICY IF EXISTS "dashboard_settings: insert own"  ON public.dashboard_settings;
DROP POLICY IF EXISTS "dashboard_settings: update own"  ON public.dashboard_settings;
DROP POLICY IF EXISTS "dashboard_settings: delete own"  ON public.dashboard_settings;

CREATE POLICY "dashboard_settings: select own"
  ON public.dashboard_settings FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "dashboard_settings: insert own"
  ON public.dashboard_settings FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_settings: update own"
  ON public.dashboard_settings FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_settings: delete own"
  ON public.dashboard_settings FOR DELETE
  USING (user_id = public.current_user_id());


-- ── dashboard_tasks ───────────────────────────────────────────────────────────

ALTER TABLE public.dashboard_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_tasks: select own"  ON public.dashboard_tasks;
DROP POLICY IF EXISTS "dashboard_tasks: insert own"  ON public.dashboard_tasks;
DROP POLICY IF EXISTS "dashboard_tasks: update own"  ON public.dashboard_tasks;
DROP POLICY IF EXISTS "dashboard_tasks: delete own"  ON public.dashboard_tasks;

CREATE POLICY "dashboard_tasks: select own"
  ON public.dashboard_tasks FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "dashboard_tasks: insert own"
  ON public.dashboard_tasks FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_tasks: update own"
  ON public.dashboard_tasks FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_tasks: delete own"
  ON public.dashboard_tasks FOR DELETE
  USING (user_id = public.current_user_id());


-- ── dashboard_activity ────────────────────────────────────────────────────────

ALTER TABLE public.dashboard_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_activity: select own"  ON public.dashboard_activity;
DROP POLICY IF EXISTS "dashboard_activity: insert own"  ON public.dashboard_activity;
DROP POLICY IF EXISTS "dashboard_activity: update own"  ON public.dashboard_activity;
DROP POLICY IF EXISTS "dashboard_activity: delete own"  ON public.dashboard_activity;

CREATE POLICY "dashboard_activity: select own"
  ON public.dashboard_activity FOR SELECT
  USING (user_id = public.current_user_id());

-- Activity can be inserted by own user or service_role (agents write activity)
CREATE POLICY "dashboard_activity: insert own"
  ON public.dashboard_activity FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

CREATE POLICY "dashboard_activity: update own"
  ON public.dashboard_activity FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_activity: delete own"
  ON public.dashboard_activity FOR DELETE
  USING (user_id = public.current_user_id());


-- ── dashboard_notifications ───────────────────────────────────────────────────

ALTER TABLE public.dashboard_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_notifications: select own"  ON public.dashboard_notifications;
DROP POLICY IF EXISTS "dashboard_notifications: insert own"  ON public.dashboard_notifications;
DROP POLICY IF EXISTS "dashboard_notifications: update own"  ON public.dashboard_notifications;
DROP POLICY IF EXISTS "dashboard_notifications: delete own"  ON public.dashboard_notifications;

CREATE POLICY "dashboard_notifications: select own"
  ON public.dashboard_notifications FOR SELECT
  USING (user_id = public.current_user_id());

-- Notifications are typically created by service_role (backend/agents),
-- but allow user-scoped inserts as well for frontend-generated notifications.
CREATE POLICY "dashboard_notifications: insert own"
  ON public.dashboard_notifications FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

-- Users can update (e.g., mark as read)
CREATE POLICY "dashboard_notifications: update own"
  ON public.dashboard_notifications FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_notifications: delete own"
  ON public.dashboard_notifications FOR DELETE
  USING (user_id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7: JOURNAL / TRADE TAGS
-- trade_tag_categories — system-wide, no user_id (public read / service write)
-- trade_tags — user_id is nullable (NULL = preset/system tag)
-- journal_trade_tags — junction table, user_id scoped
-- ════════════════════════════════════════════════════════════════════════════

-- ── trade_tag_categories ──────────────────────────────────────────────────────
-- System-defined categories. No user_id column.
-- Public read, service_role writes only.

ALTER TABLE public.trade_tag_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_tag_categories: public read"    ON public.trade_tag_categories;
DROP POLICY IF EXISTS "trade_tag_categories: service write"  ON public.trade_tag_categories;
DROP POLICY IF EXISTS "trade_tag_categories: service update" ON public.trade_tag_categories;
DROP POLICY IF EXISTS "trade_tag_categories: service delete" ON public.trade_tag_categories;

CREATE POLICY "trade_tag_categories: public read"
  ON public.trade_tag_categories FOR SELECT
  USING (true);

CREATE POLICY "trade_tag_categories: service write"
  ON public.trade_tag_categories FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "trade_tag_categories: service update"
  ON public.trade_tag_categories FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "trade_tag_categories: service delete"
  ON public.trade_tag_categories FOR DELETE
  USING (auth.role() = 'service_role');


-- ── trade_tags ────────────────────────────────────────────────────────────────
-- user_id is nullable: NULL means system preset (visible to everyone).
-- Users can only create/modify/delete their own custom tags.

ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_tags: select own and presets"  ON public.trade_tags;
DROP POLICY IF EXISTS "trade_tags: insert own"              ON public.trade_tags;
DROP POLICY IF EXISTS "trade_tags: update own"              ON public.trade_tags;
DROP POLICY IF EXISTS "trade_tags: delete own"              ON public.trade_tags;
DROP POLICY IF EXISTS "trade_tags: service manage presets"  ON public.trade_tags;

-- Users can see their own tags AND system presets (user_id IS NULL)
CREATE POLICY "trade_tags: select own and presets"
  ON public.trade_tags FOR SELECT
  USING (
    user_id IS NULL                     -- system presets visible to all
    OR user_id = public.current_user_id()
  );

-- Users can only create tags for themselves
CREATE POLICY "trade_tags: insert own"
  ON public.trade_tags FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR (user_id IS NULL AND auth.role() = 'service_role')  -- service creates presets
  );

-- Users can only update their own non-preset tags
CREATE POLICY "trade_tags: update own"
  ON public.trade_tags FOR UPDATE
  USING (
    user_id = public.current_user_id()
    OR (user_id IS NULL AND auth.role() = 'service_role')
  )
  WITH CHECK (
    user_id = public.current_user_id()
    OR (user_id IS NULL AND auth.role() = 'service_role')
  );

-- Users can only delete their own custom tags (not presets)
CREATE POLICY "trade_tags: delete own"
  ON public.trade_tags FOR DELETE
  USING (
    user_id = public.current_user_id()
    OR (user_id IS NULL AND auth.role() = 'service_role')
  );


-- ── journal_trade_tags ────────────────────────────────────────────────────────

ALTER TABLE public.journal_trade_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_trade_tags: select own"  ON public.journal_trade_tags;
DROP POLICY IF EXISTS "journal_trade_tags: insert own"  ON public.journal_trade_tags;
DROP POLICY IF EXISTS "journal_trade_tags: update own"  ON public.journal_trade_tags;
DROP POLICY IF EXISTS "journal_trade_tags: delete own"  ON public.journal_trade_tags;

CREATE POLICY "journal_trade_tags: select own"
  ON public.journal_trade_tags FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "journal_trade_tags: insert own"
  ON public.journal_trade_tags FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "journal_trade_tags: update own"
  ON public.journal_trade_tags FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "journal_trade_tags: delete own"
  ON public.journal_trade_tags FOR DELETE
  USING (user_id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 8: MARKET DATA TABLES
-- Public read, service_role writes only.
-- instruments, price_data, news_articles
-- ════════════════════════════════════════════════════════════════════════════

-- ── instruments ───────────────────────────────────────────────────────────────

ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instruments: public read"    ON public.instruments;
DROP POLICY IF EXISTS "instruments: service write"  ON public.instruments;
DROP POLICY IF EXISTS "instruments: service update" ON public.instruments;
DROP POLICY IF EXISTS "instruments: service delete" ON public.instruments;

CREATE POLICY "instruments: public read"
  ON public.instruments FOR SELECT
  USING (true);

CREATE POLICY "instruments: service write"
  ON public.instruments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "instruments: service update"
  ON public.instruments FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "instruments: service delete"
  ON public.instruments FOR DELETE
  USING (auth.role() = 'service_role');


-- ── price_data ────────────────────────────────────────────────────────────────

ALTER TABLE public.price_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_data: public read"    ON public.price_data;
DROP POLICY IF EXISTS "price_data: service write"  ON public.price_data;
DROP POLICY IF EXISTS "price_data: service update" ON public.price_data;
DROP POLICY IF EXISTS "price_data: service delete" ON public.price_data;

CREATE POLICY "price_data: public read"
  ON public.price_data FOR SELECT
  USING (true);

CREATE POLICY "price_data: service write"
  ON public.price_data FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "price_data: service update"
  ON public.price_data FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "price_data: service delete"
  ON public.price_data FOR DELETE
  USING (auth.role() = 'service_role');


-- ── news_articles ─────────────────────────────────────────────────────────────

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_articles: public read"    ON public.news_articles;
DROP POLICY IF EXISTS "news_articles: service write"  ON public.news_articles;
DROP POLICY IF EXISTS "news_articles: service update" ON public.news_articles;
DROP POLICY IF EXISTS "news_articles: service delete" ON public.news_articles;

CREATE POLICY "news_articles: public read"
  ON public.news_articles FOR SELECT
  USING (true);

CREATE POLICY "news_articles: service write"
  ON public.news_articles FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "news_articles: service update"
  ON public.news_articles FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "news_articles: service delete"
  ON public.news_articles FOR DELETE
  USING (auth.role() = 'service_role');


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 9: ADMIN / INTERNAL TABLES
-- No user access at all. Service role only.
-- waitlist, dashboard_projects, dashboard_agents, dashboard_companies
-- ════════════════════════════════════════════════════════════════════════════

-- ── waitlist ──────────────────────────────────────────────────────────────────
-- Contains email addresses + personal info of prospective users.
-- Only accessible via service_role (backend API with ADMIN_KEY).

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waitlist: service only select"  ON public.waitlist;
DROP POLICY IF EXISTS "waitlist: service only insert"  ON public.waitlist;
DROP POLICY IF EXISTS "waitlist: service only update"  ON public.waitlist;
DROP POLICY IF EXISTS "waitlist: service only delete"  ON public.waitlist;

CREATE POLICY "waitlist: service only select"
  ON public.waitlist FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "waitlist: service only insert"
  ON public.waitlist FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "waitlist: service only update"
  ON public.waitlist FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "waitlist: service only delete"
  ON public.waitlist FOR DELETE
  USING (auth.role() = 'service_role');


-- ── dashboard_projects ────────────────────────────────────────────────────────
-- NOTE: dashboard_projects has BOTH user_id AND company_id foreign keys.
-- Treating as user-scoped (not service-only) since users manage their own
-- projects. Recategorized from "admin" to "user-scoped" based on schema.

ALTER TABLE public.dashboard_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_projects: select own"  ON public.dashboard_projects;
DROP POLICY IF EXISTS "dashboard_projects: insert own"  ON public.dashboard_projects;
DROP POLICY IF EXISTS "dashboard_projects: update own"  ON public.dashboard_projects;
DROP POLICY IF EXISTS "dashboard_projects: delete own"  ON public.dashboard_projects;

CREATE POLICY "dashboard_projects: select own"
  ON public.dashboard_projects FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "dashboard_projects: insert own"
  ON public.dashboard_projects FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_projects: update own"
  ON public.dashboard_projects FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_projects: delete own"
  ON public.dashboard_projects FOR DELETE
  USING (user_id = public.current_user_id());


-- ── dashboard_agents ──────────────────────────────────────────────────────────
-- Agent status rows are per-user. Users can read/manage their own agents.
-- Service_role can insert/update (agents write their own status via API key).

ALTER TABLE public.dashboard_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_agents: select own"   ON public.dashboard_agents;
DROP POLICY IF EXISTS "dashboard_agents: insert own"   ON public.dashboard_agents;
DROP POLICY IF EXISTS "dashboard_agents: update own"   ON public.dashboard_agents;
DROP POLICY IF EXISTS "dashboard_agents: delete own"   ON public.dashboard_agents;

CREATE POLICY "dashboard_agents: select own"
  ON public.dashboard_agents FOR SELECT
  USING (user_id = public.current_user_id());

-- Agents write status via service_role; users can also create agent rows
CREATE POLICY "dashboard_agents: insert own"
  ON public.dashboard_agents FOR INSERT
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

CREATE POLICY "dashboard_agents: update own"
  ON public.dashboard_agents FOR UPDATE
  USING (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    user_id = public.current_user_id()
    OR auth.role() = 'service_role'
  );

CREATE POLICY "dashboard_agents: delete own"
  ON public.dashboard_agents FOR DELETE
  USING (user_id = public.current_user_id());


-- ── dashboard_companies ───────────────────────────────────────────────────────
-- Per-user companies. Users manage their own company records.

ALTER TABLE public.dashboard_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dashboard_companies: select own"  ON public.dashboard_companies;
DROP POLICY IF EXISTS "dashboard_companies: insert own"  ON public.dashboard_companies;
DROP POLICY IF EXISTS "dashboard_companies: update own"  ON public.dashboard_companies;
DROP POLICY IF EXISTS "dashboard_companies: delete own"  ON public.dashboard_companies;

CREATE POLICY "dashboard_companies: select own"
  ON public.dashboard_companies FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "dashboard_companies: insert own"
  ON public.dashboard_companies FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_companies: update own"
  ON public.dashboard_companies FOR UPDATE
  USING (user_id = public.current_user_id())
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "dashboard_companies: delete own"
  ON public.dashboard_companies FOR DELETE
  USING (user_id = public.current_user_id());


-- ════════════════════════════════════════════════════════════════════════════
-- POST-MIGRATION NOTES
-- ════════════════════════════════════════════════════════════════════════════
--
-- ⚠️  CRITICAL PREREQUISITE: Custom JWT Integration
-- ─────────────────────────────────────────────────
-- Your backend signs JWTs with process.env.JWT_SECRET containing claims:
--   { userId: <integer>, email: <string>, subscription_tier: <string> }
--
-- For Supabase to decode these tokens in RLS policies, you MUST:
--   1. Go to Supabase Dashboard → Settings → API
--   2. Set "JWT Secret" to the SAME value as your JWT_SECRET env var
--   3. Set "JWT expiry" to match your JWT_EXPIRE setting (default 24h)
--
-- Without this, auth.jwt() returns NULL and all user-scoped policies
-- will deny access (no rows visible to authenticated users).
--
-- ⚠️  BACKEND CONNECTION: Use service_role key
-- ──────────────────────────────────────────────
-- Your backend (Node.js API server) must connect to Supabase using the
-- SERVICE_ROLE key (not the anon key) so it bypasses RLS for operations
-- like: creating users, inserting refresh tokens, writing market data,
-- reading the waitlist admin endpoint, etc.
--
-- Set in your backend environment:
--   SUPABASE_KEY=<service_role_key>  (or SUPABASE_SERVICE_KEY)
--
-- ⚠️  FRONTEND/CLIENT: Use anon key + pass JWT in Authorization header
-- ──────────────────────────────────────────────────────────────────────
-- Frontend must send: Authorization: Bearer <your_custom_JWT>
-- Supabase will verify it with the shared secret and populate auth.jwt()
-- so RLS policies resolve correctly.
--
-- ⚠️  TABLES NOT IN MIGRATIONS (schema only or inline)
-- ──────────────────────────────────────────────────────
-- `waitlist` is created inline in backend/routes/waitlist.js.
-- Consider adding it to a proper migration file for consistency.
--
-- ⚠️  ADDITIONAL TABLES (not in the 25 listed, but also unprotected)
-- ─────────────────────────────────────────────────────────────────────
-- The following tables from other migrations also have no RLS and should
-- be secured in a follow-up migration:
--   - market_alerts        (migration 002) — market data, public read
--   - alert_subscriptions  (migration 002) — user-scoped
--   - price_alerts         (migration 004) — user-scoped
--
-- ════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 010
-- ════════════════════════════════════════════════════════════════════════════
