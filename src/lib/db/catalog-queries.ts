import { asc, count, eq, inArray } from "drizzle-orm";
import { createCatalogApi, type CatalogFile, type FlatUnit, PAGE_SIZE } from "@/lib/catalog-core";
import { fetchActivePlacements } from "@/lib/placements";
import {
  catalogQueryKey,
  decodeCatalogCursor,
  encodeCatalogCursor,
} from "@/lib/catalog-cursor";
import type { CatalogUnit, CollectionFilter, Project, ProjectFilters, SortOption, ViewMode } from "@/lib/types";
import { getMapProjectsFromList } from "@/lib/map-data";
import type { CatalogDatabase } from "./client";
import { rowToCatalogUnit, rowToDevListEntry, rowToProject } from "./mappers";
import {
  catalogMeta,
  catalogUnits,
  cityCounts,
  developerSerpLinks,
  developers,
  projectUnits,
  projects,
} from "./schema";

export async function isCatalogDbSeeded(db: CatalogDatabase): Promise<boolean> {
  try {
    const meta = await db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get();
    return Boolean(meta);
  } catch {
    // Table may not exist in this environment (e.g. plain `next start` in e2e/CI without D1 bindings + migrations)
    return false;
  }
}

/**
 * Minimum fraction of the expected catalog size that must be present in D1 for a
 * seed to pass. The seed intentionally drops a handful of duplicate slugs / orphan
 * units (typically <1%), so exact equality would flag a healthy seed. A partial,
 * halted, or missing seed falls far below this floor.
 */
export const SEED_COVERAGE_THRESHOLD = 0.97;

interface SeedEntityCheck {
  /** Live row count in D1. */
  actual: number;
  /** Source-of-truth count from the bundled catalog. */
  expected: number;
  /** actual / expected, rounded to 4 decimals (0 when nothing is expected). */
  coverage: number;
  /** True when the table clears the coverage floor (and is non-empty). */
  ok: boolean;
}

export interface CatalogSeedVerification {
  /** True when D1 is seeded and every verified table clears the coverage floor. */
  ok: boolean;
  /** True when the catalog_meta row exists (seed ran at least partially). */
  seeded: boolean;
  /** Minimum coverage fraction each table must meet to pass. */
  threshold: number;
  /** Per-table row-count checks against the expected catalog size. */
  checks: {
    projects: SeedEntityCheck;
    catalogUnits: SeedEntityCheck;
  };
  /** Informational row counts not tied to the expected catalog size. */
  counts: {
    projectUnits: number;
    developers: number;
  };
  /** Counts the seed declared in catalog_meta (null when unseeded). */
  meta: { projects: number; units: number } | null;
  /** True when catalog_meta's declared size matches the deployed bundle. */
  metaMatchesBundle: boolean;
  /** Timestamp the seeded catalog was scraped (null when unseeded). */
  scrapedAt: string | null;
  /** Human-readable descriptions of every check that failed. */
  mismatches: string[];
}

function evaluateEntity(actual: number, expected: number): SeedEntityCheck {
  const coverage = expected > 0 ? Math.round((actual / expected) * 1e4) / 1e4 : 0;
  return {
    actual,
    expected,
    coverage,
    ok: actual > 0 && coverage >= SEED_COVERAGE_THRESHOLD,
  };
}

/**
 * Verify a production/preview D1 seed by comparing live row counts against the
 * expected catalog size (source of truth). Catches the seed failures that matter
 * on production — an unseeded, partial, halted, or stale seed — while tolerating
 * the small, deterministic dedup drops the seed makes.
 */
