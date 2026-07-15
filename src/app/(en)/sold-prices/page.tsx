import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getCommunities } from "@/lib/communities";
import { getRecentSales, getRecentSalesMeta } from "@/lib/dld-recent-sales";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary, interpolate } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

interface PageProps {
  /** Set to "ar" by the /ar mirror so all UI labels localize. */
  locale?: Locale;
}

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Sold Property Prices in Dubai — DLD Transactions by Community",
    description:
      "Recent sold prices across Dubai communities from Dubai Land Department open data: anonymized residential transactions with price, AED/sqft, bedrooms and off-plan vs ready type.",
    alternates: {
      canonical: `${base}/sold-prices`,
      languages: {
        "x-default": `${base}/sold-prices`,
        en: `${base}/sold-prices`,
        ar: `${base}/ar/sold-prices`,
      },
    },
  };
}

export async function SoldPricesHubPage({ locale = "en" }: PageProps) {
  const dict = getDictionary(locale);
  const t = dict.soldPrices;
  const meta = getRecentSalesMeta();
  const communities = await getCommunities();

  // Only communities that clear the sample gate get listed (and only those
  // are in the sitemap) — thin low-volume pages stay reachable but unlisted.
  const covered = communities
    .map((c) => ({ community: c, rows: getRecentSales(c.name) }))
    .filter((x): x is { community: (typeof communities)[number]; rows: NonNullable<ReturnType<typeof getRecentSales>> } => Boolean(x.rows && x.rows.length >= 8))
    .sort((a, b) => b.rows.length - a.rows.length);

  const crumbs = [
    { label: dict.common.home, href: localePath(locale, "/") },
    { label: t.hubTitle },
  ];

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sold property prices by Dubai community",
    itemListElement: covered.map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: x.community.name,
      url: `${getSiteUrl()}/sold-prices/${x.community.slug}`,
    })),
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
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
      <PageHero
        title={t.hubTitle}
        subtitle={interpolate(t.hubSubtitle, { count: String(covered.length), builtAt: meta.builtAt })}
      />
      <div className="mx-auto max-w-[1200px] px-5 py-8 md:px-8">
        <Breadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {covered.map(({ community, rows }) => (
            <LocaleLink
              key={community.slug}
              href={`/sold-prices/${community.slug}`}
              className="iop-btn-press focus-ring group rounded-2xl border border-border p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-elevation-md"
            >
              <p className="text-lg font-semibold text-text-dark group-hover:text-brand">
                {community.name}
              </p>
              <p className="mt-1 text-sm text-muted">
                {interpolate(t.hubCardMeta, {
                  count: String(rows.length),
                  latest: rows[0]?.month ?? "",
                })}
              </p>
            </LocaleLink>
          ))}
        </div>
        <p className="mt-8 text-xs leading-relaxed text-muted-light">
          {interpolate(t.methodology, { builtAt: meta.builtAt, source: meta.source })}
        </p>
      </div>
    </PageShell>
  );
}

export default SoldPricesHubPage;
