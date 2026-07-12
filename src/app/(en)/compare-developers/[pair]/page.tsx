import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { FaqAccordion } from "@/components/faq-accordion";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import {
  buildDeveloperComparison,
  buildDeveloperFaqs,
  getComparableDeveloperSlugs,
  type DeveloperComparison,
  type DeveloperSide,
} from "@/lib/developer-compare";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ pair: string }>;
  locale?: Locale;
}

// Pairs are derived at build time from developer slugs — unknown pairs are 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const pairs = await getComparableDeveloperSlugs();
  return pairs.map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildDeveloperComparison(pair);
  if (!cmp) return { title: "Comparison not found" };
  return {
    title: { absolute: `${cmp.a.name} vs ${cmp.b.name} — developers | invest off-plan` },
    description:
      `Compare ${cmp.a.name} and ${cmp.b.name} — off-plan portfolio size, launch prices, price per sqft, communities covered, and handover pipeline.`.slice(0, 158),
    alternates: { canonical: `${getSiteUrl()}/compare-developers/${cmp.pairSlug}` },
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

  const dict = getDictionary(locale);
  const { a, b } = cmp;
  const faqs = buildDeveloperFaqs(cmp);
  const money = (n: number | null) =>
    n != null && n > 0 ? formatPrice(Math.round(n), "AED") : "—";

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
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {dict.pages.compare.metricHeader}
                </th>
                {[a, b].map((side) => (
                  <th key={side.slug} className="px-4 py-4 text-center">
                    <Link
                      href={`/developers/${side.slug}`}
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
              href={`/developers/${side.slug}`}
              className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {interpolate(dict.pages.compareDev.projectsCta, { name: side.name })}
            </Link>
          ))}
        </div>

        {faqs.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {a.name} vs {b.name} FAQ
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={faqs} />
            </div>
          </section>
        ) : null}

        <MarketAdviceCta context={`${a.name} vs ${b.name}`} locale={locale} />
      </main>
    </PageShell>
  );
}
