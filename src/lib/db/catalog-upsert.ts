import { sql, type SQL } from "drizzle-orm";
import type { CatalogFile } from "@/lib/catalog-core";
import type { CatalogDatabase } from "./client";
import { withTransientRetry } from "./d1-transient";
import {
  catalogUnitToInsertValues,
  prepareCatalogRows,
  projectToInsertValues,
} from "./prepare-catalog-rows";
import {
  catalogMeta,
  catalogUnits,
  cityCounts,
  developerSerpLinks,
  developers,
  projectUnits,
  projects,
} from "./schema";

export interface UpsertStats {
  projects: number;
  projectUnits: number;
  catalogUnits: number;
  developers: number;
  skippedDuplicateSlugs: number;
  skippedDuplicateUnitIds: number;
  scrapedAt: string;
}

const UNIT_BATCH = 50;
// D1 caps bound parameters at 100 per statement; 90 leaves headroom
// (same bound as the alerts dispatcher's D1_ID_BATCH).
const DELETE_ID_BATCH = 90;

/**
 * Enrichment columns other pipelines own (brochures, description passes,
 * media). The scrape sends null for these when it has nothing; the upsert
 * must keep whatever production already holds. Previously done with a
 * SELECT-then-merge per project — 2 sequential round-trips × 1,747 projects
 * was most of a 17-minute window in which run 29470437050 caught one 502
 * and died. COALESCE(excluded.col, col) is the same rule, applied atomically
 * inside the statement, which makes the whole projects pass batchable.
 */
const PRESERVE_WHEN_INCOMING_NULL = new Set([
  "brochureUrl",
  "description",
  "amenities",
  "masterPlanUrl",
  "videoUrl",
  "imageGallery",
]);

/**
 * Build the single-statement upsert for one project. first_seen_at is
 * INSERT-ONLY: present in values so brand-new projects get stamped, absent
 * from the DO UPDATE set so existing rows keep their original date — it is
 * what "new launch this week" alerts key off.
 *
 * Exported for the unit test that pins these semantics; production callers
 * go through upsertCatalogFile.
 */
export function buildProjectUpsertSql(
  db: CatalogDatabase,
  project: Parameters<typeof projectToInsertValues>[0],
  updatedAt: string,
): { sql: string; params: unknown[] } {
  const values = projectToInsertValues(project, updatedAt);
  const set: Record<string, SQL> = {};
  for (const key of Object.keys(values)) {
    if (key === "id") continue;
    const column = (projects as unknown as Record<string, { name?: string }>)[key];
    if (!column?.name) {
      throw new Error(`[db:upsert] no schema column for values key "${key}"`);
    }
    set[key] = PRESERVE_WHEN_INCOMING_NULL.has(key)
      ? sql.raw(`coalesce(excluded."${column.name}", "projects"."${column.name}")`)
      : sql.raw(`excluded."${column.name}"`);
  }
  const query = db
    .insert(projects)
    .values({ ...values, firstSeenAt: updatedAt })
    .onConflictDoUpdate({ target: projects.id, set })
    .toSQL();
  return { sql: query.sql, params: query.params };
}

