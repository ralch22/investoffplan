import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { formatPrice } from "@/lib/format";
import { unoptimizedProp } from "@/lib/asset-image";
import { enMeta } from "@/lib/ar-meta";
import { comparePairTitle } from "@/lib/seo-title";
import {
  buildProjectComparison,
  getComparableProjectSlugs,
  type ProjectSide,
} from "@/lib/project-compare";
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
  const pairs = await getComparableProjectSlugs();
  return pairs.map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pair } = await params;
  const cmp = await buildProjectComparison(pair);
  if (!cmp) return { title: "Comparison not found" };
  const { a, b } = cmp;
  // Plain title + layout brand; enMeta for reciprocal hreflang with /ar mirror.
  return {
    title: comparePairTitle(a.name, b.name, "off-plan"),
    description:
      `Compare ${a.name} (${a.developer}) and ${b.name} (${b.developer}) in ${a.area} — from-price, price per sqft, handover, payment plan, and bedrooms.`.slice(
        0,
        158,
      ),
    alternates: enMeta(`/compare-projects/${cmp.pairSlug}`),
  };
}

function Row({
  label,
  aVal,
  bVal,
  aNum,
  bNum,
  better = "none",
}: {
  label: string;
  aVal: string;
  bVal: string;
  aNum?: number | null;
  bNum?: number | null;
  better?: "higher" | "lower" | "none";
}) {
  let aWins = false;
  let bWins = false;
  if (better !== "none" && aNum != null && bNum != null && aNum !== bNum) {
    aWins = better === "higher" ? aNum > bNum : aNum < bNum;
    bWins = !aWins;
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
      <th scope="row" className="px-4 py-3 text-start text-sm font-semibold text-text-dark">
        {label}
      </th>
      {cell(aVal, aWins)}
      {cell(bVal, bWins)}
    </tr>
  );
}

function Head({ side, locale }: { side: ProjectSide; locale: Locale }) {
  return (
    <th className="px-4 py-4 text-center align-top">
      <Link href={localePath(locale, `/projects/${side.slug}`)} className="group block">
        <div className="relative mx-auto mb-2 h-20 w-full max-w-[160px] overflow-hidden rounded-lg">
          {side.imageUrl ? (
            <Image
              src={side.imageUrl}
              alt=""
              fill
              sizes="160px"
              className="object-cover"
              {...unoptimizedProp(side.imageUrl)}
            />
          ) : (
            <div className="h-full bg-surface-alt" />
          )}
        </div>
        <span className="font-display text-base font-semibold text-text-dark group-hover:text-brand">
          {side.name}
        </span>
        <span className="block text-xs text-muted-light">{side.developer}</span>
      </Link>
    </th>
  );
}

export default async function CompareProjectsPage({ params, locale = "en" }: PageProps) {
  const { pair } = await params;
  const cmp = await buildProjectComparison(pair);
  if (!cmp) notFound();
  if (pair !== cmp.pairSlug) {
    permanentRedirect(localePath(locale, `/compare-projects/${cmp.pairSlug}`));
  }

  const dict = getDictionary(locale);
  const t = dict.pages.compare;
  const { a, b } = cmp;
  const money = (n: number | null) => (n != null && n > 0 ? formatPrice(Math.round(n), "AED") : "—");
  const psf = (n: number | null) => (n != null ? `AED ${n.toLocaleString()}` : "—");
  const yld = (n: number | null) => (n != null ? `${n}%` : "—");

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={`${a.name} vs ${b.name}`}
        italicTitle
        subtitle={`Two off-plan projects in ${a.area}, side by side.`}
      />
      <main className="mx-auto max-w-[1000px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: dict.common.home, href: "/" }, { label: t.breadcrumb, href: "/compare" }, { label: `${a.name} vs ${b.name}` }]} />
        <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-elevation-sm">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="bg-surface-alt">
                <th className="px-4 py-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {t.metricHeader}
                </th>
                <Head side={a} locale={locale} />
                <Head side={b} locale={locale} />
              </tr>
            </thead>
            <tbody>
              <Row label={t.rowFromPrice} aVal={money(a.fromPrice)} bVal={money(b.fromPrice)}
                aNum={a.fromPrice} bNum={b.fromPrice} better="lower" />
              <Row label={t.rowLaunchPsf} aVal={psf(a.ppsqft)} bVal={psf(b.ppsqft)}
                aNum={a.ppsqft} bNum={b.ppsqft} better="lower" />
              <Row label={t.rowBedrooms} aVal={a.bedsRange} bVal={b.bedsRange} />
              <Row label={t.rowHandover} aVal={a.handover ?? "—"} bVal={b.handover ?? "—"} />
              <Row label={t.rowPaymentPlan} aVal={a.paymentPlan || "—"} bVal={b.paymentPlan || "—"} />
              <Row label={t.rowUnitOptions} aVal={a.unitCount.toLocaleString()} bVal={b.unitCount.toLocaleString()}
                aNum={a.unitCount} bNum={b.unitCount} better="higher" />
              <Row label={t.rowAreaYield} aVal={yld(a.areaYield)} bVal={yld(b.areaYield)}
                aNum={a.areaYield} bNum={b.areaYield} better="higher" />
              <Row label={t.rowGoldenVisa} aVal={a.goldenVisa ? "Yes" : "No"} bVal={b.goldenVisa ? "Yes" : "No"} />
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {[a, b].map((side) => (
            <Link
              key={side.slug}
              href={localePath(locale, `/projects/${side.slug}`)}
              className="iop-btn-press focus-ring rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {interpolate(t.viewProjectCta, { name: side.name })}
            </Link>
          ))}
        </div>

        <MarketAdviceCta context={`${a.name} vs ${b.name}`} locale={locale} />
      </main>
    </PageShell>
  );
}
