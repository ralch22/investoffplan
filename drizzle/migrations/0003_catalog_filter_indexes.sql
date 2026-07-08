-- Follow-up indexes for catalog filter columns (slug / developer / city).
-- Slug filters are already covered (projects.slug unique, catalog_units.project_slug,
-- developers.slug unique); this backfills the developer and city filter gaps.
CREATE INDEX IF NOT EXISTS `projects_city_slug_idx` ON `projects` (`city_slug`);
CREATE INDEX IF NOT EXISTS `catalog_units_city_idx` ON `catalog_units` (`city`);
CREATE INDEX IF NOT EXISTS `catalog_units_developer_idx` ON `catalog_units` (`developer`);