/** D1's JS bindings take null/number/string; booleans must be 0/1. */
function toD1Params(params: unknown[]): unknown[] {
  return params.map((p) => (typeof p === "boolean" ? (p ? 1 : 0) : p));
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function upsertCatalogFile(
  db: CatalogDatabase,
  d1: D1Database,
  raw: CatalogFile,
): Promise<UpsertStats> {
  const prepared = prepareCatalogRows(raw);
  // Meta must match what we actually insert (post resolveProjectSlugs + unit
  // dedupe), not raw.catalog.json headline counts — otherwise /api/health
  // reports "seed is stale" while row coverage is 100% (#225).
  const projectCount = prepared.projects.length;
  const unitCount = prepared.catalogUnits.length;

  await withTransientRetry("catalog_meta", () =>
    db
      .insert(catalogMeta)
      .values({
        id: 1,
        version: raw.version,
        unitCount,
        projectCount,
        scrapedAt: raw.scrapedAt,
      })
      .onConflictDoUpdate({
        target: catalogMeta.id,
        set: {
          version: raw.version,
          unitCount,
          projectCount,
          scrapedAt: raw.scrapedAt,
        },
      }),
  );

  await withTransientRetry("city_counts clear", () => db.delete(cityCounts));
  if (prepared.cityCounts.length) {
    await withTransientRetry("city_counts insert", () =>
      db.insert(cityCounts).values(
        prepared.cityCounts.map((city, index) => ({
          slug: city.slug,
          label: city.label,
          count: city.count,
          sortOrder: index,
        })),
      ),
    );
  }

  await withTransientRetry("developer_serp_links clear", () =>
    db.delete(developerSerpLinks),
  );
  if (prepared.developerSerpLinks.length) {
    await withTransientRetry("developer_serp_links insert", () =>
      db.insert(developerSerpLinks).values(
        prepared.developerSerpLinks.map((link, index) => ({
          title: link.title,
          path: link.path,
          sortOrder: index,
        })),
      ),
    );
  }

  // Developers, projects and the unit-table clears below all follow the same
  // shape: idempotent single-row statements, grouped through d1.batch so one
  // round-trip carries a chunk instead of one row. Run 29470437050 spent 17
  // minutes on ~7,000 sequential round-trips and died to a single transient
  // 502 — batching cuts the trips ~25x and the retry wrapper absorbs the
  // stragglers. Statement-level idempotency is what makes retrying a whole
  // batch safe: replaying an upsert or delete converges to the same state.
  for (const batch of chunk(prepared.devList, UNIT_BATCH)) {
    const statements = batch.map((dev) =>
      d1
        .prepare(
          `INSERT INTO developers (id, name, slug, logo_url, description, established_since, num_projects_online, dev_page_enabled)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             slug = excluded.slug,
             logo_url = excluded.logo_url,
             description = excluded.description,
             established_since = excluded.established_since,
             num_projects_online = excluded.num_projects_online,
             dev_page_enabled = excluded.dev_page_enabled`,
        )
        .bind(
          dev.id,
          dev.name,
          dev.slug,
          dev.logoUrl ?? null,
          dev.description ?? null,
          dev.establishedSince ?? null,
          dev.numProjectsOnline ?? null,
          ...toD1Params([dev.devPageEnabled ?? null]),
        ),
    );
    await withTransientRetry(`developers batch (${batch.length})`, () =>
      d1.batch(statements),
    );
  }

  for (const batch of chunk(prepared.projects, UNIT_BATCH)) {
    const statements = batch.map((project) => {
      const query = buildProjectUpsertSql(db, project, prepared.updatedAt);
      return d1.prepare(query.sql).bind(...toD1Params(query.params));
    });
    await withTransientRetry(`projects batch (${batch.length})`, () =>
      d1.batch(statements),
    );
  }

  const activeProjectIds = prepared.projects.map((p) => p.id);

  for (const idBatch of chunk(activeProjectIds, DELETE_ID_BATCH)) {
    const placeholders = idBatch.map(() => "?").join(", ");
    await withTransientRetry(`unit clears (${idBatch.length} projects)`, () =>
      d1.batch([
        d1
          .prepare(`DELETE FROM project_units WHERE project_id IN (${placeholders})`)
          .bind(...idBatch),
        d1
          .prepare(`DELETE FROM catalog_units WHERE project_id IN (${placeholders})`)
          .bind(...idBatch),
      ]),
    );
  }

  for (const batch of chunk(prepared.projectUnits, UNIT_BATCH)) {
    const statements = batch.map((unit) =>
      d1
        .prepare(
          `INSERT INTO project_units (id, project_id, beds, sqft_min, sqft_max, launch_price_aed, launch_price_max_aed, property_type, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             project_id = excluded.project_id,
             beds = excluded.beds,
             sqft_min = excluded.sqft_min,
             sqft_max = excluded.sqft_max,
             launch_price_aed = excluded.launch_price_aed,
             launch_price_max_aed = excluded.launch_price_max_aed,
             property_type = excluded.property_type,
             sort_order = excluded.sort_order`,
        )
        .bind(
          unit.id,
          unit.projectId,
          unit.beds,
          unit.sqftMin,
          unit.sqftMax,
          unit.launchPriceAed,
          unit.launchPriceMaxAed,
          unit.propertyType,
          unit.sortOrder,
        ),
    );
    await withTransientRetry(`project_units batch (${batch.length})`, () =>
      d1.batch(statements),
    );
  }

  for (const batch of chunk(prepared.catalogUnits, UNIT_BATCH)) {
    const statements = batch.map((unit) => {
      const values = catalogUnitToInsertValues(unit);
      return d1
        .prepare(
          `INSERT INTO catalog_units (
            id, project_id, project_slug, project_name, pf_slug, developer, developer_logo,
            city, city_slug, area, location_full, property_type, beds, sqft_min, sqft_max,
            launch_price_aed, launch_price_max_aed, payment_plan, payment_plan_count, handover,
            is_premium, image_url, image_gallery, video_available, lat, lng,
            project_unit_count, whatsapp, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            project_id = excluded.project_id,
            project_slug = excluded.project_slug,
            project_name = excluded.project_name,
            pf_slug = excluded.pf_slug,
            developer = excluded.developer,
            developer_logo = excluded.developer_logo,
            city = excluded.city,
            city_slug = excluded.city_slug,
            area = excluded.area,
            location_full = excluded.location_full,
            property_type = excluded.property_type,
            beds = excluded.beds,
            sqft_min = excluded.sqft_min,
            sqft_max = excluded.sqft_max,
            launch_price_aed = excluded.launch_price_aed,
            launch_price_max_aed = excluded.launch_price_max_aed,
            payment_plan = excluded.payment_plan,
            payment_plan_count = excluded.payment_plan_count,
            handover = excluded.handover,
            is_premium = excluded.is_premium,
            image_url = excluded.image_url,
            image_gallery = excluded.image_gallery,
            video_available = excluded.video_available,
            lat = excluded.lat,
            lng = excluded.lng,
            project_unit_count = excluded.project_unit_count,
            whatsapp = excluded.whatsapp,
            status = excluded.status`,
        )
        .bind(
          values.id,
          values.projectId,
          values.projectSlug,
          values.projectName,
          values.pfSlug,
          values.developer,
          values.developerLogo,
          values.city,
          values.citySlug,
          values.area,
          values.locationFull,
          values.propertyType,
          values.beds,
          values.sqftMin,
          values.sqftMax,
          values.launchPriceAed,
          values.launchPriceMaxAed,
          values.paymentPlan,
          values.paymentPlanCount,
          values.handover,
          values.isPremium ? 1 : 0,
          values.imageUrl,
          values.imageGallery,
          values.videoAvailable ? 1 : 0,
          values.lat,
          values.lng,
          values.projectUnitCount,
          values.whatsapp,
          values.status,
        );
    });
    await withTransientRetry(`catalog_units batch (${batch.length})`, () =>
      d1.batch(statements),
    );
  }

  return {
    projects: prepared.projects.length,
    projectUnits: prepared.projectUnits.length,
    catalogUnits: prepared.catalogUnits.length,
    developers: prepared.devList.length,
    skippedDuplicateSlugs: prepared.skippedDuplicateSlugs.length,
    skippedDuplicateUnitIds: prepared.skippedDuplicateUnitIds.length,
    scrapedAt: raw.scrapedAt,
  };
}