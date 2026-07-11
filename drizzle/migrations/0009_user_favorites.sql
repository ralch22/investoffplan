-- Server-synced favorites: one row per (user, project slug). localStorage
-- remains the client read path; this table is the cross-device merge target.
CREATE TABLE user_favorites (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, project_slug)
);
