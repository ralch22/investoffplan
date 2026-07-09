import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { HomeYields } from "@/components/home-yields";
import { getTopCoveredAreas, getComparisonList } from "@/lib/area-compare";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Dubai Off-Plan Market Data & Area Comparisons",
  description:
    "Real Dubai Land Department 2025 data — gross rental yields by community, median sold prices, and side-by-side area comparisons for off-plan investors.",
  alternates: { canonical: `${getSiteUrl()}/market-data` },
};

export default async function MarketDataPage() {
  const [topYields, comparisons] = await Promise.all([
    getTopCoveredAreas("yield", 6),
    getComparisonList(),
  ]);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title="Market data"
        italicTitle
        subtitle="Real Dubai Land Department 2025 transactions — yields, sold prices, and area-by-area comparisons. The numbers behind the decision."
      />

      <HomeYields areas={topYields} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <p className="section-eyebrow">Decide with data</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark md:text-3xl">
            Compare areas<span className="text-brand">.</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Side-by-side on real 2025 sold prices, price per sqft, and gross rental yields.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((c) => (
              <Link
                key={c.pairSlug}
                href={`/compare/${c.pairSlug}`}
                className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-4 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
              >
                <p className="text-sm font-semibold text-text-dark group-hover:text-brand">
                  {c.aName} <span className="text-muted-light">vs</span> {c.bName}
                </p>
                {c.aYield != null && c.bYield != null ? (
                  <p className="mt-1 text-xs tabular-nums text-muted">
                    Gross yield {c.aYield}% vs {c.bYield}%
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-xs text-muted-light">
            All figures are anonymized aggregates from Dubai Land Department open data (2025).
            Gross yield = median annual rent ÷ median sold price per community. No purchase-level
            or owner data is used.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
