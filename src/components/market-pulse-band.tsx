import { getCatalogApi } from "@/lib/catalog";
import { getAreaStats } from "@/lib/dld-area-stats";
import { getMarketPulse } from "@/lib/dld-recent-sales";
import { getDictionary, interpolate } from "@/i18n";
import type { Locale } from "@/i18n/config";

/**
 * Build-time market stats strip (PF "Market Pulse" pattern, our data):
 * new catalog launches this month, hottest DLD community by volume, and the
 * off-plan share of transactions. Server component, zero client JS — all
 * three stats resolve at build/ISR time, never per-request.
 */
export async function MarketPulseBand({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.marketPulse;
  const pulse = getMarketPulse();
  if (!pulse.latestMonth) return null;

  const api = await getCatalogApi();
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const newLaunches = api.projects.filter((p) => {
    const s = (p as { salesStartDate?: string | null }).salesStartDate;
    return typeof s === "string" && s.startsWith(monthPrefix);
  }).length;

  // Resolve the hottest area's display label through the stats store (it
  // carries the most-common human label for the cadastral key).
  const hottestLabel = pulse.hottest
    ? (getAreaStats(pulse.hottest.areaKey)?.areaLabel ?? pulse.hottest.areaKey)
    : null;

  const tiles = [
    newLaunches > 0
      ? {
          value: String(newLaunches),
          label: t.newLaunches,
          hint: t.newLaunchesHint,
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
