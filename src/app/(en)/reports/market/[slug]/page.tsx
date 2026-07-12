import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportExportButton } from "@/components/report-export-button";
import { TrendChart } from "@/components/trend-chart";
import {
  getCommunities,
  getCommunity,
  getProjectsByCommunity,
} from "@/lib/communities";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import { bedKeyLabel, formatPrice } from "@/lib/format";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}

const TOP_REPORT_COUNT = 30;
const TOP_PROJECTS_IN_REPORT = 10;

/**
 * Printable, gated-export community market report. VERIFIED DATA ONLY:
 * every market figure comes from the anonymized DLD aggregate store
 * (src/lib/dld-area-stats.ts) and project facts from the catalog — no
 * invented numbers. The page HTML is fully static and identical for every
 * visitor; only the "Export PDF" ACTION is sign-in-gated (no cloaking).
 */
export async function generateStaticParams() {
  // Pre-build the top 30 covered communities by transaction volume; the rest
  // of the covered set still renders on demand (dynamicParams default).
  const communities = await getCommunities();
  return communities
    .map((c) => ({ slug: c.slug, stats: getAreaStats(c.name) }))
    .filter((x): x is { slug: string; stats: NonNullable<ReturnType<typeof getAreaStats>> } =>
      Boolean(x.stats),
    )
    .sort((a, b) => b.stats.saleSample - a.stats.saleSample)
    .slice(0, TOP_REPORT_COUNT)
    .map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return { title: "Report not found" };
  return {
    title: interpolate(getDictionary("en").reports.reportTitle, { name: community.name }),
    // Utility/print surface duplicating community-page data — keep out of the index.
    robots: { index: false, follow: false },
  };
}

export default async function MarketReportPage({
  params,
  locale = "en",
}: PageProps) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const stats = getAreaStats(community.name);
  if (!stats) notFound();

  const { source, sourcePeriod } = getDldSource();
  const projects = await getProjectsByCommunity(slug);
  const topProjects = projects.slice(0, TOP_PROJECTS_IN_REPORT).map((p) => {
    const prices = p.units
      .map((u) => u.launchPriceAed)
      .filter((v) => v > 0);
    return {
      slug: p.slug,
      name: p.name,
      developer: p.developer,
      handover: p.handover,
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  });

  const trend = stats.monthlyTrend;
  const dict = getDictionary(locale);
  const s = dict.reports;

  const summaryTiles = [
    stats.medianPrice != null
      ? { label: s.medianPrice, value: formatPrice(Math.round(stats.medianPrice), "AED") }
      : null,
    stats.medianPpsqft != null
      ? { label: s.medianPpsqft, value: `AED ${stats.medianPpsqft.toLocaleString()}` }
      : null,
    { label: s.salesRecorded, value: stats.saleSample.toLocaleString() },
    stats.grossYieldPct != null
      ? { label: s.grossYield, value: `${stats.grossYieldPct}%` }
      : stats.appreciationPct != null
        ? {
            label: s.priceTrendLabel,
            value: `${stats.appreciationPct > 0 ? "+" : ""}${stats.appreciationPct}%`,
          }
        : null,
  ].filter((t): t is { label: string; value: string } => t !== null);

  return (
    <main className="mx-auto max-w-[860px] px-6 py-10 text-text-dark">
      {/* On-screen chrome — hidden when printing */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={localePath(locale, `/communities/${slug}`)}
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          ← {interpolate(s.backToCommunity, { name: community.name })}
        </Link>
        <ReportExportButton />
      </div>

      {/* Report header */}
      <header className="report-section border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {s.preparedBy}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
          {interpolate(s.reportTitle, { name: community.name })}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {community.cityLabel} · {s.dataPeriod}: {sourcePeriod} · {stats.confidence}{" "}
          {s.confidenceLabel} · {source}
        </p>
      </header>

      {/* Market summary */}
      <section className="report-section mt-8">
        <h2 className="font-display text-xl font-semibold">{s.summaryTitle}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryTiles.map((tile) => (
            <div key={tile.label} className="rounded-2xl border border-border p-4">
              <p className="font-display text-xl font-semibold tabular-nums text-brand">
                {tile.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">{tile.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trend */}
      {trend.length >= 3 ? (
        <section className="report-section mt-8">
          <h2 className="font-display text-xl font-semibold">{s.trendTitle}</h2>
          <TrendChart
            className="mt-4"
            height={140}
            ariaLabel={`${s.trendTitle} — ${community.name} (${sourcePeriod})`}
            points={trend.map((t) => ({
              label: t.month.slice(5, 7),
              value: t.medianPpsqft,
              title: `${t.month}: AED ${t.medianPpsqft.toLocaleString()}/sqft · ${t.n} ${s.salesCol}`,
            }))}
          />
        </section>
      ) : null}

      {/* Per-bed table */}
      {stats.beds && Object.keys(stats.beds).length > 0 ? (
        <section className="report-section mt-8">
          <h2 className="font-display text-xl font-semibold">{s.bedTitle}</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-light">
                <th className="px-3 py-1.5 text-start font-medium">{s.typeCol}</th>
                <th className="px-3 py-1.5 text-end font-medium">{s.priceCol}</th>
                <th className="px-3 py-1.5 text-end font-medium">{s.ppsqftCol}</th>
                <th className="px-3 py-1.5 text-end font-medium">{s.salesCol}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.beds)
                .sort(([x], [y]) => Number(x) - Number(y))
                .map(([k, v]) => {
                  const label = bedKeyLabel(k, dict);
                  return (
                    <tr key={k} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold">{label}</td>
                      <td className="px-3 py-2 text-end tabular-nums">
                        {v.medianPrice != null
                          ? formatPrice(Math.round(v.medianPrice), "AED")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-muted">
                        {v.medianPpsqft != null
                          ? `AED ${v.medianPpsqft.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-end tabular-nums text-muted-light">
                        {v.n.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Top off-plan projects (catalog) */}
      {topProjects.length > 0 ? (
        <section className="report-section mt-8">
          <h2 className="font-display text-xl font-semibold">
            {interpolate(s.topProjects, { name: community.name })}
          </h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-light">
                <th className="px-3 py-1.5 text-start font-medium">{s.projectCol}</th>
                <th className="px-3 py-1.5 text-start font-medium">{s.developerCol}</th>
                <th className="px-3 py-1.5 text-start font-medium">{s.handoverCol}</th>
                <th className="px-3 py-1.5 text-end font-medium">{s.fromPriceCol}</th>
              </tr>
            </thead>
            <tbody>
              {topProjects.map((p) => (
                <tr key={p.slug} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{p.name}</td>
                  <td className="px-3 py-2 text-muted">{p.developer}</td>
                  <td className="px-3 py-2 text-muted">{p.handover ?? "—"}</td>
                  <td className="px-3 py-2 text-end tabular-nums">
                    {p.minPrice != null ? formatPrice(p.minPrice, "AED") : s.onRequest}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Methodology + disclaimer */}
      <section className="report-section mt-10 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
          {s.methodologyTitle}
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {interpolate(s.methodologyBody, { source, period: sourcePeriod })}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-light">{s.disclaimer}</p>
      </section>
    </main>
  );
}
