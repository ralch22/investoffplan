import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createCatalogApi, handoverYear, type CatalogApi, type CatalogFile } from "./catalog-core";
import { getDb } from "./db/client";
import { fetchCatalogFile, fetchProjectBySlug as dbFetchProject } from "./db/catalog-queries";
import { getSiteUrl } from "./site-url";
import { parseFoundedYear } from "./developer-utils";
import { getActivePlacements } from "./placements";
import { cityLabel } from "./format";
import { slugify } from "./slugify";
import { communitySlugFor } from "./community-slug";
import { getAreaStats } from "./dld-area-stats";
import {
  computeDeveloperProfile,
  type DeveloperProfile,
} from "./developer-score";
import type { DeveloperSummary } from "./types";

export type { DeveloperSummary };
export { DEVELOPER_PAGE_SIZE } from "./types";

export interface AreaSummary {
  slug: string;
  name: string;
  city: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
}

export interface InsightStat {
  label: string;
  value: string;
  detail?: string;
}

let cachedApi: CatalogApi | null = null;
let cachedRaw: CatalogFile | null = null;
let cachedAt = 0;
// Promise-singleton prevents thundering-herd: concurrent callers on a cold
// isolate all await the same in-flight load instead of firing N parallel fetches.
let loadingPromise: Promise<CatalogApi> | null = null;

// Isolate-lifetime caching matches the site's freshness contract (pages serve
// hour-stale ISR; /api/catalog/* advertises s-maxage=3600). The probe bounds
// reseed staleness: past this age, ONE 1-row catalog_meta query per request
// decides whether to rebuild — instead of the old behavior where the API
// routes re-read the full ~13k rows on EVERY request.
const FRESHNESS_PROBE_MS = 15 * 60_000;

async function maybeRefresh(): Promise<void> {
  if (!cachedRaw || Date.now() - cachedAt < FRESHNESS_PROBE_MS) return;
  cachedAt = Date.now(); // probe at most once per window even if it fails
  try {
    const db = await getDb();
    if (!db) return;
    const { fetchCatalogMeta } = await import("@/lib/db/catalog-queries");
    const meta = await fetchCatalogMeta(db);
    if (meta && meta.scrapedAt !== cachedRaw.scrapedAt) {
      cachedApi = null;
      cachedRaw = null;
    }
  } catch {
    // Probe failure must never take down serving — keep the cached catalog.
  }
}

export async function getCatalogApi(): Promise<CatalogApi> {
  await maybeRefresh();
  if (cachedApi) return cachedApi;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const isStaticBuild = process.env.NEXT_IS_BUILD === "1";
    if (process.env.NEXT_PUBLIC_CATALOG_API === "1" && !isStaticBuild) {
      const db = await getDb();
      if (db) {
        const raw = await fetchCatalogFile(db);
        if (raw) {
          cachedRaw = raw;
          cachedApi = createCatalogApi(raw);
          cachedAt = Date.now();
          loadingPromise = null;
          return cachedApi;
        }
      }
    }

    try {
      const raw = JSON.parse(readFileSync(join(process.cwd(), "data/catalog.json"), "utf8")) as CatalogFile;
      cachedRaw = raw;
      cachedApi = createCatalogApi(raw);
    } catch {
      // Apex fallback — a missing env var must not point data fetches at the
      // preview Worker (src/lib/site-url.ts defaults to the production domain).
      const base = getSiteUrl();
      // catalog.json is excluded from CF assets (>25 MB); use the lite mirror instead.
      const res = await fetch(`${base}/data/catalog-lite.json`, { next: { revalidate: 3600 } });
      const raw = (await res.json()) as CatalogFile;
      cachedRaw = raw;
      cachedApi = createCatalogApi(raw);
    }
    cachedAt = Date.now();
    loadingPromise = null;
    return cachedApi!;
  })();

  return loadingPromise;
}

/**
 * The raw CatalogFile behind getCatalogApi(), sharing the same in-isolate
 * cache + thundering-herd guard. The /api/catalog/* routes use this instead
 * of re-reading ~13k D1 rows per request (the pre-hardening behavior).
 */
export async function getCatalogFile(): Promise<CatalogFile | null> {
  await getCatalogApi();
  return cachedRaw;
}

