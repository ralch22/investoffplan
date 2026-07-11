CREATE TABLE email_log (
  id TEXT PRIMARY KEY, user_id TEXT, email TEXT NOT NULL,
  kind TEXT NOT NULL, saved_search_id TEXT, resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', error TEXT, payload TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX email_log_kind_idx ON email_log(kind, created_at);
