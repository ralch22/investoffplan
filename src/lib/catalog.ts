import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createCatalogApi, type CatalogApi, type CatalogFile } from "./catalog-core";
import { getDb } from "./db/client";
import { fetchCatalogFile, fetchProjectBySlug as dbFetchProject } from "./db/catalog-queries";
import { parseFoundedYear } from "./developer-utils";
import { cityLabel } from "./format";
import { slugify } from "./slugify";
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

export async function getCatalogApi(): Promise<CatalogApi> {
  if (cachedApi) return cachedApi;

  const isStaticBuild = process.env.NEXT_IS_BUILD === "1";
  if (process.env.NEXT_PUBLIC_CATALOG_API === "1" && !isStaticBuild) {
    const db = await getDb();
    if (db) {
      const raw = await fetchCatalogFile(db);
      if (raw) {
        cachedApi = createCatalogApi(raw);
        return cachedApi;
      }
    }
  }

  try {
    const raw = JSON.parse(readFileSync(join(process.cwd(), "data/catalog.json"), "utf8")) as CatalogFile;
    cachedApi = createCatalogApi(raw);
  } catch {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://investoffplan-preview.emerge-digital.workers.dev";
    const res = await fetch(`${base}/data/catalog.json`, { next: { revalidate: 3600 } });
    const raw = (await res.json()) as CatalogFile;
    cachedApi = createCatalogApi(raw);
  }
  return cachedApi;
}

export async function getDevelopers(): Promise<DeveloperSummary[]> {
  const api = await getCatalogApi();
  const devListBySlug = new Map(api.getDevList().map((dev) => [dev.slug, dev]));
  const map = new Map<string, DeveloperSummary>();

  for (const project of api.projects) {
    const slug = slugify(project.developer);
    const devMeta = devListBySlug.get(slug);
    const existing = map.get(slug);
    const minUnit = Math.min(...project.units.map((u) => u.launchPriceAed));

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
    existing.minPriceAed = Math.min(existing.minPriceAed, minUnit);
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

  for (const dev of api.getDevList()) {
    if (map.has(dev.slug)) continue;
    map.set(dev.slug, {
      slug: dev.slug,
      name: dev.name,
      initials: dev.name.slice(0, 2).toUpperCase(),
      projectCount: dev.numProjectsOnline ?? 0,
      unitCount: 0,
      cities: [],
      minPriceAed: Number.POSITIVE_INFINITY,
      logoUrl: dev.logoUrl,
      description: dev.description,
      foundedYear: parseFoundedYear(dev.establishedSince),
      numProjectsOnline: dev.numProjectsOnline,
    });
  }

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

export async function getAreas(): Promise<AreaSummary[]> {
  const api = await getCatalogApi();
  const map = new Map<string, AreaSummary>();

  for (const project of api.projects) {
    const slug = slugify(project.area);
    const existing = map.get(slug);
    const minUnit = Math.min(...project.units.map((u) => u.launchPriceAed));

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
    existing.minPriceAed = Math.min(existing.minPriceAed, minUnit);
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
  return [...api.projects].filter((p) => p.isPremium).slice(0, limit);
}

/**
 * Genuinely-latest launches: newest sales-start first (excluding the given
 * slugs so the homepage doesn't show the same cards twice back-to-back —
 * "Latest Launches" used to just repeat the Featured query).
 */
export async function getLatestLaunches(limit = 4, excludeSlugs: string[] = []) {
  const api = await getCatalogApi();
  const excluded = new Set(excludeSlugs);
  return [...api.projects]
    .filter((p) => p.salesStartDate && !excluded.has(p.slug))
    .sort((a, b) => (b.salesStartDate ?? "").localeCompare(a.salesStartDate ?? ""))
    .slice(0, limit);
}

export async function getSiteStats() {
  const api = await getCatalogApi();
  const prices = api.units.map((u) => u.launchPriceAed);
  const developers = await getDevelopers();
  const areas = await getAreas();
  return {
    projectCount: api.meta.projectCount,
    unitCount: api.meta.unitCount,
    developerCount: developers.length,
    areaCount: areas.length,
    minPriceAed: Math.min(...prices),
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
    {
      label: "Price floor",
      value: `AED ${(stats.minPriceAed / 1000).toFixed(0)}K`,
      detail: "Lowest launch price in catalog",
    },
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