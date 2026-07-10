-- Leads are now staged into a GHL pipeline as opportunities; record the id so
-- the retry cron can backfill leads whose opportunity creation failed.
ALTER TABLE leads ADD COLUMN ghl_opportunity_id TEXT;
