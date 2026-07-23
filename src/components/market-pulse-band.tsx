import { getAreaStats } from "@/lib/dld-area-stats";
import { getMarketPulse } from "@/lib/dld-recent-sales";
import { getDictionary, interpolate } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * Build-time market stats strip (PF "Market Pulse" pattern, our data): total
 * DLD transactions, the hottest DLD community by volume, and the off-plan
 * share — all three drawn from the SAME latest fully-covered DLD month, so the
 * strip reads as one coherent market snapshot. Server component, zero client
 * JS; stats resolve at build/ISR time, never per-request.
 *
 * Deliberately NOT a "new launches this month" tile: the only catalog field
 * for that (`salesStartDate`) is present on ~22% of projects, so a monthly
 * count off it understates reality by an unknowable margin (it read "1" while
 * the catalog held 1,746 projects). `firstSeenAt` is no substitute either —
 * every row carries the same seed month. No honest source, so no tile.
 */
export async function MarketPulseBand({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.marketPulse;
  const pulse = getMarketPulse();
  if (!pulse.latestMonth) return null;

  // Resolve the hottest area's display label through the stats store (it
  // carries the most-common human label for the cadastral key).
  const hottestLabel = pulse.hottest
    ? (getAreaStats(pulse.hottest.areaKey)?.areaLabel ?? pulse.hottest.areaKey)
    : null;

  const tiles = [
    pulse.totalTx > 0
      ? {
          value: pulse.totalTx.toLocaleString(),
          label: t.totalTx,
          hint: interpolate(t.totalTxHint, { month: pulse.latestMonth }),
        }
      : null,
    hottestLabel && pulse.hottest
      ? {
          value: hottestLabel,
          label: t.hottestCommunity,
          hint:
            pulse.hottest.momPct != null
              ? interpolate(t.hottestHintMom, {
                  n: pulse.hottest.n.toLocaleString(),
                  mom: `${pulse.hottest.momPct > 0 ? "+" : ""}${pulse.hottest.momPct}`,
                })
              : interpolate(t.hottestHint, { n: pulse.hottest.n.toLocaleString() }),
        }
      : null,
    pulse.offplanSharePct != null
      ? {
          value: `${pulse.offplanSharePct}%`,
          label: t.offplanShare,
          hint: interpolate(t.offplanShareHint, { month: pulse.latestMonth }),
        }
      : null,
  ].filter(Boolean) as Array<{ value: string; label: string; hint: string }>;

  if (tiles.length === 0) return null;

  return (
    <section aria-label={t.aria} className="border-y border-border bg-surface-alt">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-6 sm:grid-cols-3 md:px-8">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <p className="font-display text-2xl font-semibold text-brand">{tile.value}</p>
            <p className="mt-0.5 text-sm font-semibold text-text-dark">{tile.label}</p>
            <p className="mt-0.5 text-xs text-muted">{tile.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
