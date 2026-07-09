import type { DldAreaStats } from "@/lib/dld-area-stats";
import { formatPrice } from "@/lib/format";

interface Props {
  stats: DldAreaStats;
  areaName: string;
  source: string;
}

const MONTH_ABBR = ["", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * Anonymized DLD market-data band for an area page — real sold prices, AED/sqft,
 * transaction volume, gross rental yield, and a price-per-sqft trend. Aggregates
 * only (Dubai Land Department open data); no purchase-level or owner data.
 */
export function DldAreaStatsBand({ stats, areaName, source }: Props) {
  const tiles = [
    stats.medianPrice != null
      ? { label: "Median sold price", value: formatPrice(Math.round(stats.medianPrice), "AED"), hint: "2025 transactions" }
      : null,
    stats.medianPpsqft != null
      ? { label: "Median sold AED/sqft", value: `AED ${stats.medianPpsqft.toLocaleString()}`, hint: "Actual sales, not launch" }
      : null,
    { label: "Sales recorded (2025)", value: stats.saleSample.toLocaleString(), hint: "Transaction volume" },
    stats.grossYieldPct != null
      ? { label: "Gross rental yield", value: `${stats.grossYieldPct}%`, hint: "Median rent ÷ median price" }
      : stats.appreciationPct != null
        ? {
            label: "Price trend (2025)",
            value: `${stats.appreciationPct > 0 ? "+" : ""}${stats.appreciationPct}%`,
            hint: "AED/sqft, start→latest",
          }
        : null,
  ].filter((t): t is { label: string; value: string; hint: string } => t !== null);

  const trend = stats.monthlyTrend.filter((t) => t.n >= 2);
  const trendMax = trend.length ? Math.max(...trend.map((t) => t.medianPpsqft)) : 0;
  const trendMin = trend.length ? Math.min(...trend.map((t) => t.medianPpsqft)) : 0;
  const span = Math.max(1, trendMax - trendMin);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold text-text-dark">
          Market data<span className="text-brand">.</span>
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-light">
          {stats.confidence} confidence · {source}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        What {areaName} actually sold for in 2025 — from official Dubai Land Department records.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-border bg-white p-5 shadow-elevation-sm">
            <p className="font-display text-2xl font-semibold tabular-nums text-brand md:text-3xl">
              {tile.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-dark">{tile.label}</p>
            <p className="mt-0.5 text-xs text-muted-light">{tile.hint}</p>
          </div>
        ))}
      </div>

      {stats.beds && Object.keys(stats.beds).length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Median sold price by bedroom
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-start text-xs text-muted-light">
                  <th className="px-3 py-1.5 text-start font-medium">Type</th>
                  <th className="px-3 py-1.5 text-end font-medium">Median price</th>
                  <th className="px-3 py-1.5 text-end font-medium">AED/sqft</th>
                  <th className="px-3 py-1.5 text-end font-medium">Sales</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.beds)
                  .sort(([x], [y]) => Number(x) - Number(y))
                  .map(([k, v]) => {
                    const label = k === "0" ? "Studio" : k === "4" ? "4+ bed" : `${k} bed`;
                    return (
                      <tr key={k} className="border-t border-border">
                        <td className="px-3 py-2 font-semibold text-text-dark">{label}</td>
                        <td className="px-3 py-2 text-end tabular-nums text-text-dark">
                          {v.medianPrice != null ? formatPrice(Math.round(v.medianPrice), "AED") : "—"}
                        </td>
                        <td className="px-3 py-2 text-end tabular-nums text-muted">
                          {v.medianPpsqft != null ? `AED ${v.medianPpsqft.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-end tabular-nums text-muted-light">
                          {v.n.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {trend.length >= 3 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Median AED/sqft by month
          </p>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {trend.map((t) => {
              const pct = 15 + ((t.medianPpsqft - trendMin) / span) * 85;
              const month = Number(t.month.slice(5, 7));
              return (
                <div key={t.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-brand/70"
                    style={{ height: `${pct}%` }}
                    title={`${t.month}: AED ${t.medianPpsqft.toLocaleString()}/sqft`}
                  />
                  <span className="text-[10px] text-muted-light">{MONTH_ABBR[month] ?? ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
