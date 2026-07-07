CREATE TABLE `catalog_meta` (
	`id` integer PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 2 NOT NULL,
	`unit_count` integer NOT NULL,
	`project_count` integer NOT NULL,
	`scraped_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `city_counts` (
	`slug` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`count` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `developer_serp_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`path` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `developers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`description` text,
	`established_since` text,
	`num_projects_online` integer,
	`dev_page_enabled` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `developers_slug_unique` ON `developers` (`slug`);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`pf_slug` text,
	`name` text NOT NULL,
	`developer` text NOT NULL,
	`developer_initials` text NOT NULL,
	`developer_logo` text,
	`city` text NOT NULL,
	`city_slug` text,
	`area` text NOT NULL,
	`status` text NOT NULL,
	`handover` text,
	`payment_plan` text NOT NULL,
	`payment_plan_count` integer,
	`is_premium` integer DEFAULT false NOT NULL,
	`unit_count` integer NOT NULL,
	`featured_rank` integer,
	`image_gradient` text,
	`image_url` text,
	`image_gallery` text,
	`video_available` integer,
	`lat` real,
	`lng` real,
	`brochure_url` text,
	`description` text,
	`amenities` text,
	`master_plan_url` text,
	`video_url` text,
	`whatsapp` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
--> statement-breakpoint
CREATE INDEX `projects_city_idx` ON `projects` (`city`);
--> statement-breakpoint
CREATE INDEX `projects_developer_idx` ON `projects` (`developer`);
--> statement-breakpoint
CREATE INDEX `projects_premium_idx` ON `projects` (`is_premium`);
--> statement-breakpoint
CREATE TABLE `project_units` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`beds` integer NOT NULL,
	`sqft_min` integer NOT NULL,
	`sqft_max` integer,
	`launch_price_aed` integer NOT NULL,
	`launch_price_max_aed` integer,
	`property_type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_units_project_idx` ON `project_units` (`project_id`);
--> statement-breakpoint
CREATE INDEX `project_units_price_idx` ON `project_units` (`launch_price_aed`);
--> statement-breakpoint
CREATE INDEX `project_units_beds_idx` ON `project_units` (`beds`);
--> statement-breakpoint
CREATE TABLE `catalog_units` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`project_slug` text NOT NULL,
	`project_name` text NOT NULL,
	`pf_slug` text,
	`developer` text NOT NULL,
	`developer_logo` text,
	`city` text NOT NULL,
	`city_slug` text NOT NULL,
	`area` text NOT NULL,
	`location_full` text NOT NULL,
	`property_type` text NOT NULL,
	`beds` integer NOT NULL,
	`sqft_min` integer NOT NULL,
	`sqft_max` integer,
	`launch_price_aed` integer NOT NULL,
	`launch_price_max_aed` integer,
	`payment_plan` text NOT NULL,
	`payment_plan_count` integer,
	`handover` text,
	`is_premium` integer DEFAULT false NOT NULL,
	`image_url` text,
	`image_gallery` text,
	`video_available` integer,
	`lat` real,
	`lng` real,
	`project_unit_count` integer NOT NULL,
	`whatsapp` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `catalog_units_project_slug_idx` ON `catalog_units` (`project_slug`);
--> statement-breakpoint
CREATE INDEX `catalog_units_city_slug_idx` ON `catalog_units` (`city_slug`);
--> statement-breakpoint
CREATE INDEX `catalog_units_price_idx` ON `catalog_units` (`launch_price_aed`);
--> statement-breakpoint
CREATE INDEX `catalog_units_beds_idx` ON `catalog_units` (`beds`);
--> statement-breakpoint
CREATE INDEX `catalog_units_property_type_idx` ON `catalog_units` (`property_type`);