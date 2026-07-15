-- Spend guardrails: site-wide daily counters (advisor Workers-AI budget) +
-- better-auth durable rate-limit storage.
CREATE TABLE IF NOT EXISTS daily_counters (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT,
  count INTEGER,
  last_request INTEGER
);
CREATE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits (key);
