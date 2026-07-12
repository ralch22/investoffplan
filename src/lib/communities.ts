import { getAreas, getCatalogApi } from "@/lib/catalog";
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

export { communitySlugFor, firstSegment } from "@/lib/community-slug";
import { communitySlugFor, firstSegment } from "@/lib/community-slug";

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
    if (area.minPriceAed > 0) {
      existing.minPriceAed =
        existing.minPriceAed > 0
          ? Math.min(existing.minPriceAed, area.minPriceAed)
          : area.minPriceAed;
    }
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

/** All projects belonging to a community (any breadcrumb variant of it). */
export async function getProjectsByCommunity(slug: string) {
  const api = await getCatalogApi();
  return api.projects.filter((p) => communitySlugFor(p.area) === slug);
}

/** First servable project image across a community's projects (hero/card art). */
export async function getCommunityImage(slug: string): Promise<string | undefined> {
  const { isServableImage } = await import("@/lib/area-images");
  const projects = await getProjectsByCommunity(slug);
  return (
    projects.map((p) => p.imageUrl).find(isServableImage) ??
    projects.flatMap((p) => p.imageGallery ?? []).find(isServableImage)
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
