import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { HeroSearch } from "@/components/hero-search";
import { PrimaryButton } from "@/components/ui/primary-button";
import { HomeFeaturedGrid } from "@/components/home-featured-grid";
import { CountUp } from "@/components/count-up";
import { HomeYields } from "@/components/home-yields";
import { DeveloperLogo } from "@/components/developer-logo";
import {
  getFeaturedProjects,
  getLatestLaunches,
  getSiteStats,
  getDevelopers,
} from "@/lib/catalog";
import { getCommunities, getCommunityImage } from "@/lib/communities";
import { unoptimizedProp } from "@/lib/asset-image";
import { getCatalogApi } from "@/lib/catalog";
import { getTopCoveredAreas } from "@/lib/area-compare";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: { absolute: "Off-Plan Properties for Sale in Dubai & the UAE | invest off-plan" },
  description:
    "Off-plan properties for sale in Dubai & the UAE — unit-level prices, floor plans, payment plans, developer brochures, compare tools, and live DLD market data.",
  alternates: {
    canonical: getSiteUrl(),
    languages: { en: getSiteUrl() || "/", ar: `${getSiteUrl()}/ar` },
  },
};

const PROPERTY_TYPE_DEFS = [
  { key: "apartment", label: "Apartments" },
  { key: "townhouse", label: "Townhouses" },
  { key: "villa", label: "Villas" },
  { key: "penthouse", label: "Penthouses" },
] as const;

interface Highlight {
  value: string;
  sub: string;
  image: string;
  body?: string;
}

const STATIC_HIGHLIGHTS: Highlight[] = [
  {
    value: "10 Years",
    sub: "Golden Visa eligibility",
    image: "/images/joud-residence.jpg",
  },
  {
    value: "80/20",
    sub: "Flexible payment plans",
    image: "/images/skyline-terraces.jpg",
  },
];

/** Compact AED for chip labels — 512000 → "AED 512K", 1250000 → "AED 1.25M". */
function formatCompactAed(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `AED ${m >= 10 ? Math.round(m) : Number(m.toFixed(2))}M`;
  }
  return `AED ${Math.round(value / 1_000)}K`;
}

