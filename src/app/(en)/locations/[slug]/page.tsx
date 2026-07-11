import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocaleLink } from "@/components/locale-link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import {
  LOCATION_GUIDES,
  buildGuideRanking,
  getLocationGuide,
} from "@/lib/location-guides";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { enMeta } from "@/lib/ar-meta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return LOCATION_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getLocationGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: guide.title,
    description: guide.intro.slice(0, 158),
    alternates: enMeta(`/locations/${slug}`),
  };
}

export default async function LocationGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await buildGuideRanking(slug);
  if (!result) notFound();
  const { guide, ranked } = result;
  const base = getSiteUrl();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: guide.title,
    itemListElement: ranked.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.metrics.name,
      url: `${base}/communities/${r.metrics.slug}`,
    })),
  };

  const others = LOCATION_GUIDES.filter((g) => g.slug !== slug);

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              { name: "Home", url: base },
              { name: "Location guides", url: `${base}/locations` },
              { name: guide.label },
            ]),
          ),
        }}
      />
      <PageHero title={guide.h1} italicTitle subtitle={guide.intro} />
      <main className="mx-auto max-w-[1000px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Location guides", href: "/locations" }, { label: guide.label }]} />
        <ol className="space-y-3">
          {ranked.map((r, i) => (
            <li key={r.metrics.slug}>
              <LocaleLink
                href={`/communities/${r.metrics.slug}`}
                className="iop-btn-press focus-ring group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
              >
                <span className="font-display text-2xl font-semibold italic tabular-nums text-muted-light">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-text-dark group-hover:text-brand">
                    {r.metrics.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{r.rationale}</span>
                </span>
                <span className="shrink-0 text-end">
                  <span className="block font-display text-xl font-semibold tabular-nums text-brand">
                    {r.valueLabel}
                  </span>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-light">
                    {guide.metricLabel}
                  </span>
                </span>
              </LocaleLink>
            </li>
          ))}
        </ol>

        <p className="mt-6 max-w-2xl text-xs text-muted-light">
          <span className="font-semibold text-muted">Methodology.</span> {guide.methodology} DLD
          figures are anonymized aggregates from Dubai Land Department open data (2025); catalog
          figures are live off-plan launch data. No purchase-level or owner data is used.
        </p>

        <MarketAdviceCta context={guide.h1.toLowerCase()} />

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-text-dark">More location guides</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {others.map((g) => (
              <LocaleLink
                key={g.slug}
                href={`/locations/${g.slug}`}
                className="iop-btn-press focus-ring rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-muted transition hover:border-brand hover:text-brand"
              >
                {g.label}
              </LocaleLink>
            ))}
            <LocaleLink
              href="/communities"
              className="iop-btn-press focus-ring rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-muted transition hover:border-brand hover:text-brand"
            >
              All communities
            </LocaleLink>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