export async function verifyCatalogSeed(
  db: CatalogDatabase,
  expected: { projects: number; units: number },
): Promise<CatalogSeedVerification> {
  const [metaRow, projectsRow, catalogUnitsRow, projectUnitsRow, developersRow] =
    await Promise.all([
      db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get(),
      db.select({ value: count() }).from(projects).get(),
      db.select({ value: count() }).from(catalogUnits).get(),
      db.select({ value: count() }).from(projectUnits).get(),
      db.select({ value: count() }).from(developers).get(),
    ]);

  const checks = {
    projects: evaluateEntity(projectsRow?.value ?? 0, expected.projects),
    catalogUnits: evaluateEntity(catalogUnitsRow?.value ?? 0, expected.units),
  };
  const counts = {
    projectUnits: projectUnitsRow?.value ?? 0,
    developers: developersRow?.value ?? 0,
  };

  const meta = metaRow
    ? { projects: metaRow.projectCount, units: metaRow.unitCount }
    : null;
  const metaMatchesBundle =
    meta !== null &&
    meta.projects === expected.projects &&
    meta.units === expected.units;

  const mismatches: string[] = [];

  if (!metaRow) {
    mismatches.push("catalog_meta row missing — D1 is not seeded");
  }
  if (!checks.projects.ok) {
    mismatches.push(
      `projects: ${checks.projects.actual} rows vs expected ${expected.projects} ` +
        `(${(checks.projects.coverage * 100).toFixed(1)}% < ${(SEED_COVERAGE_THRESHOLD * 100).toFixed(0)}%)`,
    );
  }
  if (!checks.catalogUnits.ok) {
    mismatches.push(
      `catalog_units: ${checks.catalogUnits.actual} rows vs expected ${expected.units} ` +
        `(${(checks.catalogUnits.coverage * 100).toFixed(1)}% < ${(SEED_COVERAGE_THRESHOLD * 100).toFixed(0)}%)`,
    );
  }
  if (counts.projectUnits === 0) {
    mismatches.push("project_units: 0 rows — unit-level table is empty");
  }
  if (counts.developers === 0) {
    mismatches.push("developers: 0 rows — developer table is empty");
  }
  // A stale seed: catalog_meta claims a size that no longer matches the deployed
  // bundle (redeployed catalog but D1 was never reseeded).
  if (meta && !metaMatchesBundle) {
    mismatches.push(
      `catalog_meta declares ${meta.projects}/${meta.units} but bundle expects ` +
        `${expected.projects}/${expected.units} — seed is stale`,
    );
  }

  return {
    ok: Boolean(metaRow) && mismatches.length === 0,
    seeded: Boolean(metaRow),
    threshold: SEED_COVERAGE_THRESHOLD,
    checks,
    counts,
    meta,
    metaMatchesBundle,
    scrapedAt: metaRow?.scrapedAt ?? null,
    mismatches,
  };
}

export async function fetchCatalogMeta(db: CatalogDatabase) {
  try {
    const [meta, cities, serpLinks, devRows] = await Promise.all([
      db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get(),
      db.select().from(cityCounts).orderBy(asc(cityCounts.sortOrder)).all(),
      db.select().from(developerSerpLinks).orderBy(asc(developerSerpLinks.sortOrder)).all(),
      db.select().from(developers).all(),
    ]);

    if (!meta) return null;

    return {
      version: meta.version as 2,
      unitCount: meta.unitCount,
      projectCount: meta.projectCount,
      scrapedAt: meta.scrapedAt,
      cityCounts: cities.map((c) => ({
        slug: c.slug,
        label: c.label,
        count: c.count,
      })),
      developerSerpLinks: serpLinks.map((l) => ({
        title: l.title,
        path: l.path,
      })),
      devList: devRows.map(rowToDevListEntry),
    };
  } catch {
    return null;
  }
}

async function fetchAllProjects(db: CatalogDatabase): Promise<Project[]> {
  const [projectRows, unitRows] = await Promise.all([
    db.select().from(projects).all(),
    db.select().from(projectUnits).orderBy(asc(projectUnits.sortOrder)).all(),
  ]);

  const unitsByProject = new Map<string, typeof unitRows>();
  for (const unit of unitRows) {
    const list = unitsByProject.get(unit.projectId) ?? [];
    list.push(unit);
    unitsByProject.set(unit.projectId, list);
  }

  return projectRows.map((row) =>
    rowToProject(row, unitsByProject.get(row.id) ?? []),
  );
}

function slimProjectForLite(project: Project): Project {
  // The client "lite" catalog powers the SERP grid, search-suggest, map, and
  // counts — none of which read PDP-only detail fields. Stripping them cuts the
  // payload ~85% (floorPlans/pfFaqs/descriptionUnique alone are ~4 MB across the
  // catalog). The PDP renders server-side from the full D1 record, so it's
  // unaffected. Keep imageUrl (card thumb); drop imageGallery (PDP-only).
  return {
    ...project,
    units: [],
    description: undefined,
    amenities: undefined,
    floorPlans: undefined,
    pfFaqs: undefined,
    descriptionUnique: undefined,
    masterPlanUrl: undefined,
    brochureUrl: undefined,
    imageGallery: undefined,
  };
}