export async function getDevelopers(): Promise<DeveloperSummary[]> {
  const api = await getCatalogApi();
  const devListBySlug = new Map(api.getDevList().map((dev) => [dev.slug, dev]));
  const map = new Map<string, DeveloperSummary>();

  for (const project of api.projects) {
    const slug = slugify(project.developer);
    const devMeta = devListBySlug.get(slug);
    const existing = map.get(slug);
    // 0 = unstated PF price — exclude so minPrice never collapses to "AED 0".
    const positive = project.units
      .map((u) => u.launchPriceAed)
      .filter((p) => p > 0);
    const minUnit = positive.length > 0 ? Math.min(...positive) : 0;

    if (!existing) {
      map.set(slug, {
        slug,
        name: project.developer,
        initials: project.developerInitials,
        projectCount: 1,
        unitCount: project.units.length,
        cities: [project.city],
        minPriceAed: minUnit,
        logoUrl: devMeta?.logoUrl ?? project.developerLogo,
        description: devMeta?.description,
        foundedYear: parseFoundedYear(devMeta?.establishedSince),
        numProjectsOnline: devMeta?.numProjectsOnline,
      });
      continue;
    }

    existing.projectCount += 1;
    existing.unitCount += project.units.length;
    if (minUnit > 0) {
      existing.minPriceAed =
        existing.minPriceAed > 0 ? Math.min(existing.minPriceAed, minUnit) : minUnit;
    }
    if (!existing.cities.includes(project.city)) {
      existing.cities.push(project.city);
    }
    if (!existing.logoUrl && project.developerLogo) {
      existing.logoUrl = project.developerLogo;
    }
    if (!existing.description && devMeta?.description) {
      existing.description = devMeta.description;
    }
    if (!existing.foundedYear && devMeta?.establishedSince) {
      existing.foundedYear = parseFoundedYear(devMeta.establishedSince);
    }
    if (existing.numProjectsOnline == null && devMeta?.numProjectsOnline != null) {
      existing.numProjectsOnline = devMeta.numProjectsOnline;
    }
  }

  // devList entries with NO catalog projects are intentionally NOT added:
  // using PF's numProjectsOnline as projectCount shipped directory cards
  // promising "47 projects" and a developer page whose listings join (our
  // catalog) rendered empty — e.g. /developers/arada. devList is metadata
  // enrichment for developers we actually carry, not a page source. (Arada
  // itself is an ingest gap; once its projects land in the catalog, its page
  // reappears automatically with real listings.)

  return [...map.values()]
    .filter((dev) => dev.projectCount > 0)
    .sort(
      (a, b) =>
        b.unitCount - a.unitCount ||
        b.projectCount - a.projectCount ||
        a.name.localeCompare(b.name),
    );
}

export async function getDeveloperCityCounts(): Promise<
  Array<{ slug: import("./types").CitySlug; label: string; count: number }>
