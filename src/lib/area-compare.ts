import type { AreaSummary } from "@/lib/catalog";
import {
  communityAsArea,
  communityForVariantSlug,
  getCommunities,
} from "@/lib/communities";
import { getAreaStats, type DldAreaStats } from "@/lib/dld-area-stats";

/**
 * Comparison pages need a real sold-transaction sample on BOTH sides — pairs
 * are built from DLD-covered communities with at least this many 2025 sales.
 */
const MIN_SALE_SAMPLE = 40;
const SEP = "-vs-";

export interface AreaComparisonSide {
  area: AreaSummary;
  stats: DldAreaStats | null;
}

export interface AreaComparison {
  pairSlug: string;
  a: AreaComparisonSide;
  b: AreaComparisonSide;
}

export interface CoveredArea {
  area: AreaSummary;
  stats: DldAreaStats;
}

/**
 * DLD-covered COMMUNITIES paired with their stats. Communities — not raw
 * catalog areas: catalog area names are project-suffixed breadcrumbs, and
 * every variant of one community maps to the same DLD row. Grouping first
 * keeps one entry per real community (previously the top-14 "areas" were 14
 * JVC variants, making every comparison a self-comparison).
 */
async function coveredAreaPairs(): Promise<CoveredArea[]> {
  const communities = await getCommunities();
  return communities
    .map((c) => ({ area: communityAsArea(c), stats: getAreaStats(c.name) }))
    .filter((x): x is CoveredArea => x.stats != null)
    .filter((x) => x.stats.saleSample >= MIN_SALE_SAMPLE);
}

/** Covered communities, ordered by transaction volume. */
async function coveredAreas(): Promise<AreaSummary[]> {
  return (await coveredAreaPairs())
    .sort((x, y) => y.stats.saleSample - x.stats.saleSample)
    .map((x) => x.area);
}

/** Top covered communities by a chosen DLD metric — for homepage / hub surfaces. */
export async function getTopCoveredAreas(
  by: "yield" | "volume",
  limit = 6,
): Promise<CoveredArea[]> {
  const pairs = await coveredAreaPairs();
  const scored =
    by === "yield" ? pairs.filter((p) => p.stats.grossYieldPct != null) : pairs;
  scored.sort((x, y) =>
    by === "yield"
      ? (y.stats.grossYieldPct ?? 0) - (x.stats.grossYieldPct ?? 0)
      : y.stats.saleSample - x.stats.saleSample,
  );
  return scored.slice(0, limit);
}

/** Canonical unordered pair slug (alphabetical) so A-vs-B and B-vs-A collapse. */
function pairSlug(a: string, b: string): string {
  return [a, b].sort().join(SEP);
}

/** Static params for every covered-community unordered pair. */
export async function getComparablePairSlugs(): Promise<string[]> {
  const areas = await coveredAreas();
  const pairs: string[] = [];
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      pairs.push(pairSlug(areas[i].slug, areas[j].slug));
    }
  }
  return pairs;
}

/** Suggested comparisons FROM a given community (for cross-links on its page). */
export async function getSuggestedComparisons(
  fromSlug: string,
  limit = 4,
): Promise<{ pairSlug: string; otherName: string }[]> {
  const areas = await coveredAreas();
  const from = await communityForVariantSlug(fromSlug);
  if (!from || !areas.some((a) => a.slug === from.slug)) return [];
  return areas
    .filter((a) => a.slug !== from.slug)
    .slice(0, limit)
    .map((other) => ({ pairSlug: pairSlug(from.slug, other.slug), otherName: other.name }));
}

export interface ComparisonListItem {
  pairSlug: string;
  aName: string;
  bName: string;
  aYield: number | null;
  bYield: number | null;
}

/** Detailed pairs for the compare hub — top covered communities paired for display. */
export async function getComparisonList(topN = 14): Promise<ComparisonListItem[]> {
  const pairs = await coveredAreaPairs();
  pairs.sort((x, y) => y.stats.saleSample - x.stats.saleSample);
  const areas = pairs.slice(0, topN);
  const out: ComparisonListItem[] = [];
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      out.push({
        pairSlug: pairSlug(areas[i].area.slug, areas[j].area.slug),
        aName: areas[i].area.name,
        bName: areas[j].area.name,
        aYield: areas[i].stats.grossYieldPct,
        bYield: areas[j].stats.grossYieldPct,
      });
    }
  }
  return out;
}

export async function buildAreaComparison(slug: string): Promise<AreaComparison | null> {
  const idx = slug.indexOf(SEP);
  if (idx < 0) return null;
  const slugA = slug.slice(0, idx);
  const slugB = slug.slice(idx + SEP.length);
  if (!slugA || !slugB || slugA === slugB) return null;

  // Resolve through the community layer so legacy variant slugs still land,
  // and self-comparisons (two variants of one community) 404.
  const communityA = await communityForVariantSlug(slugA);
  const communityB = await communityForVariantSlug(slugB);
  if (!communityA || !communityB) return null;
  if (communityA.slug === communityB.slug) return null;

  return {
    pairSlug: pairSlug(communityA.slug, communityB.slug),
    a: { area: communityAsArea(communityA), stats: getAreaStats(communityA.name) },
    b: { area: communityAsArea(communityB), stats: getAreaStats(communityB.name) },
  };
}
