-- Saved searches + weekly new-launch alert digests.
-- filters is a JSON-serialized subset of the SERP URL param vocabulary
-- (q, city, beds, type, minP, maxP, dev, pay, handover, amen).
-- unsubscribe_token guards the no-login GET /api/alerts/unsubscribe link.
-- projects.first_seen_at is stamped by the ingest ONLY on insert (never on
-- upsert-update) — it is what "new launch this week" is computed from.
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  filters TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  alert_enabled INTEGER NOT NULL DEFAULT 1,
  alert_frequency TEXT NOT NULL DEFAULT 'weekly',
  unsubscribe_token TEXT NOT NULL UNIQUE,
  last_alert_at TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX saved_searches_user_idx ON saved_searches(user_id);
CREATE INDEX saved_searches_alert_idx ON saved_searches(alert_enabled);
ALTER TABLE projects ADD COLUMN first_seen_at TEXT;
