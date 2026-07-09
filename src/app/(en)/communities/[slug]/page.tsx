import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import {
  communitySlugFor,
  getCommunities,
  getCommunity,
  getCommunityImage,
  getProjectsByCommunity,
} from "@/lib/communities";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import { getSuggestedComparisons } from "@/lib/area-compare";
import { MarketAdviceCta } from "@/components/market-advice-cta";
import { getAreaEditorial } from "@/content/areas";
import { areaTagline } from "@/lib/figma-copy";
import { formatPrice } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ slug: string }>;
}

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
    title: `${community.name} off-plan projects`,
    description:
      editorial?.intro[0]?.slice(0, 158) ??
      `${community.projectCount} off-plan projects in ${community.name}, ${community.cityLabel}.`,
    alternates: {
      canonical: `${getSiteUrl()}/communities/${slug}`,
      languages: {
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

export default async function CommunityDetailPage({ params }: PageProps) {
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
      <PageHero
        title={community.name}
        italicTitle
        subtitle={areaTagline(slug, community.name)}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        {/* Stats band */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Off-plan projects" value={String(community.projectCount)} />
          <StatCard label="Unit options" value={community.unitCount.toLocaleString()} />
          <StatCard
            label="Launch prices from"
            value={stats.minPrice > 0 ? formatPrice(stats.minPrice, "AED") : "On request"}
          />
          <StatCard
            label="Avg. launch AED/sqft"
            value={stats.avgPpsf ? `AED ${stats.avgPpsf.toLocaleString()}` : "—"}
          />
        </div>

        {stats.handoverYears.length > 0 ? (
          <p className="mt-4 text-sm text-muted">
            Handover pipeline:{" "}
            {stats.handoverYears
              .map((entry) => `${entry.year} (${entry.count})`)
              .join(" · ")}
          </p>
        ) : null}

        {/* DLD market data (anonymized aggregates; renders only where we have it) */}
        {dldStats ? (
          <DldAreaStatsBand stats={dldStats} areaName={community.name} source={dldSource.source} />
        ) : null}

        {comparisons.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-dark">
              Compare {community.name} with:
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
          />
        ) : null}

        {/* Editorial intro */}
        {editorial ? (
          <section className="mt-10 max-w-3xl">
            <h2 className="font-display text-3xl font-semibold text-text-dark">
              Living in {community.name}
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
            Current Projects<span className="text-brand">.</span>
          </h2>
          <LocaleLink
            href={`/projects?q=${encodeURIComponent(community.name)}`}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            View all
          </LocaleLink>
        </div>
        <p className="mt-2 text-sm text-muted">
          {community.projectCount} {community.projectCount === 1 ? "project" : "projects"} ·{" "}
          {community.unitCount.toLocaleString()} unit options in {community.cityLabel}
        </p>

        {projects.length === 0 ? (
          <p className="mt-8 text-muted">No projects listed in this community yet.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project, index) => (
              <ShowcaseProjectCard key={project.id} project={project} featured={index === 0} />
            ))}
          </div>
        )}

        {/* Editorial depth */}
        {editorial ? (
          <>
            <section className="mt-14 grid gap-6 md:grid-cols-2">
              <EditorialCard title="Lifestyle" paragraphs={editorial.lifestyle} />
              <EditorialCard
                title="Transport & commute"
                paragraphs={editorial.transport}
              />
              <EditorialCard
                title="Schools & healthcare"
                paragraphs={editorial.schools}
              />
              <EditorialCard title="Who it suits" paragraphs={editorial.whoItSuits} />
            </section>

            {editorial.nearbyAreas.length > 0 ? (
              <section className="mt-10">
                <h3 className="text-lg font-semibold text-text-dark">Nearby communities</h3>
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
                  {community.name} FAQ
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
                Similar Communities<span className="text-brand">.</span>
              </h2>
              <LocaleLink
                href="/communities"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                See all communities
              </LocaleLink>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((item) => (
                <LocaleLink
                  key={item.slug}
                  href={`/communities/${item.slug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-brand"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {item.projectCount} {item.projectCount === 1 ? "project" : "projects"}
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
