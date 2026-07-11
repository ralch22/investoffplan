-- Paid featured-placement rails. Placements live in their own table (NOT on
-- projects) because the weekly catalog ingest clobbers projects rows — a paid
-- slot must survive re-ingest. Rows are time-windowed (starts_at <= now <
-- featured_until) and surface-scoped ("home-featured" | "serp-boost").
CREATE TABLE placements (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  surface TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 100,
  starts_at TEXT NOT NULL,
  featured_until TEXT NOT NULL,
  lead_priority INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX placements_active_idx ON placements(surface, featured_until, rank);
