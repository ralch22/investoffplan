import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { FaqAccordion } from "@/components/faq-accordion";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import {
  buildComparisonFaqs,
  buildPros,
  buildSuitability,
  getComparisonExtras,
  getRelatedComparisons,
} from "@/lib/compare-content";
import { formatPrice } from "@/lib/format";
import { enMeta } from "@/lib/ar-meta";
import { comparePairTitle } from "@/lib/seo-title";
import {
  buildAreaComparison,
  getComparablePairSlugs,
  type AreaComparison,
} from "@/lib/area-compare";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ pair: string }>;
  locale?: Locale;
}

// Canonical A-vs-B pairs are SSG'd. Reverse B-vs-A is allowed at request time
// (dynamicParams) and permanentRedirect'd to the alphabetical slug — baking
// reverse into generateStaticParams left next start serving soft-200s (CI #244).
export const dynamicParams = true;

export async function generateStaticParams() {
  const pairs = await getComparablePairSlugs();
  return pairs.map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildAreaComparison(pair);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!cmp) notFound();
  const a = cmp.a.area.name;
  const b = cmp.b.area.name;
  const yA = cmp.a.stats?.grossYieldPct;
  const yB = cmp.b.stats?.grossYieldPct;
  const yieldBit = yA && yB ? ` Gross yields ${yA}% vs ${yB}%.` : "";
  return {
    // Plain title + layout brand suffix; avoid double " | invest off-plan".
    title: comparePairTitle(a, b, "areas"),
    description:
      `Compare ${a} and ${b} for off-plan investment — real Dubai Land Department sold prices, price per sqft, gross rental yield, and available projects.${yieldBit}`.slice(
        0,
        158,
      ),
    alternates: enMeta(`/compare/${cmp.pairSlug}`),
  };
}

type Better = "higher" | "lower" | "none";

function Row({
  label,
  hint,
  aVal,
  bVal,
  aNum,
  bNum,
  better,
}: {
  label: string;
  hint?: string;
  aVal: string;
  bVal: string;
  aNum: number | null;
  bNum: number | null;
  better: Better;
}) {
  let aWins = false;
  let bWins = false;
  if (better !== "none" && aNum != null && bNum != null && aNum !== bNum) {
    const aBetter = better === "higher" ? aNum > bNum : aNum < bNum;
    aWins = aBetter;
    bWins = !aBetter;
  }
  const cell = (val: string, wins: boolean) => (
    <td
      className={`px-4 py-3 text-center text-sm tabular-nums ${
        wins ? "font-bold text-brand" : "font-medium text-text-dark"
      }`}
    >
      {val}
      {wins ? <span className="ms-1 text-xs">▲</span> : null}
    </td>
  );
  return (
    <tr className="border-t border-border">
      <th scope="row" className="px-4 py-3 text-start">
        <span className="text-sm font-semibold text-text-dark">{label}</span>
        {hint ? <span className="block text-xs text-muted-light">{hint}</span> : null}
      </th>
      {cell(aVal, aWins)}
      {cell(bVal, bWins)}
    </tr>
  );
}

function verdict(cmp: AreaComparison, dict: ReturnType<typeof getDictionary>): string {
  const { a, b } = cmp;
  const parts: string[] = [];
  if (a.stats?.grossYieldPct != null && b.stats?.grossYieldPct != null) {
    const hi = a.stats.grossYieldPct >= b.stats.grossYieldPct ? a : b;
    parts.push(interpolate(dict.pages.compare.verdictLeadsYield, { name: hi.area.name, value: hi.stats!.grossYieldPct ?? 0 }));
  }
  const cheaper = a.area.minPriceAed > 0 && b.area.minPriceAed > 0
    ? a.area.minPriceAed <= b.area.minPriceAed ? a : b
    : null;
  if (cheaper) parts.push(interpolate(dict.pages.compare.verdictLowerPrice, { name: cheaper.area.name, price: formatPrice(cheaper.area.minPriceAed, "AED") }));
  const deeper = a.area.projectCount >= b.area.projectCount ? a : b;
  parts.push(interpolate(dict.pages.compare.verdictMoreProjects, { name: deeper.area.name, count: deeper.area.projectCount }));
  return parts.join("; ") + ".";
}

