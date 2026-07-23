-- Shareable advisor shortlists (/s/[id]).
--
-- Stores the INGREDIENTS of a composed surface, never the composed A2UI JSON:
-- project slugs the catalogue can re-resolve, plus the reply text. The surface
-- is recomposed server-side at read time from live catalogue data, so a share
-- can never carry an attacker-supplied image URL or card, and a shared link
-- shows today's prices rather than a snapshot of an old render.
CREATE TABLE IF NOT EXISTS shared_surfaces (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL DEFAULT 'en',
  reply TEXT NOT NULL,
  slugs_json TEXT NOT NULL,
  mortgage_price_aed INTEGER,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Shares are read by id; this index serves the expiry sweep, not the read path.
CREATE INDEX IF NOT EXISTS shared_surfaces_expires_idx ON shared_surfaces (expires_at);
