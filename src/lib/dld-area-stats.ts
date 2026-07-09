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
  return store.areas[areaKey(firstSegment(areaName))] ?? null;
}

export function getDldSource(): { source: string; sourcePeriod: string } {
  return { source: store.source, sourcePeriod: store.sourcePeriod };
}
