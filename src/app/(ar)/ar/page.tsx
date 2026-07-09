import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { HeroSearch } from "@/components/hero-search";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getSiteStats } from "@/lib/catalog";
import { getCommunities } from "@/lib/communities";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getHeroImage } from "@/lib/area-images";
import { getDictionary, interpolate } from "@/i18n";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "عقارات على الخارطة في الإمارات",
  description:
    "تصفّح أكثر من 2,000 وحدة على الخارطة مع بروشورات وخطط سداد وأدوات مقارنة وخريطة تفاعلية في دبي والإمارات.",
  alternates: {
    canonical: `${getSiteUrl()}/ar`,
    languages: { en: getSiteUrl() || "/", ar: `${getSiteUrl()}/ar` },
  },
};

export default async function ArabicHomePage() {
  const dict = getDictionary("ar");
  const [stats, analytics, communities, heroImage] = await Promise.all([
    getSiteStats(),
    getCatalogAnalytics(),
    getCommunities(),
    getHeroImage(),
  ]);
  const topAreas = communities.slice(0, 6);

  return (
    <PageShell headerVariant="transparent">
      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-dark text-white">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-24 md:px-8 md:py-32">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-light">
            {dict.home.heroEyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight md:text-6xl">
            {dict.home.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            {interpolate(dict.home.heroSubtitle, {
              unitCount: stats.unitCount.toLocaleString(),
              projectCount: stats.projectCount.toLocaleString(),
            })}
          </p>
          <div className="mt-8">
            <HeroSearch
              locale="ar"
              placeholder={dict.serp.filters.searchPlaceholder}
              searchLabel={dict.serp.filters.search}
              popularLabel="الأكثر بحثاً:"
              quickFilters={[
                { label: "شقق", href: "/projects?type=apartment" },
                { label: "فلل", href: "/projects?type=villa" },
                { label: "إعمار", href: "/developers/emaar-properties" },
                { label: "قرية جميرا الدائرية", href: "/communities/jumeirah-village-circle" },
                { label: "أقل من مليون درهم", href: "/projects?maxP=1000000" },
              ]}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href="/projects">
              {dict.home.browseAllProperties}
            </PrimaryButton>
            <LocaleLink
              href="/map"
              className="iop-btn-press focus-ring inline-flex items-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-text-dark"
            >
              {dict.home.openMap}
            </LocaleLink>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            {dict.home.statsEyebrow}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={dict.home.stats.unitOptions}
              value={stats.unitCount.toLocaleString()}
              hint={dict.home.stats.unitOptionsHint}
            />
            <StatCard
              label={dict.home.stats.brochurePdfs}
              value={analytics.brochureCount.toLocaleString()}
              hint={dict.home.stats.brochurePdfsHint}
            />
            <StatCard
              label={dict.home.stats.mapReadyProjects}
              value={analytics.withCoords.toLocaleString()}
              hint={dict.home.stats.mapReadyProjectsHint}
            />
            <StatCard
              label={dict.home.stats.avgPpsf}
              value={analytics.avgPpsf ? analytics.avgPpsf.toLocaleString() : "—"}
              hint={dict.home.stats.avgPpsfHint}
            />
          </div>
        </div>
      </section>

      {/* Key locations */}
      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-3xl font-semibold text-text-dark">
              {dict.home.keyLocationsHeading}
            </h2>
            <LocaleLink
              href="/ar/communities"
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              {dict.home.viewAllLocations}
            </LocaleLink>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topAreas.map((area) => (
              <LocaleLink
                key={area.slug}
                href={`/ar/communities/${area.slug}`}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
              >
                <p className="text-lg font-semibold text-text-dark">{area.name}</p>
                <p className="mt-2 text-sm text-muted">
                  {interpolate(dict.home.areaMeta, {
                    city: area.cityLabel,
                    count: area.projectCount,
                  })}
                </p>
                <p className="mt-3 text-sm font-semibold text-brand">
                  {dict.home.exploreArea}
                </p>
              </LocaleLink>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation CTA */}
      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
          <h2 className="font-display max-w-xl text-3xl font-semibold md:text-4xl">
            {dict.home.consultationHeading}
          </h2>
          <PrimaryButton href="/ar/contact">
            {dict.home.bookConsultation}
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <p className="text-3xl font-semibold text-text-dark">{value}</p>
      <p className="mt-1 font-semibold text-brand">{label}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
