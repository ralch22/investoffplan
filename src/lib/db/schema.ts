import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const catalogMeta = sqliteTable("catalog_meta", {
  id: integer("id").primaryKey(),
  version: integer("version").notNull().default(2),
  unitCount: integer("unit_count").notNull(),
  projectCount: integer("project_count").notNull(),
  scrapedAt: text("scraped_at").notNull(),
});

export const cityCounts = sqliteTable("city_counts", {
  slug: text("slug").primaryKey(),
  label: text("label").notNull(),
  count: integer("count").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const developerSerpLinks = sqliteTable("developer_serp_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  path: text("path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const developers = sqliteTable("developers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
  establishedSince: text("established_since"),
  numProjectsOnline: integer("num_projects_online"),
  devPageEnabled: integer("dev_page_enabled", { mode: "boolean" }),
});

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    pfSlug: text("pf_slug"),
    name: text("name").notNull(),
    developer: text("developer").notNull(),
    developerInitials: text("developer_initials").notNull(),
    developerLogo: text("developer_logo"),
    city: text("city").notNull(),
    citySlug: text("city_slug"),
    area: text("area").notNull(),
    status: text("status").notNull(),
    handover: text("handover"),
    paymentPlan: text("payment_plan").notNull(),
    paymentPlanCount: integer("payment_plan_count"),
    isPremium: integer("is_premium", { mode: "boolean" }).notNull().default(false),
    unitCount: integer("unit_count").notNull(),
    featuredRank: integer("featured_rank"),
    imageGradient: text("image_gradient"),
    imageUrl: text("image_url"),
    imageGallery: text("image_gallery"),
    videoAvailable: integer("video_available", { mode: "boolean" }),
    lat: real("lat"),
    lng: real("lng"),
    brochureUrl: text("brochure_url"),
    description: text("description"),
    descriptionUnique: text("description_unique"),
    amenities: text("amenities"),
    masterPlanUrl: text("master_plan_url"),
    videoUrl: text("video_url"),
    floorPlans: text("floor_plans"),
    salesStartDate: text("sales_start_date"),
    ownershipType: text("ownership_type"),
    constructionProgress: real("construction_progress"),
    pfFaqs: text("pf_faqs"),
    whatsapp: text("whatsapp").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("projects_city_idx").on(table.city),
    index("projects_city_slug_idx").on(table.citySlug),
    index("projects_developer_idx").on(table.developer),
    index("projects_premium_idx").on(table.isPremium),
  ],
);

export const projectUnits = sqliteTable(
  "project_units",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    beds: integer("beds").notNull(),
    sqftMin: integer("sqft_min").notNull(),
    sqftMax: integer("sqft_max"),
    launchPriceAed: integer("launch_price_aed").notNull(),
    launchPriceMaxAed: integer("launch_price_max_aed"),
    propertyType: text("property_type").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("project_units_project_idx").on(table.projectId),
    index("project_units_price_idx").on(table.launchPriceAed),
    index("project_units_beds_idx").on(table.beds),
  ],
);

export const catalogUnits = sqliteTable(
  "catalog_units",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    projectSlug: text("project_slug").notNull(),
    projectName: text("project_name").notNull(),
    pfSlug: text("pf_slug"),
    developer: text("developer").notNull(),
    developerLogo: text("developer_logo"),
    city: text("city").notNull(),
    citySlug: text("city_slug").notNull(),
    area: text("area").notNull(),
    locationFull: text("location_full").notNull(),
    propertyType: text("property_type").notNull(),
    beds: integer("beds").notNull(),
    sqftMin: integer("sqft_min").notNull(),
    sqftMax: integer("sqft_max"),
    launchPriceAed: integer("launch_price_aed").notNull(),
    launchPriceMaxAed: integer("launch_price_max_aed"),
    paymentPlan: text("payment_plan").notNull(),
    paymentPlanCount: integer("payment_plan_count"),
    handover: text("handover"),
    isPremium: integer("is_premium", { mode: "boolean" }).notNull().default(false),
    imageUrl: text("image_url"),
    imageGallery: text("image_gallery"),
    videoAvailable: integer("video_available", { mode: "boolean" }),
    lat: real("lat"),
    lng: real("lng"),
    projectUnitCount: integer("project_unit_count").notNull(),
    whatsapp: text("whatsapp").notNull(),
    status: text("status").notNull(),
  },
  (table) => [
    index("catalog_units_project_slug_idx").on(table.projectSlug),
    index("catalog_units_city_slug_idx").on(table.citySlug),
    index("catalog_units_city_idx").on(table.city),
    index("catalog_units_developer_idx").on(table.developer),
    index("catalog_units_price_idx").on(table.launchPriceAed),
    index("catalog_units_beds_idx").on(table.beds),
    index("catalog_units_property_type_idx").on(table.propertyType),
  ],
);
export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    createdAt: text("created_at").notNull(),
    formType: text("form_type").notNull(),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    country: text("country"),
    message: text("message"),
    projectSlug: text("project_slug"),
    pagePath: text("page_path"),
    payload: text("payload"),
    turnstileOk: integer("turnstile_ok", { mode: "boolean" })
      .notNull()
      .default(false),
    ghlStatus: text("ghl_status").notNull().default("pending"),
    ghlContactId: text("ghl_contact_id"),
    ghlOpportunityId: text("ghl_opportunity_id"),
    ghlAttempts: integer("ghl_attempts").notNull().default(0),
    ghlLastError: text("ghl_last_error"),
  },
  (table) => [
    index("leads_ghl_status_idx").on(table.ghlStatus),
    index("leads_created_at_idx").on(table.createdAt),
  ],
);

export const emailLog = sqliteTable(
  "email_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    email: text("email").notNull(),
    kind: text("kind").notNull(),
    savedSearchId: text("saved_search_id"),
    resendId: text("resend_id"),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    payload: text("payload"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("email_log_kind_idx").on(table.kind, table.createdAt)],
);