function slimUnitForLite(u: any) {
  // Minimal unit for lite slice (grid perf). Heavy fields + project dups stripped;
  // locationFull and minPriceAed live on project in lite.
  return {
    id: u.id,
    projectId: u.projectId,
    beds: u.beds,
    sqftMin: u.sqftMin,
    sqftMax: u.sqftMax,
    launchPriceAed: u.launchPriceAed,
    launchPriceMaxAed: u.launchPriceMaxAed,
    propertyType: u.propertyType,
  };
}

export async function fetchCatalogLite(db: CatalogDatabase): Promise<CatalogFile | null> {
  const full = await fetchCatalogFile(db);
  if (!full) return null;

  const locMap = new Map<string, string>();
  (full.units || []).forEach((u: any) => {
    if (u.locationFull && !locMap.has(u.projectId)) {
      locMap.set(u.projectId, u.locationFull);
    }
  });

  const slimProjects = full.projects.map((p) => {
    const sp = slimProjectForLite(p);
    if (!sp.locationFull) {
      sp.locationFull = locMap.get(p.id);
    }
    if (sp.minPriceAed == null && p.units && p.units.length > 0) {
      sp.minPriceAed = Math.min(...p.units.map((u: any) => u.launchPriceAed));
    }
    return sp;
  });

  return {
    ...full,
    projects: slimProjects,
    units: full.units.map(slimUnitForLite) as CatalogUnit[],
  };
}

export async function fetchCatalogFile(db: CatalogDatabase): Promise<CatalogFile | null> {
  const meta = await fetchCatalogMeta(db);
  if (!meta) return null;

  const [projectList, unitRows] = await Promise.all([
    fetchAllProjects(db),
    db.select().from(catalogUnits).all(),
  ]);

  return {
    version: meta.version,
    unitCount: meta.unitCount,
    projectCount: meta.projectCount,
    scrapedAt: meta.scrapedAt,
    cityCounts: meta.cityCounts,
    developerSerpLinks: meta.developerSerpLinks,
    devList: meta.devList,
    projects: projectList,
    units: unitRows.map(rowToCatalogUnit),
  };
}

export async function fetchProjectBySlug(
  db: CatalogDatabase,
  slug: string,
): Promise<Project | null> {
  const projectRow = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .get();
  if (!projectRow) return null;

  const units = await db
    .select()
    .from(projectUnits)
    .where(eq(projectUnits.projectId, projectRow.id))
    .orderBy(asc(projectUnits.sortOrder))
    .all();

  return rowToProject(projectRow, units);
}

export async function fetchProjectsBySlugs(
  db: CatalogDatabase,
  slugs: string[],
): Promise<Project[]> {
  if (!slugs.length) return [];

  const projectRows = await db
    .select()
    .from(projects)
    .where(inArray(projects.slug, slugs))
    .all();
  if (!projectRows.length) return [];

  const projectIds = projectRows.map((p) => p.id);
  const unitRows = await db
    .select()
    .from(projectUnits)
    .where(inArray(projectUnits.projectId, projectIds))
    .orderBy(asc(projectUnits.sortOrder))
    .all();

  const unitsByProject = new Map<string, typeof unitRows>();
  for (const unit of unitRows) {
    const list = unitsByProject.get(unit.projectId) ?? [];
    list.push(unit);
    unitsByProject.set(unit.projectId, list);
  }

  const bySlug = new Map(
    projectRows.map((row) => [
      row.slug,
      rowToProject(row, unitsByProject.get(row.id) ?? []),
    ]),
  );

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project));
}

export async function fetchMapPayload(db: CatalogDatabase) {
  const meta = await db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get();
  if (!meta) return null;

  const projectList = await fetchAllProjects(db);
  return {
    scrapedAt: meta.scrapedAt,
    projects: getMapProjectsFromList(projectList),
  };
}

export interface CatalogProjectsQuery {
  page?: number;
  pageSize?: number;
  /**
   * Opaque cursor from a previous response's `meta.nextCursor`. When present and
   * valid for the same query, it takes precedence over `page` for the offset.
   */
  cursor?: string;
  view?: ViewMode;
  sort?: SortOption;
  collection?: CollectionFilter;
  filters?: Partial<ProjectFilters>;
}