export default async function CompareAreasPage({ params, locale = "en" }: PageProps) {
  const { pair } = await params;
  const cmp = await buildAreaComparison(pair);
  if (!cmp) notFound();
  // Canonical alphabetical pair slug (A-vs-B); reverse deep links 308 here.
  if (pair !== cmp.pairSlug) {
    permanentRedirect(localePath(locale, `/compare/${cmp.pairSlug}`));
  }

  const dict = getDictionary(locale);
  const { a, b } = cmp;
  const [extras, related] = await Promise.all([
    getComparisonExtras(cmp),
    getRelatedComparisons(cmp),
  ]);
  const prosA = buildPros(a, b, extras.a);
  const prosB = buildPros(b, a, extras.b);
  const suitA = buildSuitability(a, b, extras.a);
  const suitB = buildSuitability(b, a, extras.b);
  const faqs = buildComparisonFaqs(cmp);

  const money = (n: number | null | undefined) =>
    n != null && n > 0 ? formatPrice(Math.round(n), "AED") : "—";
  const psf = (n: number | null | undefined) => (n != null ? `AED ${n.toLocaleString()}` : "—");
  const pct = (n: number | null | undefined) => (n != null ? `${n}%` : "—");

  const scorecards = [
    { label: dict.pages.compare.kpiGrossYield, aVal: pct(a.stats?.grossYieldPct), bVal: pct(b.stats?.grossYieldPct) },
    { label: dict.pages.compare.kpiMedianSold, aVal: money(a.stats?.medianPrice), bVal: money(b.stats?.medianPrice) },
    { label: dict.pages.compare.kpiSoldPsf, aVal: psf(a.stats?.medianPpsqft), bVal: psf(b.stats?.medianPpsqft) },
    {
      label: dict.pages.compare.kpi2025Sales,
      aVal: a.stats?.saleSample.toLocaleString() ?? "—",
      bVal: b.stats?.saleSample.toLocaleString() ?? "—",
    },
  ];

  return (
    <PageShell headerVariant="transparent">
      {faqs.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqPageJsonLd(faqs)) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              {
                name: dict.common.home,
                url: `${getSiteUrl()}${localePath(locale, "/")}`,
              },
              {
                name: dict.pages.compare.breadcrumb,
                url: `${getSiteUrl()}${localePath(locale, "/compare")}`,
              },
              { name: `${a.area.name} vs ${b.area.name}` },
            ]),
          ),
        }}
      />
      <PageHero
        title={`${a.area.name} vs ${b.area.name}`}
        italicTitle
        subtitle={dict.pages.compare.heroSubtitleArea}
      />
      <main className="mx-auto max-w-[1000px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: dict.common.home, href: "/" }, { label: dict.pages.compare.breadcrumb, href: "/compare" }, { label: `${a.area.name} vs ${b.area.name}` }]} />
        {/* KPI scorecards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scorecards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
              <div className="mt-2 space-y-1">
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-muted-light">{a.area.name}</span>
                  <span className="font-semibold tabular-nums text-text-dark">{card.aVal}</span>
                </p>
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-muted-light">{b.area.name}</span>
                  <span className="font-semibold tabular-nums text-text-dark">{card.bVal}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {dict.pages.compare.metricHeader}
                </th>
                {[a, b].map((side) => (
                  <th key={side.area.slug} className="px-4 py-4 text-center">
                    <Link
                      href={localePath(locale, `/communities/${side.area.slug}`)}
                      className="font-display text-lg font-semibold text-text-dark hover:text-brand"
                    >
                      {side.area.name}
                    </Link>
                    <span className="block text-xs text-muted-light">{side.area.cityLabel}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label={dict.pages.compare.rowGrossYield} hint={dict.pages.compare.rowGrossYieldHint} better="higher"
                aVal={pct(a.stats?.grossYieldPct)} bVal={pct(b.stats?.grossYieldPct)}
                aNum={a.stats?.grossYieldPct ?? null} bNum={b.stats?.grossYieldPct ?? null} />
              <Row label={dict.pages.compare.rowMedianPsf} hint={dict.pages.compare.rowMedianPsfHint} better="none"
                aVal={psf(a.stats?.medianPpsqft)} bVal={psf(b.stats?.medianPpsqft)}
                aNum={a.stats?.medianPpsqft ?? null} bNum={b.stats?.medianPpsqft ?? null} />
              <Row label={dict.pages.compare.rowMedianPrice} hint={dict.pages.compare.rowMedianPriceHint} better="none"
                aVal={money(a.stats?.medianPrice)} bVal={money(b.stats?.medianPrice)}
                aNum={a.stats?.medianPrice ?? null} bNum={b.stats?.medianPrice ?? null} />
              <Row label={dict.pages.compare.rowPriceTrend} hint={dict.pages.compare.rowPriceTrendHint} better="higher"
                aVal={pct(a.stats?.appreciationPct)} bVal={pct(b.stats?.appreciationPct)}
                aNum={a.stats?.appreciationPct ?? null} bNum={b.stats?.appreciationPct ?? null} />
              <Row label={dict.pages.compare.rowLaunchPrice} hint={dict.pages.compare.rowLaunchPriceHint} better="lower"
                aVal={money(a.area.minPriceAed)} bVal={money(b.area.minPriceAed)}
                aNum={a.area.minPriceAed || null} bNum={b.area.minPriceAed || null} />
              <Row label={dict.pages.compare.rowProjects} better="higher"
                aVal={String(a.area.projectCount)} bVal={String(b.area.projectCount)}
                aNum={a.area.projectCount} bNum={b.area.projectCount} />
              <Row label={dict.pages.compare.rowUnitOptions} better="higher"
                aVal={a.area.unitCount.toLocaleString()} bVal={b.area.unitCount.toLocaleString()}
                aNum={a.area.unitCount} bNum={b.area.unitCount} />
            </tbody>
          </table>
        </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface-alt p-6">
          <h2 className="font-display text-xl font-semibold text-text-dark">
            {dict.pages.compare.verdictHeading}<span className="text-brand">.</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{verdict(cmp, dict)}</p>
          <p className="mt-2 text-xs text-muted-light">
            {dict.pages.compare.verdictDisclaimer}
          </p>
        </div>

        {/* Programmatic pros — the case for each side */}
        {prosA.length > 0 || prosB.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {dict.pages.compare.caseForEachHeading}<span className="text-brand">.</span>
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                { side: a, pros: prosA },
                { side: b, pros: prosB },
              ].map(({ side, pros }) => (
                <div key={side.area.slug} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-text-dark">{side.area.name}</h3>
                  {pros.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {pros.map((pro) => (
                        <li key={pro} className="flex gap-2 text-sm leading-relaxed text-muted">
                          <span className="mt-0.5 shrink-0 text-brand" aria-hidden>✓</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      {interpolate(dict.pages.compare.trailingFallback, {
                        name: side.area.slug === a.area.slug ? b.area.name : a.area.name,
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Who is it for */}
        {suitA.length > 0 || suitB.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {dict.pages.compare.whoSuitsHeading}<span className="text-brand">.</span>
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                { side: a, suits: suitA },
                { side: b, suits: suitB },
              ].map(({ side, suits }) => (
                <div key={side.area.slug} className="rounded-2xl border border-border bg-surface-alt p-6">
                  <h3 className="text-lg font-semibold text-text-dark">{side.area.name}</h3>
                  {suits.length > 0 ? (
                    <dl className="mt-3 space-y-3">
                      {suits.map((s) => (
                        <div key={s.profile}>
                          <dt className="text-sm font-semibold text-brand">{s.profile}</dt>
                          <dd className="mt-0.5 text-sm leading-relaxed text-muted">{s.reason}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      {dict.pages.compare.specialistFallback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {[a, b].map((side) => (
            <Link
              key={side.area.slug}
              href={localePath(
                locale,
                `/projects?q=${encodeURIComponent(side.area.name)}`,
              )}
              className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {interpolate(dict.pages.compare.browseCta, { name: side.area.name })}
            </Link>
          ))}
        </div>

        {/* Data-driven FAQ (FAQPage JSON-LD in <head> of body) */}
        {faqs.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {a.area.name} vs {b.area.name} FAQ
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={faqs} />
            </div>
          </section>
        ) : null}

        <MarketAdviceCta context={`${a.area.name} vs ${b.area.name}`} locale={locale} />

        {/* Related comparisons — internal-linking mesh */}
        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-text-dark">{dict.pages.compare.relatedHeading}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.pairSlug}
                  href={localePath(locale, `/compare/${r.pairSlug}`)}
                  className="iop-btn-press focus-ring rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-muted transition hover:border-brand hover:text-brand"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
