import "server-only";

import yieldCommunitiesRaw from "../../public/data/yield-communities.json";
import { getCatalogApi, getDevelopers } from "./catalog";
import { getCommunities } from "./communities";
import {
  getAllAreaStats,
  getAreaStats,
  getDldSource,
  getDldTotals,
} from "./dld-area-stats";
import { areaKey } from "./dld";
import { handoverYear } from "./catalog-core";

/**
 * Server-side assembly for the public, indexable UAE Off-Plan Market Report.
 *
 * VERIFIED-DATA-ONLY: every figure is an anonymized aggregate from the official
 * Dubai Land Department 2025 store (src/lib/dld-area-stats.ts, yields capped at
 * MAX_PLAUSIBLE_YIELD_PCT) or the live invest off-plan catalog. Medians resist
 * outliers; price-trend movers are additionally filtered to a plausible band so
 * small-sample composition swings (a single luxury tower skewing a quiet area)
 * never headline the report. No invented numbers, no forecasts.
 */

/** Decent sample before a 2025 appreciation figure is trustworthy enough to rank. */
const MIN_SALES_FOR_TREND = 150;
/**
 * Year-on-year swings beyond this in a single community are almost always a
 * mix-shift artifact (new stock changing the median basket), not a real market
 * move — excluded from the movers tables. Mirrors the sanitize philosophy of
 * MAX_PLAUSIBLE_YIELD_PCT in dld-area-stats.ts.
 */
const MAX_PLAUSIBLE_APPRECIATION_PCT = 45;
/** Property types shown in the entry-point table (in display order). */
const REPORTED_TYPES = ["apartment", "villa", "townhouse", "penthouse", "duplex"] as const;
const MIN_UNITS_PER_TYPE = 20;

interface RawYieldRow {
  key: string;
  name: string;
  grossYieldPct: number;
}

export interface MarketReportYieldRow {
  name: string;
  grossYieldPct: number;
  /** Community slug when this DLD area maps to an off-plan community, else null. */
  slug: string | null;
  /** True when the community has a printable per-community DLD report. */
  hasReport: boolean;
}

export interface MarketReportTrendRow {
  name: string;
  appreciationPct: number;
  saleSample: number;
  slug: string | null;
  hasReport: boolean;
}

export interface MarketReportEmirateRow {
  label: string;
  units: number;
  minPrice: number;
  medianPrice: number;
}

export interface MarketReportTypeRow {
  type: string;
  units: number;
  minPrice: number;
  medianPrice: number;
}

export interface MarketReportDeveloperRow {
  slug: string;
  name: string;
  projectCount: number;
  unitCount: number;
}

export interface MarketReportHandoverRow {
  /** Display label, e.g. "2027" or "2030+" or "2024 & earlier". */
  label: string;
  count: number;
}

export interface MarketReportCommunityLink {
  slug: string;
  name: string;
  saleSample: number;
}

