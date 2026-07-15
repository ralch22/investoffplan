import recentStored from "../../data/dld-recent-sales.json";
import appreciationStored from "../../data/dld-appreciation.json";
import volumeStored from "../../data/dld-monthly-volume.json";
import { areaKey } from "@/lib/dld";

/** One anonymized DLD transaction row (month granularity — no exact dates). */
export interface RecentSaleRow {
  month: string; // YYYY-MM
  project: string | null;
  beds: number | null;
  sizeBandSqm: number; // 5-sqm band floor
  price: number; // AED
  aedPerSqft: number;
  regType: "off-plan" | "ready" | null;
}

export interface OffplanVsReadySpread {
  offplanPpsqft: number;
  readyPpsqft: number;
  spreadPct: number; // + = off-plan trades above ready
  nOffplan: number;
  nReady: number;
  confidence: "high" | "medium" | "low" | "none";
}

interface RecentStore {
  meta: { builtAt: string; source: string; rowsPerArea: number };
  areas: Record<string, RecentSaleRow[]>;
}
interface AppreciationStore {
  meta: { builtAt: string; source: string; method: string; caveats: string[]; minSample: number };
  communities: Record<string, { appreciationPct: number; pairs: number; confidence: string }>;
  projects: Record<string, { appreciationPct: number; pairs: number; confidence: string }>;
  offplanVsReady: Record<string, OffplanVsReadySpread>;
}
interface VolumeStore {
  meta: { builtAt: string; source: string };
  areas: Record<string, Record<string, { n: number; offplan: number }>>;
}

const recent = recentStored as RecentStore;
const appreciation = appreciationStored as unknown as AppreciationStore;
const volume = volumeStored as VolumeStore;

function firstSegment(areaName: string): string {
  return areaName.split(",")[0] ?? areaName;
}

/** Recent anonymized DLD sales for an IOP area name, or null below sample gate. */
export function getRecentSales(areaName: string | undefined | null): RecentSaleRow[] | null {
  if (!areaName) return null;
  const rows = recent.areas[areaKey(firstSegment(areaName))];
  return rows && rows.length > 0 ? rows : null;
}

/** Off-plan vs ready AED/sqft spread for an IOP area name (2025 medians). */
export function getOffplanVsReady(areaName: string | undefined | null): OffplanVsReadySpread | null {
  if (!areaName) return null;
  return appreciation.offplanVsReady[areaKey(firstSegment(areaName))] ?? null;
}

export function getRecentSalesMeta(): RecentStore["meta"] {
  return recent.meta;
}

export function getAppreciationMeta(): AppreciationStore["meta"] {
  return appreciation.meta;
}

/** Total transactions + off-plan share for a month across all areas. */
export function getMarketPulse(): {
  latestMonth: string | null;
  totalTx: number;
  offplanSharePct: number | null;
  hottest: { areaKey: string; n: number; momPct: number | null } | null;
} {
  // Latest month with meaningful coverage (some areas trail; use the max month
  // that appears in ≥10 areas so a partial final month doesn't skew).
  const monthCounts = new Map<string, number>();
  for (const months of Object.values(volume.areas)) {
    for (const m of Object.keys(months)) monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }
  const eligible = [...monthCounts.entries()].filter(([, c]) => c >= 10).map(([m]) => m).sort();
  const latestMonth = eligible[eligible.length - 1] ?? null;
  if (!latestMonth) return { latestMonth: null, totalTx: 0, offplanSharePct: null, hottest: null };

  let totalTx = 0;
  let offplan = 0;
  let hottest: { areaKey: string; n: number; momPct: number | null } | null = null;
  const prevMonth = ((): string => {
    const [y, m] = latestMonth.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 2, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();

  for (const [aKey, months] of Object.entries(volume.areas)) {
    const cur = months[latestMonth];
    if (!cur) continue;
    totalTx += cur.n;
    offplan += cur.offplan;
    if (!hottest || cur.n > hottest.n) {
      const prev = months[prevMonth];
      const momPct =
        prev && prev.n > 0 ? Math.round(((cur.n - prev.n) / prev.n) * 1000) / 10 : null;
      hottest = { areaKey: aKey, n: cur.n, momPct };
    }
  }
  return {
    latestMonth,
    totalTx,
    offplanSharePct: totalTx > 0 ? Math.round((offplan / totalTx) * 1000) / 10 : null,
    hottest,
  };
}
