import { getAreas } from "@/lib/catalog";
import type { AreaSummary } from "@/lib/catalog";
import { areaKey } from "@/lib/dld";
import { slugify } from "@/lib/slugify";

/**
 * Catalog "areas" are project-suffixed PF breadcrumbs ("Jumeirah Village
 * Circle, District 13, 105 Residences") — 645 near-unique strings for only
 * ~94 real communities. A community is the first breadcrumb segment, grouped
 * through the same `areaKey()` crosswalk DLD stats use, so every variant of
 * one community lands on one canonical entity.
 */
export interface CommunitySummary {
  /** Canonical slug — slugify(first breadcrumb segment). */
  slug: string;
  /** Clean community name, e.g. "Jumeirah Village Circle". */
  name: string;
  city: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  /** Area-variant slugs folded into this community (for redirects/lookups). */
  variantSlugs: string[];
}

/** First breadcrumb segment — IOP area names are "Community, District, Project". */
export function firstSegment(areaName: string): string {
  return (areaName.split(",")[0] ?? areaName).trim();
}

/** Canonical community slug for any raw catalog area name. */
export function communitySlugFor(areaName: string): string {
  return slugify(firstSegment(areaName));
}

let cache: CommunitySummary[] | null = null;

/** The ~94 real communities, aggregated from all breadcrumb area variants. */
export async function getCommunities(): Promise<CommunitySummary[]> {
  if (cache) return cache;
  const areas = await getAreas();
  const map = new Map<string, CommunitySummary>();

  for (const area of areas) {
    const key = areaKey(firstSegment(area.name));
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        slug: communitySlugFor(area.name),
        name: firstSegment(area.name),
        city: area.city,
        cityLabel: area.cityLabel,
        projectCount: area.projectCount,
        unitCount: area.unitCount,
        minPriceAed: area.minPriceAed,
        variantSlugs: [area.slug],
      });
      continue;
    }
    existing.projectCount += area.projectCount;
    existing.unitCount += area.unitCount;
    existing.minPriceAed = Math.min(existing.minPriceAed, area.minPriceAed);
    existing.variantSlugs.push(area.slug);
  }

  cache = [...map.values()].sort((a, b) => b.projectCount - a.projectCount);
  return cache;
}

/** Community by canonical slug. */
export async function getCommunity(slug: string): Promise<CommunitySummary | null> {
  return (await getCommunities()).find((c) => c.slug === slug) ?? null;
}

/**
 * Community that a raw area-variant slug belongs to — for 308-redirecting old
 * `/areas/{variant}` URLs to their canonical community page.
 */
export async function communityForVariantSlug(
  variantSlug: string,
): Promise<CommunitySummary | null> {
  const communities = await getCommunities();
  return (
    communities.find((c) => c.slug === variantSlug) ??
    communities.find((c) => c.variantSlugs.includes(variantSlug)) ??
    null
  );
}

/** AreaSummary shape for a community — lets area-consuming UIs render communities. */
export function communityAsArea(c: CommunitySummary): AreaSummary {
  return {
    slug: c.slug,
    name: c.name,
    city: c.city,
    cityLabel: c.cityLabel,
    projectCount: c.projectCount,
    unitCount: c.unitCount,
    minPriceAed: c.minPriceAed,
  };
}