export interface MarketReportData {
  /** Report vintage — the year of the underlying catalog snapshot. */
  year: number;
  /** ISO timestamp of the catalog snapshot (JSON-LD dateModified / "data as of"). */
  catalogUpdated: string;
  dldSource: string;
  dldPeriod: string;
  overview: {
    projectCount: number;
    unitCount: number;
    developerCount: number;
    communityCount: number;
    dldTransactions: number;
    dldAreaCount: number;
    emiratesCovered: number;
    entryPrice: number;
  };
  yields: MarketReportYieldRow[];
  gainers: MarketReportTrendRow[];
  decliners: MarketReportTrendRow[];
  emiratePrices: MarketReportEmirateRow[];
  typePrices: MarketReportTypeRow[];
  developers: MarketReportDeveloperRow[];
  handover: MarketReportHandoverRow[];
  reportLinks: MarketReportCommunityLink[];
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export async function getMarketReportData(): Promise<MarketReportData> {
  const api = await getCatalogApi();
  const [developers, communities] = await Promise.all([
    getDevelopers(),
    getCommunities(),
  ]);
  const dldTotals = getDldTotals();
  const { source: dldSource, sourcePeriod: dldPeriod } = getDldSource();

  // Community lookup by DLD crosswalk key — bridges cadastral/marketing names.
  const communityByKey = new Map(communities.map((c) => [areaKey(c.name), c]));
  const linkFor = (name: string, altKey?: string) => {
    const c =
      communityByKey.get(areaKey(name)) ??
      (altKey ? communityByKey.get(areaKey(altKey)) : undefined);
    if (!c) return { slug: null, hasReport: false };
    return { slug: c.slug, hasReport: getAreaStats(c.name) != null };
  };

  const catalogUpdated = api.meta.scrapedAt;
  const year = new Date(catalogUpdated).getFullYear();

  // ---- Overview -----------------------------------------------------------
  const prices = api.units.map((u) => u.launchPriceAed).filter((v) => v > 0);
  const entryPrice = prices.length ? Math.min(...prices) : 0;
  const emiratesCovered = api
    .getCityCounts()
    .filter((c) => c.slug !== "all").length;

  // ---- Top yields (from the sanitized top-40 public slice) ----------------
  const yields: MarketReportYieldRow[] = (yieldCommunitiesRaw as RawYieldRow[])
    .slice(0, 12)
    .map((r) => {
      const { slug, hasReport } = linkFor(r.name, r.key);
      return { name: r.name, grossYieldPct: r.grossYieldPct, slug, hasReport };
    });

  // ---- 2025 price-trend movers (sanitized + plausibility-filtered) --------
  const movers = getAllAreaStats()
    .filter(
      (a) =>
        a.appreciationPct != null &&
        a.saleSample >= MIN_SALES_FOR_TREND &&
        Math.abs(a.appreciationPct) <= MAX_PLAUSIBLE_APPRECIATION_PCT,
    )
    .map((a) => {
      const { slug, hasReport } = linkFor(a.areaLabel, a.key);
      return {
        name: a.areaLabel,
        appreciationPct: a.appreciationPct as number,
        saleSample: a.saleSample,
        slug,
        hasReport,
      };
    });
  const gainers = [...movers]
    .filter((m) => m.appreciationPct > 0)
    .sort((a, b) => b.appreciationPct - a.appreciationPct)
    .slice(0, 8);
  const decliners = [...movers]
    .filter((m) => m.appreciationPct < 0)
    .sort((a, b) => a.appreciationPct - b.appreciationPct)
    .slice(0, 5);

  // ---- Entry points by emirate --------------------------------------------
  const cityLabelBySlug = new Map<string, string>(
    api.getCityCounts().map((c) => [c.slug, c.label]),
  );
  const byCity = new Map<string, number[]>();
  for (const u of api.units) {
    if (u.launchPriceAed <= 0) continue;
    const list = byCity.get(u.citySlug) ?? [];
    list.push(u.launchPriceAed);
    byCity.set(u.citySlug, list);
  }
  const emiratePrices: MarketReportEmirateRow[] = [...byCity.entries()]
    .map(([slug, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      return {
        label: cityLabelBySlug.get(slug) ?? slug,
        units: sorted.length,
        minPrice: sorted[0],
        medianPrice: median(sorted),
      };
    })
    .sort((a, b) => b.units - a.units);

  // ---- Entry points by property type --------------------------------------
  const byType = new Map<string, number[]>();
  for (const u of api.units) {
    if (u.launchPriceAed <= 0) continue;
    const list = byType.get(u.propertyType) ?? [];
    list.push(u.launchPriceAed);
    byType.set(u.propertyType, list);
  }
  const typePrices: MarketReportTypeRow[] = [];
  for (const type of REPORTED_TYPES) {
    const vals = byType.get(type);
    if (!vals || vals.length < MIN_UNITS_PER_TYPE) continue;
    const sorted = [...vals].sort((a, b) => a - b);
    typePrices.push({
      type,
      units: sorted.length,
      minPrice: sorted[0],
      medianPrice: median(sorted),
    });
  }

  // ---- Most active developers (by live off-plan project count) ------------
  const topDevelopers: MarketReportDeveloperRow[] = [...developers]
    .sort(
      (a, b) =>
        b.projectCount - a.projectCount ||
        b.unitCount - a.unitCount ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 12)
    .map((d) => ({
      slug: d.slug,
      name: d.name,
      projectCount: d.projectCount,
      unitCount: d.unitCount,
    }));

  // ---- Handover pipeline by year ------------------------------------------
  const yearCounts = new Map<number, number>();
  for (const p of api.projects) {
    const y = handoverYear(p.handover);
    if (y == null) continue;
    yearCounts.set(y, (yearCounts.get(y) ?? 0) + 1);
  }
  let earlier = 0;
  let tail = 0;
  const handover: MarketReportHandoverRow[] = [];
  for (const [y, count] of [...yearCounts.entries()].sort((a, b) => a[0] - b[0])) {
    if (y <= year - 1) earlier += count;
    else if (y >= year + 5) tail += count;
    else handover.push({ label: String(y), count });
  }
  if (earlier > 0) handover.unshift({ label: `${year - 1} & earlier`, count: earlier });
  if (tail > 0) handover.push({ label: `${year + 5}+`, count: tail });

  // ---- Detailed per-community reports to link out to ----------------------
  const reportLinks: MarketReportCommunityLink[] = communities
    .map((c) => ({ c, s: getAreaStats(c.name) }))
    .filter((x): x is { c: (typeof communities)[number]; s: NonNullable<ReturnType<typeof getAreaStats>> } =>
      x.s != null,
    )
    .sort((a, b) => b.s.saleSample - a.s.saleSample)
    .slice(0, 12)
    .map((x) => ({ slug: x.c.slug, name: x.c.name, saleSample: x.s.saleSample }));

  return {
    year,
    catalogUpdated,
    dldSource,
    dldPeriod,
    overview: {
      projectCount: api.meta.projectCount,
      unitCount: api.meta.unitCount,
      developerCount: developers.length,
      communityCount: communities.length,
      dldTransactions: dldTotals.totalSales,
      dldAreaCount: dldTotals.areaCount,
      emiratesCovered,
      entryPrice,
    },
    yields,
    gainers,
    decliners,
    emiratePrices,
    typePrices,
    developers: topDevelopers,
    handover,
    reportLinks,
  };
}
