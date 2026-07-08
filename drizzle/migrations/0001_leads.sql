-- Lead capture: store-first before any CRM forwarding.
CREATE TABLE IF NOT EXISTS `leads` (
  `id` text PRIMARY KEY NOT NULL,
  `created_at` text NOT NULL,
  `form_type` text NOT NULL,
  `name` text,
  `email` text,
  `phone` text,
  `country` text,
  `message` text,
  `project_slug` text,
  `page_path` text,
  `payload` text,
  `turnstile_ok` integer DEFAULT 0 NOT NULL,
  `ghl_status` text DEFAULT 'pending' NOT NULL,
  `ghl_contact_id` text,
  `ghl_attempts` integer DEFAULT 0 NOT NULL,
  `ghl_last_error` text
);

CREATE INDEX IF NOT EXISTS `leads_ghl_status_idx` ON `leads` (`ghl_status`);
CREATE INDEX IF NOT EXISTS `leads_created_at_idx` ON `leads` (`created_at`);
