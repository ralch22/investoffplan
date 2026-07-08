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

/** Covered areas (have DLD stats), ordered by transaction volume. */
async function coveredAreas(): Promise<AreaSummary[]> {
  const areas = await getAreas();
  return areas
    .map((area) => ({ area, stats: getAreaStats(area.name) }))
    .filter((x): x is { area: AreaSummary; stats: DldAreaStats } => x.stats != null)
    .sort((x, y) => y.stats.saleSample - x.stats.saleSample)
    .map((x) => x.area);
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