const FAQS = [
  {
    q: "What is an off-plan property?",
    a: "An off-plan property is purchased before construction is complete, often with staged payment plans tied to construction milestones.",
  },
  {
    q: "How do payment plans work?",
    a: "Most UAE off-plan projects offer plans such as 20/80, 40/60, or 60/40 — a deposit on booking with the balance during construction and on handover.",
  },
  {
    q: "Can I compare multiple units?",
    a: "Yes. Select up to three units on any search results page and open the compare view for side-by-side pricing, handover, and brochure status.",
  },
];

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "invest off-plan",
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/brand/icon-red.png`,
  description:
    "UAE off-plan property intelligence platform with unit-level pricing, brochures, and compare tools.",
};

export default async function HomePage() {
  const stats = await getSiteStats();
  const analytics = await getCatalogAnalytics();
  const featured = await getFeaturedProjects(6);
  const latest = await getLatestLaunches(4, featured.map((p) => p.slug));
  const topAreas = (await getCommunities()).slice(0, 6);
  const areaImages = await Promise.all(topAreas.map((c) => getCommunityImage(c.slug)));
  const topDevelopers = (await getDevelopers()).slice(0, 8);
  const topYieldAreas = await getTopCoveredAreas("yield", 6);
  const heroImage = featured[0]?.imageUrl;

  // Priced property-type entry points — cheapest launch price per type, so the
  // chips are navigable shortcuts into /projects?type=…, not decoration.
  const catalogApi = await getCatalogApi();
  const propertyTypeTiles = PROPERTY_TYPE_DEFS.map((t) => {
    let minPriceAed = Infinity;
    let count = 0;
    for (const project of catalogApi.projects) {
      const typeUnits = project.units.filter((u) =>
        u.propertyType.toLowerCase().includes(t.key),
      );
      if (typeUnits.length === 0) continue;
      count += 1;
      for (const u of typeUnits) {
        // skip price-on-request units (launchPriceAed 0) so "from" is a real floor
        if (u.launchPriceAed > 0 && u.launchPriceAed < minPriceAed) {
          minPriceAed = u.launchPriceAed;
        }
      }
    }
    return {
      label: t.label,
      href: `/projects?type=${t.key}`,
      minPriceAed: Number.isFinite(minPriceAed) ? minPriceAed : null,
      count,
    };
  }).filter((t) => t.count > 0);

  // Verified top-community gross yield for the highlights card — same sanitized
  // DLD source HomeYields renders (getTopCoveredAreas → getAreaStats), never a
  // hardcoded marketing number.
  const topYield = topYieldAreas[0];
  const topYieldPct = topYield?.stats.grossYieldPct ?? null;
  const topYieldName = topYield?.area.name.split(",")[0]?.trim() ?? null;
  const highlights: Highlight[] = [
    ...(topYieldPct != null && topYieldName
      ? [
          {
            value: `${topYieldPct.toFixed(1)}%`,
            sub: "Top community gross yield",
            body: `${topYieldName} posted the highest gross rental yield on 2025 Dubai Land Department transactions among covered communities.`,
            image: "/images/creek-orchard.jpg",
          },
        ]
      : []),
    ...STATIC_HIGHLIGHTS,
  ];

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <section className="relative flex min-h-[min(100dvh,880px)] flex-col justify-end overflow-hidden bg-surface-dark text-white">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            priority
            fetchPriority="high"
            sizes="100vw"
            {...unoptimizedProp(heroImage)}
          />
        ) : null}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
          <p className="reveal text-sm font-medium text-white/80">
            UAE off-plan intelligence for serious buyers
          </p>
          <h1 className="font-display reveal mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] [text-shadow:0_1px_2px_rgba(0,0,0,0.8),0_2px_10px_rgba(0,0,0,0.65),0_4px_28px_rgba(0,0,0,0.5)]">
            UAE&apos;s{" "}
            <em className="italic text-brand-light">Premier</em>{" "}
            Off&#8209;Plan{" "}
            <em className="italic text-brand-light">Investment</em>{" "}
            Platform<span className="text-brand-light">.</span>
          </h1>
          <p className="prose-balance reveal mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            {stats.unitCount.toLocaleString()} unit options across{" "}
            {stats.projectCount.toLocaleString()} projects — brochures, price per
            sqft, compare, and a live map in one place.
          </p>
          <div className="reveal mt-8">
            <HeroSearch />
          </div>
          <div className="reveal mt-4 flex flex-wrap gap-3">
            <PrimaryButton href="/projects">Browse all properties</PrimaryButton>
            <PrimaryButton href="/map" variant="ghost" showArrow={false}>
              Open map
            </PrimaryButton>
          </div>
          <div
            data-testid="hero-stat-strip"
            className="reveal mt-10 flex min-h-[56px] flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-5"
          >
            {[
              { label: "Unit options", value: stats.unitCount },
              { label: "Projects", value: stats.projectCount },
              { label: "Brochure PDFs", value: analytics.brochureCount },
            ].map((item) => (
              <div key={item.label} className="min-h-[52px]">
                <p className="font-display text-2xl font-semibold tabular-nums leading-none text-white md:text-3xl">
                  <CountUp value={item.value} />
                </p>
                <p className="mt-1 text-xs font-medium text-white/85">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b border-border bg-white py-5 marquee-mask">
        <div className="relative flex items-center gap-14">
          <div className="flex animate-[marquee_40s_linear_infinite] items-center gap-14 whitespace-nowrap hover:[animation-play-state:paused]">
            {[...topDevelopers, ...topDevelopers].map((dev, i) => (
              <LocaleLink
                key={`${dev.slug}-${i}`}
                href={`/developers/${dev.slug}`}
                className="flex shrink-0 items-center gap-3 opacity-70 transition hover:opacity-100"
              >
                <DeveloperLogo
                  name={dev.name}
                  logoUrl={dev.logoUrl}
                  slug={dev.slug}
                  size="sm"
                  className="border border-border"
                />
                <span className="text-lg font-bold tracking-tight text-surface-dark">
                  {dev.name}
                </span>
              </LocaleLink>
            ))}
          </div>
        </div>
      </section>

      <HomeFeaturedGrid latest={latest} featured={featured} />

      <HomeYields areas={topYieldAreas} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
              Key <em className="italic">Locations.</em>
            </h2>
            <LocaleLink
              href="/communities"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              View All Communities →
            </LocaleLink>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topAreas.map((area, index) => {
              const areaImage = areaImages[index];
              return (
                <LocaleLink
                  key={area.slug}
                  href={`/communities/${area.slug}`}
                  className="iop-btn-press focus-ring group relative flex min-h-[240px] flex-col justify-end overflow-hidden rounded-2xl border border-border shadow-elevation-sm transition hover:-translate-y-0.5 hover:shadow-elevation-md"
                >
                  {areaImage ? (
                    <Image
                      src={areaImage}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
                      {...unoptimizedProp(areaImage)}
                    />
                  ) : (
                    <div className="area-card-accent absolute inset-0" />
                  )}
                  <div className="card-photo-overlay absolute inset-0" />
                  <div className="relative p-6 text-white">
                    <span className="font-display text-4xl font-semibold italic leading-none text-white/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-3 text-xl font-semibold">{area.name}</p>
                    <p className="mt-1 text-sm text-white/80">
                      {area.cityLabel} · {area.projectCount} projects
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-light">
                      Explore community
                      <span className="transition group-hover:translate-x-0.5" aria-hidden>→</span>
                    </span>
                  </div>
                </LocaleLink>
              );
            })}
          </div>
          {propertyTypeTiles.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-muted">Browse by type:</span>
              {propertyTypeTiles.map((type) => (
                <LocaleLink
                  key={type.label}
                  href={type.href}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-dark shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand"
                >
                  {type.label}
                  {type.minPriceAed ? (
                    <span className="font-normal text-muted">
                      from {formatCompactAed(type.minPriceAed)}
                    </span>
                  ) : (
                    <span className="font-normal text-muted">{type.count} projects</span>
                  )}
                </LocaleLink>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Investment Highlights — image-backed stat cards (Figma) */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="text-center font-display text-3xl font-semibold text-text-dark md:text-4xl">
            Investment <em className="italic">Highlights</em>
            <span className="text-brand">.</span>
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={`${item.value}-${item.sub}`}
                className="flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-border shadow-elevation-sm"
              >
                <div className="relative flex flex-1 flex-col justify-end overflow-hidden">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover"
                    {...unoptimizedProp(item.image)}
                  />
                  <div className="card-photo-overlay absolute inset-0" />
                  <div className="relative p-6 text-white">
                    <p className="font-display text-4xl font-semibold leading-none md:text-5xl">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/90">{item.sub}</p>
                  </div>
                </div>
                {item.body ? (
                  <p className="bg-brand p-6 text-sm leading-relaxed text-white">
                    {item.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
            Frequently <em className="italic">Asked Questions.</em>
          </h2>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildFaqPageJsonLd(FAQS)),
            }}
          />
          <div className="mt-8">
            <FaqAccordion faqs={FAQS} />
          </div>
          <p className="mt-6 text-sm text-muted">
            More questions?{" "}
            <LocaleLink href="/faq" className="font-semibold text-brand hover:text-brand-dark">
              Browse the full FAQ →
            </LocaleLink>
          </p>
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Book a Consultation<br />
            <em className="italic">with an Off&#8209;Plan Expert.</em>
          </h2>
          <p className="mt-3 max-w-xl text-white/80">
            Leave your contact details to register your interest in launches,
            brochures, and payment plans.
          </p>
          <PrimaryButton href="/contact" className="mt-6">
            Book a consultation
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}

