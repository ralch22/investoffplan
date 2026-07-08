-- Floor plans + PF detail-page extras.
ALTER TABLE `projects` ADD COLUMN `floor_plans` text;
ALTER TABLE `projects` ADD COLUMN `sales_start_date` text;
ALTER TABLE `projects` ADD COLUMN `ownership_type` text;
ALTER TABLE `projects` ADD COLUMN `construction_progress` real;
ALTER TABLE `projects` ADD COLUMN `pf_faqs` text;