> {
  const developers = await getDevelopers();
  const api = await getCatalogApi();
  const counts = new Map<string, number>();

  for (const dev of developers) {
    for (const city of dev.cities) {
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
  }

  return api
    .getCityCounts()
    .filter((city) => city.slug !== "all")
    .map((city) => ({
      slug: city.slug,
      label: city.label,
      count: counts.get(city.slug) ?? 0,
    }))
    .filter((city) => city.count > 0);
}

export async function getDeveloper(slug: string): Promise<DeveloperSummary | null> {
  const developers = await getDevelopers();
  return developers.find((d) => d.slug === slug) ?? null;
}

export async function getProjectsByDeveloper(slug: string) {
  const api = await getCatalogApi();
  return api.projects.filter((p) => slugify(p.developer) === slug);
}

export type { DeveloperProfile };

let cachedProfileNorms: { maxProjectCount: number; maxCommunityCount: number } | null =
  null;

/**
 * Catalog-wide maxima used to normalize the Developer Profile scale & reach
 * sub-metrics. Scans every project once (grouped by developer) and caches the
 * result for the lifetime of the worker — the catalog is immutable per build.
 */
async function getDeveloperProfileNorms(): Promise<{
  maxProjectCount: number;
  maxCommunityCount: number;
}> {
  if (cachedProfileNorms) return cachedProfileNorms;
  const api = await getCatalogApi();
  const projectCounts = new Map<string, number>();
  const communities = new Map<string, Set<string>>();
  for (const project of api.projects) {
    const slug = slugify(project.developer);
    projectCounts.set(slug, (projectCounts.get(slug) ?? 0) + 1);
    const set = communities.get(slug) ?? new Set<string>();
    if (project.area) set.add(communitySlugFor(project.area));
    communities.set(slug, set);
  }
  cachedProfileNorms = {
    maxProjectCount: Math.max(1, ...projectCounts.values()),
    maxCommunityCount: Math.max(
      1,
      ...[...communities.values()].map((set) => set.size),
    ),
  };
  return cachedProfileNorms;
}

/**
 * Data-derived Developer PROFILE for a developer slug — NOT a quality/delivery
 * rating (see developer-score.ts). Computed at request time from the OWN
 * off-plan catalog + official 2025 DLD area medians; no cookies/headers, so it
 * stays ISR-friendly. Returns null when the developer has no listed projects.
 */
export async function getDeveloperProfile(
  slug: string,
): Promise<DeveloperProfile | null> {
  const projects = await getProjectsByDeveloper(slug);
  if (projects.length === 0) return null;
  const { maxProjectCount, maxCommunityCount } = await getDeveloperProfileNorms();
  return computeDeveloperProfile({
    projects: projects.map((p) => ({
      area: p.area,
      paymentPlan: p.paymentPlan,
      units: p.units.map((u) => ({
        launchPriceAed: u.launchPriceAed,
        sqftMin: u.sqftMin,
      })),
    })),
    maxProjectCount,
    maxCommunityCount,
    areaMedianPpsqft: (area) => getAreaStats(area)?.medianPpsqft ?? null,
  });
}

export async function getAreas(): Promise<AreaSummary[]> {
  const api = await getCatalogApi();
  const map = new Map<string, AreaSummary>();

  for (const project of api.projects) {
    const slug = slugify(project.area);
    const existing = map.get(slug);
    // 0 = unstated PF price — exclude so area "from" never reads "AED 0".
    const positive = project.units
      .map((u) => u.launchPriceAed)
      .filter((p) => p > 0);
    const minUnit = positive.length > 0 ? Math.min(...positive) : 0;

    if (!existing) {
      map.set(slug, {
        slug,
        name: project.area,
        city: project.city,
        cityLabel: cityLabel(project.city),
        projectCount: 1,
        unitCount: project.units.length,
        minPriceAed: minUnit,
      });
      continue;
    }

    existing.projectCount += 1;
    existing.unitCount += project.units.length;
    if (minUnit > 0) {
      existing.minPriceAed =
        existing.minPriceAed > 0 ? Math.min(existing.minPriceAed, minUnit) : minUnit;
    }
  }

  return [...map.values()].sort((a, b) => b.projectCount - a.projectCount);
}

export async function getArea(slug: string): Promise<AreaSummary | null> {
  const areas = await getAreas();
  return areas.find((a) => a.slug === slug) ?? null;
}

export async function getProjectsByArea(slug: string) {
  const api = await getCatalogApi();
  return api.projects.filter((p) => slugify(p.area) === slug);
}

export async function getFeaturedProjects(limit = 4) {
  const api = await getCatalogApi();
  // Editorial ordering: explicit featuredRank first (ascending), then the
  // remaining premium pool in catalog order. Previously featuredRank was
  // ignored entirely.
  const pool = [...api.projects]
    .filter((p) => p.isPremium || p.featuredRank != null)
    .sort(
      (a, b) =>
        (a.featuredRank ?? Number.MAX_SAFE_INTEGER) -
        (b.featuredRank ?? Number.MAX_SAFE_INTEGER),
    );

  // Paid home-featured placements overlay — RUNTIME only. At static build
  // (NEXT_IS_BUILD=1) there is no D1 context, so the build keeps the editorial
  // pool exactly as before; at runtime, active placements (by rank) are pinned
  // first and the editorial pool backfills to `limit`. getActivePlacements
  // returns [] on any error, so behavior degrades to today's exactly.
  // NOTE: the homepage is ISR (revalidate 3600), so a new/expired placement
  // surfaces within <=1 hour of the change — not instantly.
  if (process.env.NEXT_IS_BUILD !== "1") {
    const placements = await getActivePlacements("home-featured");
    if (placements.length > 0) {
      const bySlug = new Map(api.projects.map((p) => [p.slug, p]));
      const placed: typeof pool = [];
      const seen = new Set<string>();
      for (const placement of placements) {
        // Skip unknown slugs (e.g. project dropped by a re-ingest) and dupes.
        const project = bySlug.get(placement.projectSlug);
        if (!project || seen.has(project.slug)) continue;
        seen.add(project.slug);
        placed.push(project);
      }
      if (placed.length > 0) {
        const backfill = pool.filter((p) => !seen.has(p.slug));
        return [...placed, ...backfill].slice(0, limit);
      }
    }
  }

  return pool.slice(0, limit);
}

/**
 * Genuinely-latest launches: newest sales-start first (excluding the given
 * slugs so the homepage doesn't show the same cards twice back-to-back —
 * "Latest Launches" used to just repeat the Featured query).
 */
export async function getLatestLaunches(limit = 4, excludeSlugs: string[] = []) {
  const api = await getCatalogApi();
  const excluded = new Set(excludeSlugs);
  // Guard against already-handed-over projects surfacing as "Latest Launches":
  // a listing whose handover year is strictly before the current period (2026)
  // is not a launch. Unknown/unparseable handover (handoverYear === null) stays
  // eligible so we don't over-filter projects with no stated handover.
  const currentYear = 2026;
  return [...api.projects]
    .filter((p) => p.salesStartDate && !excluded.has(p.slug))
    .filter((p) => {
      const hy = handoverYear(p.handover);
      return hy === null || hy >= currentYear;
    })
    .sort((a, b) => (b.salesStartDate ?? "").localeCompare(a.salesStartDate ?? ""))
    .slice(0, limit);
}

export async function getSiteStats() {
  const api = await getCatalogApi();
  const prices = api.units.map((u) => u.launchPriceAed).filter((p) => p > 0);
  const developers = await getDevelopers();
  const areas = await getAreas();
  return {
    projectCount: api.meta.projectCount,
    unitCount: api.meta.unitCount,
    developerCount: developers.length,
    areaCount: areas.length,
    minPriceAed: prices.length > 0 ? Math.min(...prices) : null,
    premiumCount: api.units.filter((u) => u.isPremium).length,
    enrichedCount: 0,
  };
}

export async function getInsights(): Promise<InsightStat[]> {
  const api = await getCatalogApi();
  const stats = await getSiteStats();
  const cities = api.getCityCounts().filter((c) => c.slug !== "all");

  return [
    {
      label: "Unit options",
      value: stats.unitCount.toString(),
      detail: `${stats.projectCount} off-plan projects across the UAE`,
    },
    {
      label: "Developers tracked",
      value: stats.developerCount.toString(),
      detail: "Full PF developer catalog",
    },
    {
      label: "Top emirate",
      value: cities[0]?.label ?? "Dubai",
      detail: `${cities[0]?.count ?? 0} unit options`,
    },
    {
      label: "Catalog refreshed",
      value: api.meta.scrapedAt.slice(0, 10),
      detail: "Property Finder unit-view parity ingest",
    },
    {
      label: "Premium listings",
      value: stats.premiumCount.toString(),
      detail: "Premium-tier launches",
    },
    ...(stats.minPriceAed != null
      ? [
          {
            label: "Price floor",
            value: `AED ${(stats.minPriceAed / 1000).toFixed(0)}K`,
            detail: "Lowest launch price in catalog",
          },
        ]
      : []),
  ];
}

export async function getProjectBySlug(slug: string) {
  const isStaticBuild = process.env.NEXT_IS_BUILD === "1";
  if (process.env.NEXT_PUBLIC_CATALOG_API === "1" && !isStaticBuild) {
    const db = await getDb();
    if (db) {
      const project = await dbFetchProject(db, slug);
      if (project) return project;
    }
  }
  const api = await getCatalogApi();
  return api.getProjectBySlug(slug);
}

/** Most common project amenities across the catalog, for filter options. */
export async function getTopAmenities(limit = 20): Promise<string[]> {
  const api = await getCatalogApi();
  const counts = new Map<string, { label: string; count: number }>();
  for (const project of api.projects) {
    for (const amenity of project.amenities ?? []) {
      const key = amenity.trim().toLowerCase();
      if (!key) continue;
      const entry = counts.get(key);
      if (entry) entry.count += 1;
      else counts.set(key, { label: amenity.trim(), count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((entry) => entry.label);
}

export { slugify } from "./slugify";