import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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
    /**
     * Set ONLY when the ingest first inserts the row (the ingest run date) —
     * the weekly upsert must NEVER clobber it (see catalog-upsert.ts). This is
     * what the alerts dispatch uses to find "new launches this week".
     */
    firstSeenAt: text("first_seen_at"),
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
/**
 * Paid featured-placement rails. Separate from `projects` on purpose: the
 * weekly ingest clobbers projects rows, and a paid slot must survive it.
 * A placement is active when starts_at <= now < featured_until.
 */
export const placements = sqliteTable(
  "placements",
  {
    id: text("id").primaryKey(),
    projectSlug: text("project_slug").notNull(),
    surface: text("surface").notNull(),
    rank: integer("rank").notNull().default(100),
    startsAt: text("starts_at").notNull(),
    featuredUntil: text("featured_until").notNull(),
    leadPriority: integer("lead_priority").notNull().default(1),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("placements_active_idx").on(table.surface, table.featuredUntil, table.rank),
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

// ---------------------------------------------------------------------------
// better-auth tables (migration 0007_auth.sql). JS property keys MUST match
// better-auth's default model field names (id, emailVerified, createdAt, …) —
// the drizzle adapter resolves columns by these keys. Timestamps use
// `timestamp_ms` mode because better-auth reads/writes Date objects.
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  locale: text("locale").notNull().default("en"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_account_idx").on(table.providerId, table.accountId),
  ],
);

/**
 * Saved SERP searches + weekly alert subscriptions (migration
 * 0010_saved_searches.sql). `filters` is a JSON-serialized subset of the SERP
 * URL param vocabulary (q, city, beds, type, minP, maxP, dev, pay, handover,
 * amen). `unsubscribeToken` guards the no-login unsubscribe link embedded in
 * every digest email.
 */
export const savedSearches = sqliteTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    filters: text("filters").notNull(),
    locale: text("locale").notNull().default("en"),
    alertEnabled: integer("alert_enabled").notNull().default(1),
    alertFrequency: text("alert_frequency").notNull().default("weekly"),
    unsubscribeToken: text("unsubscribe_token").notNull().unique(),
    lastAlertAt: text("last_alert_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("saved_searches_user_idx").on(table.userId),
    index("saved_searches_alert_idx").on(table.alertEnabled),
  ],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

// Server-synced favorites (migration 0009_user_favorites.sql). created_at is
// ISO-8601 TEXT (house style for app tables, unlike better-auth's epoch-ms).
export const userFavorites = sqliteTable(
  "user_favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectSlug: text("project_slug").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectSlug] })],
);

// Site-wide daily counters (spend guardrails — e.g. advisor Workers-AI budget).
// key = "<scope>:<YYYY-MM-DD>"; incremented atomically via UPSERT.
export const dailyCounters = sqliteTable("daily_counters", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

// better-auth durable rate-limit storage (storage: "database"); field names
// must match better-auth's rateLimit model exactly (key/count/lastRequest).
export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: integer("last_request"),
});
