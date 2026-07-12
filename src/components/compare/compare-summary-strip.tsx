import type { FlatUnit } from "@/lib/catalog-browser";
import type { CurrencyCode } from "@/lib/types";
import {
  compareUnitKey,
  computeCompareWinners,
  type CompareStatsMap,
} from "@/lib/compare-stats";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import { formatPrice } from "@/lib/format";

interface StripLabels {
  bestValue: string;
  highestYield: string;
  earliestHandover: string;
  lowestEntry: string;
  /** Template with {value} — e.g. "{value}% gross" / "{value}% إجمالي" */
  grossPct?: string;
  /** Suffix after AED amount for best-value chip — EN "/sqft", AR "/قدم مربعة" */
  perSqftSuffix?: string;
}

interface Chip {
  label: string;
  projectName: string;
  value: string;
}

/**
 * At-a-glance winner chips above the compare table. Only renders chips whose
 * metric has a strict winner; renders nothing when no chip qualifies.
 */
const DEFAULT_LABELS: StripLabels = {
  bestValue: "Best value",
  highestYield: "Highest yield",
  earliestHandover: "Earliest handover",
  lowestEntry: "Lowest entry",
};

export function CompareSummaryStrip({
  items,
  stats,
  currency,
  labels = DEFAULT_LABELS,
}: {
  items: FlatUnit[];
  stats: CompareStatsMap;
  currency: CurrencyCode;
  labels?: StripLabels;
}) {
  if (items.length < 2) return null;
  const winners = computeCompareWinners(items, stats);
  const byKey = new Map(items.map((i) => [compareUnitKey(i), i]));

  const chips: Chip[] = [];
  const push = (
    key: string | null,
    label: string,
    value: (item: FlatUnit) => string | null,
  ) => {
    const item = key ? byKey.get(key) : undefined;
    if (!item) return;
    const v = value(item);
    if (v == null) return;
    chips.push({ label, projectName: item.project.name, value: v });
  };

  push(winners.lowestPpsqft, labels.bestValue, (i) => {
    const v = unitPricePerSqft(i);
    if (!v) return null;
    const suffix = labels.perSqftSuffix ?? "/sqft";
    return `AED ${v.toLocaleString()}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  });
  push(winners.highestYield, labels.highestYield, (i) => {
    const y = stats[i.project.id]?.grossYieldPct;
    if (y == null) return null;
    return labels.grossPct
      ? labels.grossPct.replace("{value}", String(y))
      : `${y}%`;
  });
  push(winners.earliestHandover, labels.earliestHandover, (i) =>
    i.project.handover ?? null,
  );
  push(winners.lowestPrice, labels.lowestEntry, (i) =>
    formatPrice(i.unit.launchPriceAed, currency, { compact: true }),
  );

  if (chips.length === 0) return null;

  return (
    <div
      data-testid="compare-summary-strip"
      className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-xl border border-border bg-white p-3 shadow-elevation-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {chip.label} <span className="text-brand">▲</span>
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-text-dark">
            {chip.projectName}
          </p>
          <p className="text-xs tabular-nums text-muted">{chip.value}</p>
        </div>
      ))}
    </div>
  );
}
