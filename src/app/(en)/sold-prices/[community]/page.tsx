import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import {
  getOffplanVsReady,
  getRecentSales,
  getRecentSalesMeta,
} from "@/lib/dld-recent-sales";
import { buildSoldPricesDatasetJsonLd } from "@/lib/sold-prices-json-ld";
import { getCommunities, getCommunity, getProjectsByCommunity } from "@/lib/communities";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary, interpolate } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ community: string }>;
  /** Set to "ar" by the /ar mirror so all UI labels localize. */
  locale?: Locale;
}

// All community slugs are known at build time; unknown → hard 404 (no
// soft-404s, #241). SSG only — request-time full-catalog compute is the
// /compare-503 lesson.
export const dynamicParams = false;

export async function generateStaticParams() {
  const communities = await getCommunities();
  return communities.map((community) => ({ community: community.slug }));
}

/** Below the sample gate the page renders (link integrity) but never indexes. */
function isIndexable(rowCount: number): boolean {
  return rowCount >= 8;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { community: slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();
  const rows = getRecentSales(community.name) ?? [];
  const base = getSiteUrl();
  return {
    title: `Sold Prices in ${community.name} — DLD Transactions`,
    description:
      `Recent sold prices in ${community.name}, ${community.cityLabel}: ${rows.length} anonymized DLD residential transactions with price, AED/sqft, bedrooms and off-plan vs ready type.`.slice(
        0,
        158,
      ),
    alternates: {
      canonical: `${base}/sold-prices/${slug}`,
      languages: {
        "x-default": `${base}/sold-prices/${slug}`,
        en: `${base}/sold-prices/${slug}`,
        ar: `${base}/ar/sold-prices/${slug}`,
      },
    },
    robots: isIndexable(rows.length) ? undefined : { index: false, follow: true },
  };
}

const SQM_TO_SQFT = 10.7639;

export async function SoldPricesCommunityPage({ params, locale = "en" }: PageProps) {
  const { community: slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const dict = getDictionary(locale);
  const t = dict.soldPrices;
  const rows = getRecentSales(community.name) ?? [];
  const stats = getAreaStats(community.name);
  const spread = getOffplanVsReady(community.name);
  const meta = getRecentSalesMeta();
  const source = getDldSource();
  const projects = (await getProjectsByCommunity(slug)).slice(0, 4);

  const months = [...new Set(rows.map((r) => r.month))].sort();
  const crumbs = [
    { label: dict.common.home, href: localePath(locale, "/") },
    { label: t.hubTitle, href: localePath(locale, "/sold-prices") },
    { label: community.name },
  ];

  const faqs = [
    {
      q: interpolate(t.faqSourceQ, { community: community.name }),
      a: t.faqSourceA,
    },
    {
      q: interpolate(t.faqFreshQ, { community: community.name }),
      a: interpolate(t.faqFreshA, { builtAt: meta.builtAt }),
    },
    ...(spread
      ? [
          {
            q: interpolate(t.faqSpreadQ, { community: community.name }),
            a: interpolate(t.faqSpreadA, {
              community: community.name,
              offplan: String(spread.offplanPpsqft),
              ready: String(spread.readyPpsqft),
              spread: String(Math.abs(spread.spreadPct)),
              direction: spread.spreadPct >= 0 ? t.above : t.below,
            }),
          },
        ]
      : []),
  ];

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildSoldPricesDatasetJsonLd({
              communityName: community.name,
              communitySlug: slug,
              rowCount: rows.length,
              months,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd(
              crumbs.map((c) => ({ name: c.label, url: c.href ? `${getSiteUrl()}${c.href}` : undefined })),
            ),
          ),
        }}
      />
      {faqs.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqPageJsonLd(faqs)),
          }}
        />
      ) : null}

      <PageHero
        title={interpolate(t.pageTitle, { community: community.name })}
        subtitle={interpolate(t.pageSubtitle, {
          count: String(rows.length),
          city: community.cityLabel,
        })}
      />

      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <Breadcrumbs items={crumbs} />

        {stats ? (
          <section className="mt-6">
            <DldAreaStatsBand stats={stats} areaName={community.name} source={source.source} locale={locale} />
          </section>
        ) : null}

        {spread ? (
          <section className="mt-8 rounded-2xl border border-border bg-surface-alt p-6">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {t.spreadTitle}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {interpolate(t.spreadBody, {
                community: community.name,
                offplan: formatPrice(spread.offplanPpsqft, "AED"),
                ready: formatPrice(spread.readyPpsqft, "AED"),
                spread: String(Math.abs(spread.spreadPct)),
                direction: spread.spreadPct >= 0 ? t.above : t.below,
              })}
            </p>
            <p className="mt-2 text-xs text-muted-light">
              {interpolate(t.spreadSample, {
                nOffplan: spread.nOffplan.toLocaleString(),
                nReady: spread.nReady.toLocaleString(),
              })}
            </p>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            {interpolate(t.tableTitle, { count: String(rows.length) })}
          </h2>
          <p className="mt-1 text-sm text-muted">{t.tableSubtitle}</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-alt text-start text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 text-start">{t.colMonth}</th>
                  <th className="px-4 py-3 text-start">{t.colProject}</th>
                  <th className="px-4 py-3 text-start">{t.colBeds}</th>
                  <th className="px-4 py-3 text-start">{t.colSize}</th>
                  <th className="px-4 py-3 text-end">{t.colPrice}</th>
                  <th className="px-4 py-3 text-end">{t.colPpsqft}</th>
                  <th className="px-4 py-3 text-start">{t.colType}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i % 2 ? "bg-surface-alt/50" : undefined}>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.month}</td>
                    <td className="max-w-[220px] truncate px-4 py-2.5">{r.project ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {r.beds == null ? "—" : r.beds === 0 ? t.studio : r.beds}
                    </td>
                    <td className="px-4 py-2.5">
                      {Math.round(r.sizeBandSqm * SQM_TO_SQFT).toLocaleString()}–
                      {Math.round((r.sizeBandSqm + 5) * SQM_TO_SQFT).toLocaleString()} {t.sqft}
                    </td>
                    <td className="px-4 py-2.5 text-end font-semibold">
                      {formatPrice(r.price, "AED")}
                    </td>
                    <td className="px-4 py-2.5 text-end">{r.aedPerSqft.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      {r.regType === "off-plan" ? (
                        <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand-dark">
                          {t.offplan}
                        </span>
                      ) : r.regType === "ready" ? (
                        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs text-muted">
                          {t.ready}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-light">
            {interpolate(t.methodology, { builtAt: meta.builtAt, source: source.source })}
          </p>
        </section>

        {projects.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">
              {interpolate(t.projectsTitle, { community: community.name })}
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {projects.map((p) => (
                <LocaleLink
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="focus-ring iop-btn-press rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-dark hover:border-brand hover:text-brand"
                >
                  {p.name}
                </LocaleLink>
              ))}
              <LocaleLink
                href={`/communities/${slug}`}
                className="focus-ring iop-btn-press rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {interpolate(t.communityCta, { community: community.name })}
              </LocaleLink>
            </div>
          </section>
        ) : null}

        {faqs.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-text-dark">{t.faqTitle}</h2>
            <div className="mt-4">
              <FaqAccordion faqs={faqs} />
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

export default SoldPricesCommunityPage;
