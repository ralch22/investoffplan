import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createCatalogApi, type CatalogApi, type CatalogFile } from "./catalog-core";
import { getDb } from "./db/client";
import { fetchCatalogFile, fetchProjectBySlug as dbFetchProject } from "./db/catalog-queries";
import { cityLabel } from "./format";

export interface DeveloperSummary {
  slug: string;
  name: string;
  initials: string;
  projectCount: number;
  unitCount: number;
  cities: string[];
  minPriceAed: number;
}

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
  const map = new Map<string, DeveloperSummary>();

  for (const project of api.projects) {
    const slug = slugify(project.developer);
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
      });
      continue;
    }

    existing.projectCount += 1;
    existing.unitCount += project.units.length;
    existing.minPriceAed = Math.min(existing.minPriceAed, minUnit);
    if (!existing.cities.includes(project.city)) {
      existing.cities.push(project.city);
    }
  }

  return [...map.values()].sort((a, b) => b.projectCount - a.projectCount);
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

export { slugify };