import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { FaqAccordion } from "@/components/faq-accordion";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import {
  buildDeveloperComparison,
  buildDeveloperFaqs,
  buildDeveloperPros,
  buildDeveloperSuitability,
  getComparableDeveloperSlugs,
  getRelatedDeveloperComparisons,
  type DeveloperComparison,
  type DeveloperSide,
} from "@/lib/developer-compare";
import { formatPrice } from "@/lib/format";
import { developerDescription } from "@/lib/developer-utils";
import { getAreaStats } from "@/lib/dld-area-stats";
import { communityDldRows } from "@/lib/developer-compare-dld";
import { enMeta } from "@/lib/ar-meta";
import { comparePairTitle } from "@/lib/seo-title";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ pair: string }>;
  locale?: Locale;
}

// Canonical A-vs-B pairs are SSG'd. Reverse B-vs-A resolves at request time and
// permanentRedirects to the alphabetical slug (see compare/[pair] CI note #244).
export const dynamicParams = true;

export async function generateStaticParams() {
  const pairs = await getComparableDeveloperSlugs();
  return pairs.map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildDeveloperComparison(pair);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!cmp) notFound();
  // Plain title + layout brand suffix; cap so full SERP title stays ≤60 chars.
  return {
    title: comparePairTitle(cmp.a.name, cmp.b.name, "developers"),
    description:
      `Compare ${cmp.a.name} and ${cmp.b.name} — off-plan portfolio size, launch prices, price per sqft, communities covered, and handover pipeline.`.slice(0, 158),
    alternates: enMeta(`/compare-developers/${cmp.pairSlug}`),
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

function verdict(cmp: DeveloperComparison, dict: ReturnType<typeof getDictionary>): string {
  const { a, b } = cmp;
  const parts: string[] = [];
  const big = a.projectCount >= b.projectCount ? a : b;
  parts.push(interpolate(dict.pages.compareDev.verdictLargerPortfolio, { name: big.name, count: big.projectCount }));
  if (a.fromPrice != null && b.fromPrice != null) {
    const cheap = a.fromPrice <= b.fromPrice ? a : b;
    parts.push(interpolate(dict.pages.compareDev.verdictLowerPrice, { name: cheap.name, price: formatPrice(Math.round(cheap.fromPrice!), "AED") }));
  }
  const wide = a.communities.length >= b.communities.length ? a : b;
  parts.push(interpolate(dict.pages.compareDev.verdictMoreCommunities, { name: wide.name, count: wide.communities.length }));
  return parts.join("; ") + ".";
}

function handoverSpan(side: DeveloperSide): string {
  if (side.handoverYears.length === 0) return "—";
  const min = side.handoverYears[0];
  const max = side.handoverYears[side.handoverYears.length - 1];
  return min === max ? String(min) : `${min}–${max}`;
}

export default async function CompareDevelopersPage({ params, locale = "en" }: PageProps) {
  const { pair } = await params;
  const cmp = await buildDeveloperComparison(pair);
  if (!cmp) notFound();
  if (pair !== cmp.pairSlug) {
    permanentRedirect(localePath(locale, `/compare-developers/${cmp.pairSlug}`));
  }

  const dict = getDictionary(locale);
  const { a, b } = cmp;
  const prosA = buildDeveloperPros(a, b, dict);
  const prosB = buildDeveloperPros(b, a, dict);
  const suitA = buildDeveloperSuitability(a, b, dict);
  const suitB = buildDeveloperSuitability(b, a, dict);
  const faqs = buildDeveloperFaqs(cmp, dict);
  const related = await getRelatedDeveloperComparisons(cmp);
  const money = (n: number | null) =>
    n != null && n > 0 ? formatPrice(Math.round(n), "AED") : "—";

  const scorecards = [
    {
      label: dict.pages.compareDev.kpiProjects,
      aVal: String(a.projectCount),
      bVal: String(b.projectCount),
    },
    {
      label: dict.pages.compareDev.kpiUnits,
      aVal: a.unitCount.toLocaleString(),
      bVal: b.unitCount.toLocaleString(),
    },
    {
      label: dict.pages.compareDev.kpiFromPrice,
      aVal: money(a.fromPrice),
      bVal: money(b.fromPrice),
    },
    {
      label: dict.pages.compareDev.kpiCommunities,
      aVal: String(a.communities.length),
      bVal: String(b.communities.length),
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
      <PageHero
        title={`${a.name} vs ${b.name}`}
        italicTitle
        subtitle={dict.pages.compareDev.heroSubtitle}
      />
      <main className="mx-auto max-w-[1000px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: dict.common.home, href: "/" }, { label: dict.pages.compare.breadcrumb, href: "/compare" }, { label: `${a.name} vs ${b.name}` }]} />

        {/* KPI scorecards — at-a-glance decision layer */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {scorecards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{card.label}</p>
              <div className="mt-2 space-y-1">
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-muted-light">{a.name}</span>
                  <span className="font-semibold tabular-nums text-text-dark">{card.aVal}</span>
                </p>
                <p className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-muted-light">{b.name}</span>
                  <span className="font-semibold tabular-nums text-text-dark">{card.bVal}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Per-developer depth: existing profile text (reflowed via
            developerDescription — nothing generated) + DLD sold-price context
            aggregated ONLY through the communities each developer builds in.
            developer-name × DLD joins stay forbidden (see developer-compare.ts
            header); communityDldRows takes community keys and nothing else. */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[a, b].map((side) => {
            const about = developerDescription(side.slug, side.description);
            const dldRows = communityDldRows(side.communities, (name) => {
              const s = getAreaStats(name);
              return s ? { medianPpsqft: s.medianPpsqft, saleSample: s.saleSample } : null;
            });
            return (
              <section key={side.slug} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="font-display text-xl font-semibold text-text-dark">
                  {interpolate(dict.pages.compareDev.aboutHeading, { name: side.name })}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-6">{about}</p>
                {dldRows.length > 0 ? (
                  <div className="mt-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {interpolate(dict.pages.compareDev.dldContextHeading, { name: side.name })}
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {dldRows.map((row) => (
                        <li key={row.community} className="text-sm text-muted">
                          {interpolate(dict.pages.compareDev.dldMedianLine, {
                            community: row.community,
                            ppsf: row.medianPpsqft.toLocaleString(),
                            n: row.saleSample.toLocaleString(),
                          })}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs leading-relaxed text-muted-light">
                      {dict.pages.compareDev.dldContextHint}
                    </p>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {dict.pages.compare.metricHeader}
                </th>
                {[a, b].map((side) => (
                  <th key={side.slug} className="px-4 py-4 text-center">
                    <Link
                      href={localePath(locale, `/developers/${side.slug}`)}
                      className="font-display text-lg font-semibold text-text-dark hover:text-brand"
                    >
                      {side.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label={dict.pages.compare.rowProjects} hint={dict.pages.compareDev.rowProjectsHint} better="higher"
                aVal={String(a.projectCount)} bVal={String(b.projectCount)}
                aNum={a.projectCount} bNum={b.projectCount} />
              <Row label={dict.pages.compare.rowUnitOptions} better="higher"
                aVal={a.unitCount.toLocaleString()} bVal={b.unitCount.toLocaleString()}
                aNum={a.unitCount} bNum={b.unitCount} />
              <Row label={dict.pages.compare.rowLaunchPrice} better="lower"
                aVal={money(a.fromPrice)} bVal={money(b.fromPrice)}
                aNum={a.fromPrice} bNum={b.fromPrice} />
              <Row label={dict.pages.compareDev.rowAvgPsf} hint={dict.pages.compareDev.rowAvgPsfHint} better="none"
                aVal={a.avgPpsf != null ? `AED ${a.avgPpsf.toLocaleString()}` : "—"}
                bVal={b.avgPpsf != null ? `AED ${b.avgPpsf.toLocaleString()}` : "—"}
                aNum={a.avgPpsf} bNum={b.avgPpsf} />
              <Row label={dict.pages.compareDev.rowCommunities} better="higher"
                aVal={String(a.communities.length)} bVal={String(b.communities.length)}
                aNum={a.communities.length} bNum={b.communities.length} />
              <Row label={dict.pages.compareDev.rowPremiumShare} hint={dict.pages.compareDev.rowPremiumShareHint} better="none"
                aVal={`${Math.round(a.premiumShare * 100)}%`}
                bVal={`${Math.round(b.premiumShare * 100)}%`}
                aNum={a.premiumShare} bNum={b.premiumShare} />
              <Row label={dict.pages.compareDev.rowHandover} hint={dict.pages.compareDev.rowHandoverHint} better="none"
                aVal={handoverSpan(a)} bVal={handoverSpan(b)}
                aNum={null} bNum={null} />
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface-alt p-6">
          <h2 className="font-display text-xl font-semibold text-text-dark">
            {dict.pages.compare.verdictHeading}<span className="text-brand">.</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{verdict(cmp, dict)}</p>
          <p className="mt-2 text-xs text-muted-light">
            {dict.pages.compareDev.verdictDisclaimer}
          </p>
        </div>

        {/* Programmatic pros — the case for each developer */}
        {prosA.length > 0 || prosB.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {dict.pages.compareDev.caseForEachHeading}<span className="text-brand">.</span>
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                { side: a, pros: prosA },
                { side: b, pros: prosB },
              ].map(({ side, pros }) => (
                <div key={side.slug} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-text-dark">{side.name}</h3>
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
                      {interpolate(dict.pages.compareDev.trailingFallback, {
                        name: side.slug === a.slug ? b.name : a.name,
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Who each suits */}
        {suitA.length > 0 || suitB.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {dict.pages.compareDev.whoSuitsHeading}<span className="text-brand">.</span>
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                { side: a, suits: suitA },
                { side: b, suits: suitB },
              ].map(({ side, suits }) => (
                <div key={side.slug} className="rounded-2xl border border-border bg-surface-alt p-6">
                  <h3 className="text-lg font-semibold text-text-dark">{side.name}</h3>
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
                      {dict.pages.compareDev.specialistFallback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Where they build */}
        <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {[a, b].map((side) => (
            <div key={side.slug} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-dark">
                {interpolate(dict.pages.compareDev.whereBuilds, { name: side.name })}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {side.communities.slice(0, 8).map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          {[a, b].map((side) => (
            <Link
              key={side.slug}
              href={localePath(locale, `/developers/${side.slug}`)}
              className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {interpolate(dict.pages.compareDev.projectsCta, { name: side.name })}
            </Link>
          ))}
        </div>

        {faqs.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {interpolate(dict.pages.compareDev.faqHeading, {
                a: a.name,
                b: b.name,
              })}
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={faqs} />
            </div>
          </section>
        ) : null}

        <MarketAdviceCta context={`${a.name} vs ${b.name}`} locale={locale} />

        {/* Related comparisons — internal-linking mesh */}
        {related.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-text-dark">
              {dict.pages.compareDev.relatedHeading}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.pairSlug}
                  href={localePath(locale, `/compare-developers/${r.pairSlug}`)}
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
