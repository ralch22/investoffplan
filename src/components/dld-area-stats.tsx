import type { DldAreaStats } from "@/lib/dld-area-stats";
import type { OffplanVsReadySpread } from "@/lib/dld-recent-sales";
import { dldConfidenceLabel, formatPrice } from "@/lib/format";
import { TrendChart } from "@/components/trend-chart";
import { getDictionary, interpolate } from "@/i18n";
import type { Locale } from "@/i18n/config";

interface Props {
  stats: DldAreaStats;
  areaName: string;
  source: string;
  spread?: OffplanVsReadySpread | null;
  locale?: Locale;
}

const MONTH_ABBR = ["", "J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * Anonymized DLD market-data band for an area page — real sold prices, AED/sqft,
 * transaction volume, gross rental yield, and a price-per-sqft trend. Aggregates
 * only (Dubai Land Department open data); no purchase-level or owner data.
 */
export function DldAreaStatsBand({ stats, areaName, source, spread, locale = "en" }: Props) {
  const dict = getDictionary(locale);
  const dld = dict.dld;

  const tiles = [
    stats.medianPrice != null
      ? { label: dld.medianSoldPrice, value: formatPrice(Math.round(stats.medianPrice), "AED"), hint: dld.hint2025Transactions }
      : null,
    stats.medianPpsqft != null
      ? { label: dld.medianSoldPsf, value: `AED ${stats.medianPpsqft.toLocaleString()}`, hint: dld.hintActualSales }
      : null,
    { label: dld.salesRecorded, value: stats.saleSample.toLocaleString(), hint: dld.hintTransactionVolume },
    stats.grossYieldPct != null
      ? { label: dld.grossRentalYield, value: `${stats.grossYieldPct}%`, hint: dld.hintGrossYield }
      : stats.appreciationPct != null
        ? {
            label: dld.priceTrend,
            value: `${stats.appreciationPct > 0 ? "+" : ""}${stats.appreciationPct}%`,
            hint: dld.hintPriceTrend,
          }
        : null,
  ].filter((t): t is { label: string; value: string; hint: string } => t !== null);

  const trend = stats.monthlyTrend.filter((t) => t.n >= 2);
  const trendMax = trend.length ? Math.max(...trend.map((t) => t.medianPpsqft)) : 0;
  const trendMin = trend.length ? Math.min(...trend.map((t) => t.medianPpsqft)) : 0;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold text-text-dark">
          {dld.marketDataHeading}<span className="text-brand">.</span>
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-light">
          {interpolate(dld.confidenceLine, {
            confidence: dldConfidenceLabel(stats.confidence, dict),
            source,
          })}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        {interpolate(dld.marketDataBody, { areaName })}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {spread ? (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border bg-white px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {dld.offplanVsReadyHeading}
          </p>
          <p className="text-sm text-muted">
            {interpolate(dld.offplanVsReadyLine, {
              op: spread.offplanPpsqft.toLocaleString(),
              rd: spread.readyPpsqft.toLocaleString(),
              n: (spread.nOffplan + spread.nReady).toLocaleString(),
            })}
          </p>
          <p className={`text-sm font-semibold ${spread.spreadPct >= 0 ? "text-brand" : "text-muted"}`}>
            {spread.spreadPct >= 0
              ? interpolate(dld.offplanVsReadyPremium, { pct: Math.abs(spread.spreadPct).toFixed(1) })
              : interpolate(dld.offplanVsReadyDiscount, { pct: Math.abs(spread.spreadPct).toFixed(1) })}
          </p>
          {/* Methodology caveat (Wave-1 mandate, first rendered Wave-2): this
              spread is an area-level cohort estimate — saying so wherever the
              number appears is what keeps it honest. Wording holds for both
              today's area-proxy data and future per-project cohort data. */}
          <p className="w-full text-xs leading-relaxed text-muted-light">
            {dld.offplanVsReadyCaveat}
          </p>
        </div>
      ) : null}

      {stats.beds && Object.keys(stats.beds).length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {dld.bedTableHeading}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-start text-xs text-muted-light">
                  <th className="px-3 py-1.5 text-start font-medium">{dld.typeCol}</th>
                  <th className="px-3 py-1.5 text-end font-medium">{dld.medianPriceCol}</th>
                  <th className="px-3 py-1.5 text-end font-medium">{dld.aedSqftCol}</th>
                  <th className="px-3 py-1.5 text-end font-medium">{dld.salesCol}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.beds)
                  .sort(([x], [y]) => Number(x) - Number(y))
                  .map(([k, v]) => {
                    const label = k === "0" ? dld.studio : k === "4" ? dld.fourPlusBed : interpolate(dld.bedLabel, { k });
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
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {dld.monthlyTrendHeading}
            </p>
            <p className="text-[11px] tabular-nums text-muted-light">
              AED {trendMin.toLocaleString()} – {trendMax.toLocaleString()}
            </p>
          </div>
          <TrendChart
            className="mt-3"
            height={128}
            ariaLabel={interpolate(dld.trendChartAria, { area: areaName })}
            points={trend.map((t) => ({
              label: MONTH_ABBR[Number(t.month.slice(5, 7))] ?? "",
              value: t.medianPpsqft,
              title: interpolate(dld.trendPointTitle, {
                month: t.month,
                ppsf: t.medianPpsqft.toLocaleString(),
                sales: String(t.n),
              }),
            }))}
          />
        </div>
      ) : null}
    </section>
  );
}
