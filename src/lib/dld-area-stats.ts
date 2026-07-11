import stored from "../../data/dld-area-stats.json";
import { areaKey } from "@/lib/dld";

export interface DldAreaStats {
  areaLabel: string;
  saleSample: number;
  medianPrice: number | null;
  medianPpsqft: number | null;
  appreciationPct: number | null;
  monthlyTrend: { month: string; medianPpsqft: number; n: number }[];
  rentSample: number;
  medianAnnualRent: number | null;
  grossYieldPct: number | null;
  confidence: "high" | "medium" | "low" | "none";
  /** Per-bedroom breakdown, keyed "0"(studio)|"1"|"2"|"3"|"4"(4+). */
  beds?: Record<string, { n: number; medianPrice: number | null; medianPpsqft: number | null }>;
}

interface Store {
  source: string;
  sourcePeriod: string;
  areas: Record<string, DldAreaStats>;
}

const store = stored as Store;

/**
 * Residential gross yields in Dubai run ~4-9%. Anything above this is a data
 * artifact — e.g. Dubai Investment Park's DLD rent median is contaminated by
 * industrial/staff-accommodation contracts, producing a "16-20% yield" that
 * would headline every yield surface as fake #1. Null it rather than show it.
 */
const MAX_PLAUSIBLE_YIELD_PCT = 12;

function sanitizeStats(s: DldAreaStats): DldAreaStats {
  if (s.grossYieldPct != null && s.grossYieldPct > MAX_PLAUSIBLE_YIELD_PCT) {
    return { ...s, grossYieldPct: null, medianAnnualRent: null };
  }
  return s;
}

/** First breadcrumb segment — IOP area names are "Community, City, UAE". */
function firstSegment(areaName: string): string {
  return areaName.split(",")[0] ?? areaName;
}

/**
 * Anonymized DLD market stats for an IOP area, or null when the area doesn't
 * map to a DLD community with enough transactions. Keyed through the same
 * `areaKey()` crosswalk the ETL uses, so marketing↔cadastral names bridge.
 */
export function getAreaStats(areaName: string | undefined | null): DldAreaStats | null {
  if (!areaName) return null;
  const s = store.areas[areaKey(firstSegment(areaName))];
  return s ? sanitizeStats(s) : null;
}

export function getDldSource(): { source: string; sourcePeriod: string } {
  return { source: store.source, sourcePeriod: store.sourcePeriod };
}

/**
 * Dataset-wide totals for trust/data-provenance surfaces: sums `saleSample`
 * across every area in the anonymized DLD stats store.
 */
export function getDldTotals(): { totalSales: number; areaCount: number } {
  let totalSales = 0;
  let areaCount = 0;
  for (const key of Object.keys(store.areas)) {
    totalSales += store.areas[key].saleSample;
    areaCount += 1;
  }
  return { totalSales, areaCount };
}

/**
 * Every anonymized DLD area (sanitized), tagged with its store `key`, for
 * market-wide rankings (price-trend movers, coverage). Same sanitize pass as
 * getAreaStats so implausible yields never leak into an aggregate surface.
 */
export function getAllAreaStats(): Array<DldAreaStats & { key: string }> {
  return Object.keys(store.areas).map((key) => ({
    key,
    ...sanitizeStats(store.areas[key]),
  }));
}
