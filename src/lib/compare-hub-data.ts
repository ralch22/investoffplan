import { cache } from "react";
import { getCatalogApi, type AreaSummary } from "@/lib/catalog";
import type { CoveredArea } from "@/lib/area-compare";
import { getAreaStats } from "@/lib/dld-area-stats";
import { areaKey } from "@/lib/dld";
import { cityLabel } from "@/lib/format";
import { firstSegment, communitySlugFor } from "@/lib/community-slug";
import { slugify } from "@/lib/slugify";

/**
 * Compare hub payload — ONE catalog pass, React-cache deduped.
 *
 * Background: `/compare` was intermittent CF 1102 / 503 on Workers because the
 * hub fired four independent loaders (top yields, area pairs, project pairs,
 * developer pairs), each re-walking communities/developers after a cold
 * `getCatalogApi()`. Even with ISR, isolate cold-regenerate blew the CPU budget.
 *
 * This module walks `api.projects` once and derives all four hub sections.
 * Pair with `dynamic = "force-static"` on the route so Workers serve the baked
 * page from cache and do not re-run this on request.
 */

const MIN_SALE_SAMPLE = 40;
const SEP = "-vs-";

export type CompareHubNamePair = {
  pairSlug: string;
  a: string;
  b: string;
};

export type CompareHubAreaPair = {
  pairSlug: string;
  aName: string;
  bName: string;
  aYield: number | null;
  bYield: number | null;
};

export type CompareHubData = {
  topYields: CoveredArea[];
  comparisons: CompareHubAreaPair[];
  projectPairs: CompareHubNamePair[];
  developerPairs: CompareHubNamePair[];
};

type ProjLite = {
  slug: string;
  name: string;
  isPremium: boolean;
  featuredRank: number;
  unitCount: number;
};

type CommAgg = {
  name: string;
  slug: string;
  city: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  projects: ProjLite[];
};

function rankProj(a: ProjLite, b: ProjLite): number {
  if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
  if (a.featuredRank !== b.featuredRank) return a.featuredRank - b.featuredRank;
  return b.unitCount - a.unitCount;
}

function pairSlug(a: string, b: string): string {
  return [a, b].sort().join(SEP);
}

/**
 * Build every compare-hub section from a single catalog walk.
 * Request-memoized via React `cache` so EN layout + content share one load.
 */
export const getCompareHubData = cache(async (): Promise<CompareHubData> => {
  const api = await getCatalogApi();

  const byComm = new Map<string, CommAgg>();
  const byDev = new Map<string, { name: string; slug: string; projectCount: number }>();

  for (const p of api.projects) {
    const cName = firstSegment(p.area);
    const cKey = areaKey(cName);
    let c = byComm.get(cKey);
    if (!c) {
      c = {
        name: cName,
        slug: communitySlugFor(p.area),
        city: p.city,
        projectCount: 0,
        unitCount: 0,
        minPriceAed: 0,
        projects: [],
      };
      byComm.set(cKey, c);
    }
    c.projectCount += 1;
    c.unitCount += p.units.length;
    const positive = p.units.map((u) => u.launchPriceAed).filter((x) => x > 0);
    const minU = positive.length ? Math.min(...positive) : 0;
    if (minU > 0) {
      c.minPriceAed =
        c.minPriceAed > 0 ? Math.min(c.minPriceAed, minU) : minU;
    }
    c.projects.push({
      slug: p.slug,
      name: p.name,
      isPremium: p.isPremium,
      featuredRank: p.featuredRank ?? 999,
      unitCount: p.unitCount,
    });

    const dSlug = slugify(p.developer);
    const d = byDev.get(dSlug);
    if (!d) byDev.set(dSlug, { name: p.developer, slug: dSlug, projectCount: 1 });
    else d.projectCount += 1;
  }

  // DLD-covered communities (sample-gated) for yields + area compare cards.
  const covered: CoveredArea[] = [];
  for (const c of byComm.values()) {
    const stats = getAreaStats(c.name);
    if (!stats || stats.saleSample < MIN_SALE_SAMPLE) continue;
    const area: AreaSummary = {
      slug: c.slug,
      name: c.name,
      city: c.city,
      cityLabel: cityLabel(c.city),
      projectCount: c.projectCount,
      unitCount: c.unitCount,
      minPriceAed: c.minPriceAed,
    };
    covered.push({ area, stats });
  }

  const topYields = [...covered]
    .filter((x) => x.stats.grossYieldPct != null)
    .sort(
      (a, b) => (b.stats.grossYieldPct ?? 0) - (a.stats.grossYieldPct ?? 0),
    )
    .slice(0, 6);

  // Cap area pair cards early (was C(8,2)=28 rows of HTML on the cold path).
  const byVolume = [...covered]
    .sort((a, b) => b.stats.saleSample - a.stats.saleSample)
    .slice(0, 6);
  const comparisons: CompareHubAreaPair[] = [];
  outerArea: for (let i = 0; i < byVolume.length; i++) {
    for (let j = i + 1; j < byVolume.length; j++) {
      const left = byVolume[i];
      const right = byVolume[j];
      const [x, y] =
        left.area.slug < right.area.slug
          ? [left, right]
          : [right, left];
      comparisons.push({
        pairSlug: pairSlug(x.area.slug, y.area.slug),
        aName: x.area.name,
        bName: y.area.name,
        aYield: x.stats.grossYieldPct,
        bYield: y.stats.grossYieldPct,
      });
      if (comparisons.length >= 8) break outerArea;
    }
  }

  // Project pairs from the densest communities (intra-area head-to-heads).
  const topComms = [...byComm.values()]
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 8);
  const projectPairs: CompareHubNamePair[] = [];
  outerProj: for (const c of topComms) {
    const top = [...c.projects].sort(rankProj).slice(0, 4);
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const [x, y] = [top[i], top[j]].sort((p, q) =>
          p.slug.localeCompare(q.slug),
        );
        projectPairs.push({
          pairSlug: `${x.slug}${SEP}${y.slug}`,
          a: x.name,
          b: y.name,
        });
        if (projectPairs.length >= 6) break outerProj;
      }
    }
  }

  // Developer pairs — catalog counts only (≥3 projects).
  const devs = [...byDev.values()]
    .filter((d) => d.projectCount >= 3)
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 12);
  const developerPairs: CompareHubNamePair[] = [];
  outerDev: for (let i = 0; i < devs.length; i++) {
    for (let j = i + 1; j < devs.length; j++) {
      const [x, y] = [devs[i], devs[j]].sort((p, q) =>
        p.slug.localeCompare(q.slug),
      );
      developerPairs.push({
        pairSlug: pairSlug(x.slug, y.slug),
        a: x.name,
        b: y.name,
      });
      if (developerPairs.length >= 6) break outerDev;
    }
  }

  return { topYields, comparisons, projectPairs, developerPairs };
});
