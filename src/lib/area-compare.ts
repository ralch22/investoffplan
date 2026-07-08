import { getAreas } from "@/lib/catalog";
import type { AreaSummary } from "@/lib/catalog";
import { getAreaStats, type DldAreaStats } from "@/lib/dld-area-stats";

/** How many top DLD-covered areas to build comparison pages for (pairs = n*(n-1)/2). */
const TOP_N = 14;
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

/** Areas that have DLD stats, paired with those stats. */
async function coveredAreaPairs(): Promise<CoveredArea[]> {
  const areas = await getAreas();
  return areas
    .map((area) => ({ area, stats: getAreaStats(area.name) }))
    .filter((x): x is CoveredArea => x.stats != null);
}

/** Covered areas (have DLD stats), ordered by transaction volume. */
async function coveredAreas(): Promise<AreaSummary[]> {
  return (await coveredAreaPairs())
    .sort((x, y) => y.stats.saleSample - x.stats.saleSample)
    .map((x) => x.area);
}

/** Top covered areas by a chosen DLD metric — for homepage / hub surfaces. */
export async function getTopCoveredAreas(
  by: "yield" | "volume",
  limit = 6,
): Promise<CoveredArea[]> {
  const pairs = await coveredAreaPairs();
  const scored =
    by === "yield"
      ? pairs.filter((p) => p.stats.grossYieldPct != null && p.stats.saleSample >= 40)
      : pairs;
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

/** Static params for the top-N covered areas' unordered pairs. */
export async function getComparablePairSlugs(): Promise<string[]> {
  const areas = (await coveredAreas()).slice(0, TOP_N);
  const pairs: string[] = [];
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      pairs.push(pairSlug(areas[i].slug, areas[j].slug));
    }
  }
  return pairs;
}

/** Suggested comparisons FROM a given area (for cross-links on the area page). */
export async function getSuggestedComparisons(
  fromSlug: string,
  limit = 4,
): Promise<{ pairSlug: string; otherName: string }[]> {
  const areas = (await coveredAreas()).slice(0, TOP_N);
  if (!areas.some((a) => a.slug === fromSlug)) return [];
  return areas
    .filter((a) => a.slug !== fromSlug)
    .slice(0, limit)
    .map((other) => ({ pairSlug: pairSlug(fromSlug, other.slug), otherName: other.name }));
}

export interface ComparisonListItem {
  pairSlug: string;
  aName: string;
  bName: string;
  aYield: number | null;
  bYield: number | null;
}

/** Detailed pairs for the /compare hub — top covered areas paired for display. */
export async function getComparisonList(topN = TOP_N): Promise<ComparisonListItem[]> {
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

  const areas = await getAreas();
  const areaA = areas.find((a) => a.slug === slugA);
  const areaB = areas.find((a) => a.slug === slugB);
  if (!areaA || !areaB) return null;

  return {
    pairSlug: pairSlug(slugA, slugB),
    a: { area: areaA, stats: getAreaStats(areaA.name) },
    b: { area: areaB, stats: getAreaStats(areaB.name) },
  };
}