export async function queryCatalogProjects(
  db: CatalogDatabase,
  query: CatalogProjectsQuery,
) {
  const catalog = await fetchCatalogFile(db);
  if (!catalog) return null;

  const api = createCatalogApi(catalog);
  const pageSize = Math.min(Math.max(query.pageSize ?? PAGE_SIZE, 1), 100);
  const page = Math.max(query.page ?? 1, 1);

  const filters: ProjectFilters = {
    query: query.filters?.query ?? "",
    city: query.filters?.city ?? "all",
    propertyType: query.filters?.propertyType ?? "all",
    beds: query.filters?.beds ?? "all",
    minPrice: query.filters?.minPrice ?? null,
    maxPrice: query.filters?.maxPrice ?? null,
    developer: query.filters?.developer ?? "all",
    paymentPlan: query.filters?.paymentPlan ?? "all",
    handoverBy: query.filters?.handoverBy ?? "all",
    amenities: query.filters?.amenities ?? [],
  };

  let items = api.flattenCatalogUnits();
  items = api.applyCollectionFilter(items, query.collection ?? "all");
  items = api.filterUnits(items, filters);
  items = api.sortUnits(items, query.sort ?? "featured");

  if ((query.view ?? "project") === "project") {
    items = api.aggregateProjectView(items);
  }

  const view = query.view ?? "project";
  const sort = query.sort ?? "featured";
  const collection = query.collection ?? "all";

  // Paid serp-boost placements: pin to the TOP of the result list (so the top
  // of page 1) — ONLY in the default "featured" sort. Explicit user sorts
  // (price/handover/value) are never reordered by paid slots. One row per
  // placed project is pinned (its first post-filter occurrence — in project
  // view that's the aggregated row; in unit view the highest-ranked unit),
  // flagged `placed: true` so the UI renders the ad-disclosure "Featured"
  // badge. fetchActivePlacements returns [] on any error (or before the
  // placements migration exists), leaving ordering exactly as today.
  if (sort === "featured") {
    const boosts = await fetchActivePlacements(db, "serp-boost");
    if (boosts.length > 0) {
      const rankBySlug = new Map<string, number>();
      for (const boost of boosts) {
        if (!rankBySlug.has(boost.projectSlug)) {
          rankBySlug.set(boost.projectSlug, boost.rank);
        }
      }
      const pinned = new Map<string, FlatUnit>();
      const rest: FlatUnit[] = [];
      for (const item of items) {
        const slug = item.project.slug;
        if (rankBySlug.has(slug) && !pinned.has(slug)) {
          pinned.set(slug, { ...item, placed: true });
        } else {
          rest.push(item);
        }
      }
      if (pinned.size > 0) {
        const ordered = [...pinned.values()].sort(
          (a, b) =>
            (rankBySlug.get(a.project.slug) ?? Number.MAX_SAFE_INTEGER) -
            (rankBySlug.get(b.project.slug) ?? Number.MAX_SAFE_INTEGER),
        );
        items = [...ordered, ...rest];
      }
    }
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // A cursor is scoped to the exact query it was minted for (filters/sort/view/
  // collection + catalog snapshot). If it decodes and its key matches, resume
  // from its offset; otherwise fall back to the page-based offset.
  const queryKey = catalogQueryKey({
    pageSize,
    view,
    sort,
    collection,
    filters,
    scrapedAt: catalog.scrapedAt,
  });
  const decodedCursor = decodeCatalogCursor(query.cursor);
  const cursorApplied = decodedCursor !== null && decodedCursor.key === queryKey;

  const offset = cursorApplied
    ? Math.min(decodedCursor.offset, total)
    : (page - 1) * pageSize;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const nextOffset = offset + pageSize;
  const hasMore = nextOffset < total;

  return {
    meta: {
      page: currentPage,
      pageSize,
      total,
      totalPages,
      hasMore,
      nextCursor: hasMore ? encodeCatalogCursor(nextOffset, queryKey) : null,
      prevCursor:
        offset > 0
          ? encodeCatalogCursor(Math.max(0, offset - pageSize), queryKey)
          : null,
      view,
      sort,
      collection,
      filters,
      scrapedAt: catalog.scrapedAt,
    },
    items: items.slice(offset, offset + pageSize),
  };
}