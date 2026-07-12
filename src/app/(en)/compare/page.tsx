import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { HomeYields } from "@/components/home-yields";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getTopCoveredAreas, getComparisonList } from "@/lib/area-compare";
import { getComparableProjectSlugs } from "@/lib/project-compare";
import { getComparableDeveloperSlugs } from "@/lib/developer-compare";
import { getCatalogApi, getDevelopers } from "@/lib/catalog";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Compare Dubai Communities & Off-Plan Projects",
  description:
    "Side-by-side comparisons on real Dubai Land Department 2025 data — sold prices, price per sqft, gross rental yields — across communities and off-plan projects.",
  alternates: enMeta("/compare"),
};

interface PageProps {
  searchParams: Promise<{ units?: string }>;
}

export async function CompareHubPageContent({
  locale = "en",
  searchParams,
}: {
  locale?: Locale;
  searchParams?: Promise<{ units?: string }>;
}) {
  const dict = getDictionary(locale);
  const t = dict.pages.compare;

  // Legacy deep links: /compare?units=a,b,c was the unit-compare tool.
  const { units } = (await searchParams) ?? {};
  if (units) redirect(`/compare/units?units=${encodeURIComponent(units)}`);

  const [topYields, comparisons, projectPairSlugs, developerPairSlugs, developers, api] =
    await Promise.all([
      getTopCoveredAreas("yield", 6),
      getComparisonList(),
      getComparableProjectSlugs(),
      getComparableDeveloperSlugs(),
      getDevelopers(),
      getCatalogApi(),
    ]);

  const devNameBySlug = new Map(developers.map((d) => [d.slug, d.name]));
  const developerPairs = developerPairSlugs
    .slice(0, 6)
    .map((pairSlug) => {
      const idx = pairSlug.indexOf("-vs-");
      const a = devNameBySlug.get(pairSlug.slice(0, idx));
      const b = devNameBySlug.get(pairSlug.slice(idx + 4));
      return a && b ? { pairSlug, a, b } : null;
    })
    .filter((x): x is { pairSlug: string; a: string; b: string } => x != null);

  const nameBySlug = new Map(api.projects.map((p) => [p.slug, p.name]));
  const projectPairs = projectPairSlugs
    .slice(0, 6)
    .map((pairSlug) => {
      const idx = pairSlug.indexOf("-vs-");
      const a = nameBySlug.get(pairSlug.slice(0, idx));
      const b = nameBySlug.get(pairSlug.slice(idx + 4));
      return a && b ? { pairSlug, a, b } : null;
    })
    .filter((x): x is { pairSlug: string; a: string; b: string } => x != null);

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        italicTitle
        subtitle={t.heroSubtitle}
      />

      <HomeYields areas={topYields} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <p className="section-eyebrow">Decide with data</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark md:text-3xl">
            Compare communities<span className="text-brand">.</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Side-by-side on real 2025 sold prices, price per sqft, and gross rental yields.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  href={`/compare-projects/${p.pairSlug}`}
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
                  href={`/compare-developers/${p.pairSlug}`}
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
          <PrimaryButton href="/compare/units" className="mt-6">
            Open the unit comparator
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}

export default async function CompareHubPage({ searchParams }: PageProps) {
  return <CompareHubPageContent searchParams={searchParams} />;
}
