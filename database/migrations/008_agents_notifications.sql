-- Migration 008: Agent status + Notifications tables
-- Adds real-time agent tracking and user notification system

-- ─── Agent Status ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboard_agents (
  id            TEXT PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline')),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_task  TEXT NOT NULL DEFAULT '',
  tasks_completed_today INTEGER NOT NULL DEFAULT 0,
  tokens_used_today     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_agents_user_name
  ON dashboard_agents (user_id, name);
CREATE INDEX IF NOT EXISTS idx_dashboard_agents_user
  ON dashboard_agents (user_id);

-- ─── Notifications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id            TEXT PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL DEFAULT '',
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_user
  ON dashboard_notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_unread
  ON dashboard_notifications (user_id, read) WHERE read = FALSE;

COMMENT ON TABLE dashboard_agents IS 'Agent status tracking — updated via API by orchestrator agents';
COMMENT ON TABLE dashboard_notifications IS 'User notifications for dashboard alerts and updates';
