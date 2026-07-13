import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getCommunities, getCommunityImage } from "@/lib/communities";
import { getComparisonList } from "@/lib/area-compare";
import { areaTagline } from "@/lib/figma-copy";
import { getHeroImage } from "@/lib/area-images";
import { unoptimizedProp } from "@/lib/asset-image";
import { enMeta } from "@/lib/ar-meta";
import { getDictionary } from "@/i18n";
import { interpolate, type Locale } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Dubai Communities — Off-Plan Projects by Neighbourhood",
  description:
    "Explore off-plan projects by community — Downtown Dubai, Dubai Marina, JVC, Palm Jumeirah, and more. Real DLD market data and side-by-side comparisons.",
  alternates: enMeta("/communities"),
};

export async function CommunitiesPageContent({ locale = "en" }: { locale?: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.pages.communities;
  const communities = await getCommunities();
  const featured = communities.slice(0, 12);
  const comparisons = (await getComparisonList()).slice(0, 9);
  const heroImage = await getHeroImage();
  const featuredWithImages = await Promise.all(
    featured.map(async (community) => ({
      community,
      imageUrl: await getCommunityImage(community.slug),
    })),
  );

  return (
    <PageShell headerVariant="transparent">
      <PageHero
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        imageUrl={heroImage}
      />

      <section className="relative z-10 -mt-10 mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="rounded-2xl border-t-4 border-brand bg-white p-6 shadow-xl md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-dark">{t.keyCommunities}</h2>
            <LocaleLink href="/projects" className="text-sm font-semibold text-brand">
              {t.viewAll}
            </LocaleLink>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredWithImages.map(({ community, imageUrl }) => (
              <LocaleLink
                key={community.slug}
                href={`/communities/${community.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-white"
              >
                <div className="relative h-44">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={community.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      {...unoptimizedProp(imageUrl)}
                    />
                  ) : (
                    <div className="h-full bg-surface-alt" />
                  )}
                  <div className="card-photo-overlay absolute inset-0" />
                </div>
                <div className="p-5">
                  <p className="font-semibold text-text-dark group-hover:text-brand">
                    {community.name}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {areaTagline(community.slug, community.name, {
                      locale,
                      exploreTemplate: t.areaTaglineExplore,
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-light">
                    {interpolate(t.communityStats, {
                      projects: community.projectCount,
                      units: community.unitCount.toLocaleString(),
                    })}
                  </p>
                  <span className="mt-4 inline-block rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
                    {t.view}
                  </span>
                </div>
              </LocaleLink>
            ))}
          </div>
        </div>
      </section>

      {comparisons.length > 0 ? (
        <section className="py-14">
          <div className="mx-auto max-w-[1200px] px-5 md:px-8">
            <p className="section-eyebrow">{t.realDldEyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text-dark md:text-3xl">
              {t.compareHeading}<span className="text-brand">.</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              {t.compareSubtitle}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((c) => (
                <LocaleLink
                  key={c.pairSlug}
                  href={`/compare/${c.pairSlug}`}
                  className="iop-btn-press focus-ring group rounded-2xl border border-border bg-white p-4 shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-elevation-md"
                >
                  <p className="text-sm font-semibold text-text-dark group-hover:text-brand">
                    {c.aName} <span className="text-muted-light">vs</span> {c.bName}
                  </p>
                  {c.aYield != null && c.bYield != null ? (
                    <p className="mt-1 text-xs tabular-nums text-muted">
                      {interpolate(t.compareYield, { a: c.aYield, b: c.bYield })}
                    </p>
                  ) : null}
                </LocaleLink>
              ))}
            </div>
            <div className="mt-6">
              <PrimaryButton href="/compare">{t.allComparisons}</PrimaryButton>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-border bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-2xl font-semibold text-text-dark md:text-3xl">
            {t.insightsHeading}<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted">
            {t.insightsBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href="/locations">{t.locationGuides}</PrimaryButton>
            <PrimaryButton href="/tools/communities" variant="ghost" showArrow={false}>
              {t.exploreLifestyle}
            </PrimaryButton>
          </div>
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            {t.mapHeading}<span className="text-brand">.</span>
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            {t.mapSubtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href="/tools/price-map">{t.priceMap}</PrimaryButton>
            <PrimaryButton href="/map" variant="ghost" showArrow={false}>
              {t.projectMap}
            </PrimaryButton>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default async function CommunitiesPage() {
  return <CommunitiesPageContent />;
}
