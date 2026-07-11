import type { FlatUnit } from "./catalog-core";
import { handoverMonths, unitPricePerSqft } from "./investment-metrics";
import { monthlyPayment } from "./mortgage";

/**
 * Pruned, client-safe slice of the DLD area stats. The full store is a
 * server-only JSON import (`@/lib/dld-area-stats`) — never import that module
 * into client code; the server page resolves stats and passes this shape down.
 */
export interface CompareAreaStats {
  grossYieldPct: number | null;
  medianPpsqft: number | null;
  appreciationPct: number | null;
}

/** Keyed by project id — compare slots from the same project share stats. */
export type CompareStatsMap = Record<string, CompareAreaStats>;

/** Fixed mortgage scenario used on the compare table. */
export const COMPARE_MORTGAGE = {
  downPaymentPct: 20,
  annualRatePct: 4.25,
  termYears: 25,
} as const;

export function compareUnitKey(item: FlatUnit): string {
  return `${item.project.id}:${item.unit.id}`;
}

/**
 * Estimated monthly mortgage payment (AED) for a unit at the compare-table
 * scenario (20% down / 4.25% / 25y). Null when the unit has no price.
 */
export function compareMonthlyPaymentAed(item: FlatUnit): number | null {
  const price = item.unit.launchPriceAed;
  if (!price || price <= 0) return null;
  const loan = price * (1 - COMPARE_MORTGAGE.downPaymentPct / 100);
  return monthlyPayment(
    loan,
    COMPARE_MORTGAGE.annualRatePct,
    COMPARE_MORTGAGE.termYears,
  );
}

export interface CompareWinners {
  /** Lowest starting price. */
  lowestPrice: string | null;
  /** Lowest AED/sqft. */
  lowestPpsqft: string | null;
  /** Largest square footage (sqftMin). */
  highestSqft: string | null;
  /** Highest community gross yield. */
  highestYield: string | null;
  /** Lowest estimated monthly mortgage payment. */
  lowestMonthly: string | null;
  /** Earliest handover. */
  earliestHandover: string | null;
}

/**
 * Strict winner among comparable values: needs at least two non-null values
 * and a unique extreme — ties produce no winner.
 */
export function pickWinner(
  entries: Array<{ key: string; value: number | null }>,
  better: "higher" | "lower",
): string | null {
  const valued = entries.filter(
    (e): e is { key: string; value: number } => e.value != null,
  );
  if (valued.length < 2) return null;
  const best =
    better === "higher"
      ? Math.max(...valued.map((e) => e.value))
      : Math.min(...valued.map((e) => e.value));
  const winners = valued.filter((e) => e.value === best);
  return winners.length === 1 ? winners[0].key : null;
}

/** Winner unit keys (`projectId:unitId`) per compare metric. */
export function computeCompareWinners(
  items: FlatUnit[],
  stats: CompareStatsMap,
): CompareWinners {
  const entry = (item: FlatUnit, value: number | null) => ({
    key: compareUnitKey(item),
    value,
  });
  return {
    lowestPrice: pickWinner(
      items.map((i) => entry(i, i.unit.launchPriceAed > 0 ? i.unit.launchPriceAed : null)),
      "lower",
    ),
    lowestPpsqft: pickWinner(
      items.map((i) => entry(i, unitPricePerSqft(i))),
      "lower",
    ),
    highestSqft: pickWinner(
      items.map((i) => entry(i, i.unit.sqftMin > 0 ? i.unit.sqftMin : null)),
      "higher",
    ),
    highestYield: pickWinner(
      items.map((i) => entry(i, stats[i.project.id]?.grossYieldPct ?? null)),
      "higher",
    ),
    lowestMonthly: pickWinner(
      items.map((i) => entry(i, compareMonthlyPaymentAed(i))),
      "lower",
    ),
    earliestHandover: pickWinner(
      items.map((i) => entry(i, handoverMonths(i.project.handover))),
      "lower",
    ),
  };
}
