import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { HomeYields } from "@/components/home-yields";
import { PrimaryButton } from "@/components/ui/primary-button";
import { CompareUnitsLegacyRedirect } from "@/components/compare-units-legacy-redirect";
import { getTopCoveredAreas, getComparisonList } from "@/lib/area-compare";
import { getHubProjectPairs } from "@/lib/project-compare";
import { getHubDeveloperPairs } from "@/lib/developer-compare";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

/** ISR — hub must not be per-request dynamic (Worker CPU → CF 1102 / 503). */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare Dubai Communities & Off-Plan Projects",
  description:
    "Side-by-side comparisons on real Dubai Land Department 2025 data — sold prices, price per sqft, gross rental yields — across communities and off-plan projects.",
  alternates: enMeta("/compare"),
  openGraph: {
    title: "Compare Dubai Communities & Off-Plan Projects",
    description:
      "Side-by-side comparisons on real Dubai Land Department 2025 data — sold prices, price per sqft, gross rental yields.",
    url: "/compare",
    images: [{ url: "/brand/icon-red.png", width: 512, height: 512, alt: "invest off-plan" }],
  },
};

export async function CompareHubPageContent({
  locale = "en",
}: {
  locale?: Locale;
}) {
  const dict = getDictionary(locale);
  const t = dict.pages.compare;

  // Slim parallel load: DLD hub lists + 6 named project/dev pairs each.
  // Do NOT call getCatalogApi + getComparable*Slugs + getDevelopers separately
  // (that re-scanned the full catalog on every dynamic request → CF 1102).
  const [topYields, comparisons, projectPairs, developerPairs] = await Promise.all([
    getTopCoveredAreas("yield", 6),
    getComparisonList(8),
    getHubProjectPairs(6),
    getHubDeveloperPairs(6),
  ]);

  return (
    <PageShell headerVariant="transparent">
      <CompareUnitsLegacyRedirect />
      <PageHero
        title={t.heroTitle}
        italicTitle
        subtitle={t.heroSubtitle}
      />

      <HomeYields areas={topYields} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <p className="section-eyebrow">{t.decideWithData}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark md:text-3xl">
            {t.hubHeading}<span className="text-brand">.</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {t.hubSubtitle}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((c) => (
              <Link
                key={c.pairSlug}
                href={localePath(locale, `/compare/${c.pairSlug}`)}
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

      {projectPairs.length > 0 ? (
        <section className="border-t border-border bg-surface-alt py-14">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
              Compare projects<span className="text-brand">.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Head-to-head on price, handover, payment plans, and unit mix.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projectPairs.map((p) => (
                <Link
                  key={p.pairSlug}
                  href={localePath(locale, `/compare-projects/${p.pairSlug}`)}
                  className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-4 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
                >
                  <p className="text-sm font-semibold text-text-dark group-hover:text-brand">
                    {p.a} <span className="text-muted-light">vs</span> {p.b}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {developerPairs.length > 0 ? (
        <section className="py-14">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
              Compare developers<span className="text-brand">.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Portfolio size, entry prices, communities covered, and handover pipelines.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {developerPairs.map((p) => (
                <Link
                  key={p.pairSlug}
                  href={localePath(locale, `/compare-developers/${p.pairSlug}`)}
                  className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-4 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
                >
                  <p className="text-sm font-semibold text-text-dark group-hover:text-brand">
                    {p.a} <span className="text-muted-light">vs</span> {p.b}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Compare units<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            Pick up to three unit types from any projects and line them up — price, size,
            handover, and payment plans.
          </p>
          <PrimaryButton href={localePath(locale, "/compare/units")} className="mt-6">
            Open the unit comparator
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}

export default async function CompareHubPage() {
  return <CompareHubPageContent />;
}
