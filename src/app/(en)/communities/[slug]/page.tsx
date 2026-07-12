import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LocaleLink } from "@/components/locale-link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import {
  communitySlugFor,
  getCommunities,
  getCommunity,
  getCommunityImage,
  getProjectsByCommunity,
} from "@/lib/communities";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { DeepAnalyticsUnlock } from "@/components/deep-analytics-unlock";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import { getSuggestedComparisons } from "@/lib/area-compare";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { getAreaEditorial } from "@/content/areas";
import { areaTagline } from "@/lib/figma-copy";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary, interpolate } from "@/i18n";
import { localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  /** Set to "ar" by the /ar mirror so all UI labels localize. */
  locale?: Locale;
}

// Catalog communities are fully known at build time — unknown slugs must 404
// (without this, OpenNext soft-404s HTTP 200 "Community not found"). Issue #241.
export const dynamicParams = false;

export async function generateStaticParams() {
  const communities = await getCommunities();
  return communities.map((community) => ({ slug: community.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) return { title: "Community not found" };
  const editorial = getAreaEditorial(slug);
  return {
    title: `Off-Plan Projects in ${community.name}, ${community.cityLabel}`,
    description:
      editorial?.intro[0]?.slice(0, 158) ??
      `${community.projectCount} off-plan projects for sale in ${community.name}, ${community.cityLabel} — prices, floor plans, payment plans, and Land Department market data.`.slice(
        0,
        158,
      ),
    alternates: {
      canonical: `${getSiteUrl()}/communities/${slug}`,
      languages: {
        "x-default": `${getSiteUrl()}/communities/${slug}`,
        en: `${getSiteUrl()}/communities/${slug}`,
        ar: `${getSiteUrl()}/ar/communities/${slug}`,
      },
    },
  };
}

interface CommunityStats {
  minPrice: number;
  avgPpsf: number | null;
  handoverYears: Array<{ year: number; count: number }>;
}

function computeCommunityStats(
  projects: Awaited<ReturnType<typeof getProjectsByCommunity>>,
): CommunityStats {
  const prices: number[] = [];
  const ppsf: number[] = [];
  const years = new Map<number, number>();
  for (const project of projects) {
    const yearMatch = project.handover?.match(/(\d{4})/);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      years.set(year, (years.get(year) ?? 0) + 1);
    }
    for (const unit of project.units) {
      if (unit.launchPriceAed > 0) prices.push(unit.launchPriceAed);
      if (unit.launchPriceAed > 0 && unit.sqftMin > 0) {
        ppsf.push(unit.launchPriceAed / unit.sqftMin);
      }
    }
  }
  return {
    minPrice: prices.length ? Math.min(...prices) : 0,
    avgPpsf: ppsf.length
      ? Math.round(ppsf.reduce((a, b) => a + b, 0) / ppsf.length)
      : null,
    handoverYears: [...years.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year),
  };
}

export default async function CommunityDetailPage({ params, locale = "en" }: PageProps) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const projects = await getProjectsByCommunity(slug);
  const communities = await getCommunities();
  const editorial = getAreaEditorial(slug);
  const stats = computeCommunityStats(projects);
  const dldStats = getAreaStats(community.name);
  const dldSource = getDldSource();
  const comparisons = await getSuggestedComparisons(slug);
  const similar = communities
    .filter((c) => c.slug !== slug && c.city === community.city)
    .slice(0, 4);
  const heroImage = await getCommunityImage(slug);

  const communitySlugs = new Set(communities.map((c) => c.slug));

  const dict = getDictionary(locale);
  const t = dict.communityDetail;

  return (
    <PageShell headerVariant="transparent">
      {editorial?.faq && editorial.faq.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildFaqPageJsonLd(editorial.faq)),
          }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              { name: dict.common.home, url: getSiteUrl() },
              { name: t.breadcrumbCommunities, url: `${getSiteUrl()}/communities` },
              { name: community.name },
            ]),
          ),
        }}
      />
      <PageHero
        title={community.name}
        italicTitle
        subtitle={areaTagline(slug, community.name)}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs items={[{ label: dict.common.home, href: "/" }, { label: t.breadcrumbCommunities, href: "/communities" }, { label: community.name }]} />
        {/* Stats band */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.statOffPlanProjects} value={String(community.projectCount)} />
          <StatCard label={t.statUnitOptions} value={community.unitCount.toLocaleString()} />
          <StatCard
            label={t.statLaunchPricesFrom}
            value={stats.minPrice > 0 ? formatPrice(stats.minPrice, "AED") : t.statOnRequest}
          />
          <StatCard
            label={t.statAvgPpsf}
            value={stats.avgPpsf ? `AED ${stats.avgPpsf.toLocaleString()}` : "—"}
          />
        </div>

        {stats.handoverYears.length > 0 ? (
          <p className="mt-4 text-sm text-muted">
            {t.handoverPipeline}{" "}
            {stats.handoverYears
              .map((entry) => `${entry.year} (${entry.count})`)
              .join(" · ")}
          </p>
        ) : null}

        {/* DLD market data (anonymized aggregates; renders only where we have it) */}
        {dldStats ? (
          <>
            <DldAreaStatsBand stats={dldStats} areaName={community.name} source={dldSource.source} locale={locale} />
            {/* Interaction-gated deep analytics + printable report entry point.
                Static HTML identical for all users — the deep data only ever
                arrives via the session-guarded API after a click. */}
            <DeepAnalyticsUnlock
              slug={slug}
              areaName={community.name}
              reportHref={localePath(locale, `/reports/market/${slug}`)}
            />
          </>
        ) : null}

        {comparisons.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-dark">
              {interpolate(t.compareWith, { name: community.name })}
            </span>
            {comparisons.map((c) => (
              <LocaleLink
                key={c.pairSlug}
                href={`/compare/${c.pairSlug}`}
                className="iop-btn-press focus-ring rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-dark transition hover:border-brand hover:text-brand"
              >
                {c.otherName}
              </LocaleLink>
            ))}
          </div>
        ) : null}

        {dldStats ? (
          <MarketAdviceCta
            context={`investing in ${community.name}`}
            heading={`Thinking about ${community.name}?`}
            locale={locale}
          />
        ) : null}

        {/* Editorial intro */}
        {editorial ? (
          <section className="mt-10 max-w-3xl">
            <h2 className="font-display text-3xl font-semibold text-text-dark">
              {interpolate(t.livingIn, { name: community.name })}
              <span className="text-brand">.</span>
            </h2>
            <div className="mt-4 space-y-4">
              {editorial.intro.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {/* Projects */}
        <div className="mt-12 flex items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-text-dark">
            {t.currentProjects}<span className="text-brand">.</span>
          </h2>
          <LocaleLink
            href={`/projects?q=${encodeURIComponent(community.name)}`}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            {t.viewAll}
          </LocaleLink>
        </div>
        <p className="mt-2 text-sm text-muted">
          {community.projectCount} {community.projectCount === 1 ? t.projectSingular : t.projectPlural} ·{" "}
          {community.unitCount.toLocaleString()} {interpolate(t.unitOptionsIn, { city: community.cityLabel })}
        </p>

        {projects.length === 0 ? (
          <p className="mt-8 text-muted">{t.noProjects}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project, index) => (
              <ShowcaseProjectCard key={project.id} project={project} featured={index === 0} />
            ))}
          </div>
        )}

        {/* Editorial depth */}
        {editorial ? (
          <>
            <section className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
              <EditorialCard title={t.editorialLifestyle} paragraphs={editorial.lifestyle} />
              <EditorialCard
                title={t.editorialTransport}
                paragraphs={editorial.transport}
              />
              <EditorialCard
                title={t.editorialSchools}
                paragraphs={editorial.schools}
              />
              <EditorialCard title={t.editorialWhoItSuits} paragraphs={editorial.whoItSuits} />
            </section>

            {editorial.nearbyAreas.length > 0 ? (
              <section className="mt-10">
                <h3 className="text-lg font-semibold text-text-dark">{t.nearbyCommunities}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {editorial.nearbyAreas.map((name) => {
                    const targetSlug = communitySlugFor(name);
                    return communitySlugs.has(targetSlug) ? (
                      <LocaleLink
                        key={name}
                        href={`/communities/${targetSlug}`}
                        className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
                      >
                        {name}
                      </LocaleLink>
                    ) : (
                      <span
                        key={name}
                        className="rounded-full border border-border bg-surface-alt px-4 py-1.5 text-sm text-muted"
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {editorial.faq && editorial.faq.length > 0 ? (
              <section className="mt-12 max-w-3xl">
                <h2 className="font-display text-2xl font-semibold text-text-dark">
                  {interpolate(t.nameFaq, { name: community.name })}
                </h2>
                <div className="mt-5">
                  <FaqAccordion faqs={editorial.faq} />
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>

      {similar.length > 0 ? (
        <section className="bg-surface-darker py-14 text-white">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold">
                {t.similarCommunities}<span className="text-brand">.</span>
              </h2>
              <LocaleLink
                href="/communities"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                {t.seeAllCommunities}
              </LocaleLink>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <LocaleLink
                  key={item.slug}
                  href={`/communities/${item.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-brand"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {item.projectCount} {item.projectCount === 1 ? t.projectSingular : t.projectPlural}
                  </p>
                </LocaleLink>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-text-dark">{value}</p>
    </div>
  );
}

function EditorialCard({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  if (!paragraphs || paragraphs.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-text-dark">{title}</h3>
      <div className="mt-3 space-y-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-sm leading-relaxed text-muted">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
