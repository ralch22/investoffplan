import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import { PageShell } from "@/components/page-shell";
import { HeroSearch } from "@/components/hero-search";
import { PrimaryButton } from "@/components/ui/primary-button";
import { HomeFeaturedGrid } from "@/components/home-featured-grid";
import { CountUp } from "@/components/count-up";
import { HomeYields } from "@/components/home-yields";
import { MarketPulseBand } from "@/components/market-pulse-band";
import { DeveloperLogo } from "@/components/developer-logo";
import {
  getFeaturedProjects,
  getLatestLaunches,
  getSiteStats,
  getDevelopers,
  getCatalogApi,
} from "@/lib/catalog";
import { getCommunities, getCommunityImage } from "@/lib/communities";
import { unoptimizedProp } from "@/lib/asset-image";
import { getTopCoveredAreas } from "@/lib/area-compare";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { getCatalogAnalytics } from "@/lib/catalog-analytics";
import { getSiteUrl } from "@/lib/site-url";
import { getDictionary, interpolate, type Locale } from "@/i18n";
import { waHref, WHATSAPP_PRIMARY } from "@/lib/contact-info";

// Cheapest-launch entry points per type — chips are navigable shortcuts into
// /projects?type=…, priced from real inventory, not decoration.
const PROPERTY_TYPE_DEFS = [
  { key: "apartment", dictKey: "apartments" },
  { key: "townhouse", dictKey: "townhouses" },
  { key: "villa", dictKey: "villas" },
  { key: "penthouse", dictKey: "penthouses" },
] as const;

interface Highlight {
  value: string;
  sub: string;
  image: string;
  body?: string;
}

/** Compact AED for chip labels — 512000 → "AED 512K", 1250000 → "AED 1.25M". */
function formatCompactAed(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `AED ${m >= 10 ? Math.round(m) : Number(m.toFixed(2))}M`;
  }
  return `AED ${Math.round(value / 1_000)}K`;
}

/**
 * Locale-aware home body shared by the EN route and the AR (/ar) route so the
 * two homes never drift. Strings resolve from the dictionary; decorative italic
 * headings render as rich EN markup but plain (typographically correct) Arabic
 * for RTL. Data comes from the same catalog/DLD sources for both locales.
 */
export async function HomeBody({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const isEn = locale === "en";
  const quickFilters = [
    { label: dict.home.quickFilters.apartments, href: "/projects?type=apartment" },
    { label: dict.home.quickFilters.villas, href: "/projects?type=villa" },
    { label: dict.home.quickFilters.emaar, href: "/developers/emaar-properties" },
    { label: dict.home.quickFilters.jvc, href: "/communities/jumeirah-village-circle" },
    { label: dict.home.quickFilters.under1m, href: "/projects?maxP=1000000" },
  ];

  const stats = await getSiteStats();
  const analytics = await getCatalogAnalytics();
  const featured = await getFeaturedProjects(6);
  const latest = await getLatestLaunches(4, featured.map((p) => p.slug));
  const topAreas = (await getCommunities()).slice(0, 6);
  const areaImages = await Promise.all(topAreas.map((c) => getCommunityImage(c.slug)));
  const topDevelopers = (await getDevelopers()).slice(0, 8);
  const topYieldAreas = await getTopCoveredAreas("yield", 6);
  const heroImage = featured[0]?.imageUrl;

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
      label: dict.home.propertyTypes[t.dictKey],
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
            sub: dict.home.highlights.topYieldSub,
            body: interpolate(dict.home.highlights.topYieldBody, { name: topYieldName }),
            image: "/images/creek-orchard.jpg",
          },
        ]
      : []),
    {
      value: dict.home.highlights.goldenVisaValue,
      sub: dict.home.highlights.goldenVisaSub,
      image: "/images/joud-residence.jpg",
    },
    {
      value: dict.home.highlights.paymentValue,
      sub: dict.home.highlights.paymentSub,
      image: "/images/skyline-terraces.jpg",
    },
  ];

  const faqs = [
    { q: dict.home.faqs.q1, a: dict.home.faqs.a1 },
    { q: dict.home.faqs.q2, a: dict.home.faqs.a2 },
    { q: dict.home.faqs.q3, a: dict.home.faqs.a3 },
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

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Sole LCP candidate on home: one full-bleed hero with fetchpriority=high.
          Below-fold grids must not pass priorityImage (see HomeFeaturedGrid, #187).
          min-h reserves layout space so the fill image does not shift content (CLS). */}
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
            // Prefer higher quality when the optimizer runs; external/cdn
            // heroes set unoptimized and ignore this prop.
            quality={80}
            {...unoptimizedProp(heroImage)}
          />
        ) : null}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto w-full max-w-[1200px] px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
          <p className="reveal text-sm font-medium text-white/80">{dict.home.heroEyebrow}</p>
          <h1 className="font-display reveal mt-4 max-w-3xl text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em] [text-shadow:0_1px_2px_rgba(0,0,0,0.8),0_2px_10px_rgba(0,0,0,0.65),0_4px_28px_rgba(0,0,0,0.5)]">
            {isEn ? (
              <>
                UAE&apos;s{" "}
                <em className="italic text-brand-light">Premier</em>{" "}
                Off&#8209;Plan{" "}
                <em className="italic text-brand-light">Investment</em>{" "}
                Platform<span className="text-brand-light">.</span>
              </>
            ) : (
              dict.home.heroTitle
            )}
          </h1>
          <p className="prose-balance reveal mt-5 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">
            {interpolate(dict.home.heroSubtitle, {
              unitCount: stats.unitCount.toLocaleString(),
              projectCount: stats.projectCount.toLocaleString(),
            })}
          </p>
          <div className="reveal mt-8">
            <HeroSearch
              locale={locale}
              placeholder={dict.serp.filters.searchPlaceholder}
              searchLabel={dict.serp.filters.search}
              popularLabel={dict.home.popularLabel}
              quickFilters={quickFilters}
            />
          </div>
          <div className="reveal mt-4 flex flex-wrap gap-3">
            <PrimaryButton href="/projects">{dict.home.browseAllProperties}</PrimaryButton>
            <PrimaryButton href="/map" variant="ghost" showArrow={false}>
              {dict.home.openMap}
            </PrimaryButton>
            <a
              href={waHref(WHATSAPP_PRIMARY)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {dict.home.whatsapp}
            </a>
          </div>
          <div
            data-testid="hero-stat-strip"
            className="reveal mt-10 flex min-h-[56px] flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/15 pt-5"
          >
            {[
              { label: dict.home.stats.unitOptions, value: stats.unitCount },
              { label: dict.home.stats.projects, value: stats.projectCount },
              { label: dict.home.stats.brochurePdfs, value: analytics.brochureCount },
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

      <MarketPulseBand locale={locale} />

      <HomeFeaturedGrid latest={latest} featured={featured} />

      <HomeYields areas={topYieldAreas} locale={locale} />

      <section className="py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
              {isEn ? (
                <>
                  Key <em className="italic">Locations.</em>
                </>
              ) : (
                dict.home.keyLocationsHeading
              )}
            </h2>
            <LocaleLink
              href="/communities"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {dict.home.viewAllCommunities}
            </LocaleLink>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                      alt={area.name}
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
                      {interpolate(dict.home.areaMeta, {
                        city: area.cityLabel,
                        count: area.projectCount,
                      })}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-light">
                      {dict.home.exploreCommunity}
                      <span
                        className="transition group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                        aria-hidden
                      >
                        →
                      </span>
                    </span>
                  </div>
                </LocaleLink>
              );
            })}
          </div>
          {propertyTypeTiles.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-muted">{dict.home.browseByType}</span>
              {propertyTypeTiles.map((type) => (
                <LocaleLink
                  key={type.label}
                  href={type.href}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-dark shadow-elevation-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:text-brand"
                >
                  {type.label}
                  {type.minPriceAed ? (
                    <span className="font-normal text-muted">
                      {interpolate(dict.common.fromPrice, {
                        price: formatCompactAed(type.minPriceAed),
                      })}
                    </span>
                  ) : (
                    <span className="font-normal text-muted">
                      {interpolate(dict.home.projectsCount, { count: type.count })}
                    </span>
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
            {isEn ? (
              <>
                Investment <em className="italic">Highlights</em>
                <span className="text-brand">.</span>
              </>
            ) : (
              dict.home.investmentHighlightsHeading
            )}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                  <p className="bg-brand p-6 text-sm leading-relaxed text-white">{item.body}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-14">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold text-text-dark md:text-4xl">
            {isEn ? (
              <>
                Frequently <em className="italic">Asked Questions.</em>
              </>
            ) : (
              dict.home.faqHeading
            )}
          </h2>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildFaqPageJsonLd(faqs)),
            }}
          />
          <div className="mt-8">
            <FaqAccordion faqs={faqs} />
          </div>
          <p className="mt-6 text-sm text-muted">
            {dict.home.moreQuestions}{" "}
            <LocaleLink href="/faq" className="font-semibold text-brand hover:text-brand-dark">
              {dict.home.browseFullFaq}
            </LocaleLink>
          </p>
        </div>
      </section>

      <section className="bg-surface-darker py-16 text-white">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            {isEn ? (
              <>
                Book a Consultation<br />
                <em className="italic">with an Off&#8209;Plan Expert.</em>
              </>
            ) : (
              dict.home.consultationHeading
            )}
          </h2>
          <p className="mt-3 max-w-xl text-white/80">{dict.home.consultationBody}</p>
          <PrimaryButton href="/contact" className="mt-6">
            {dict.home.bookConsultation}
          </PrimaryButton>
        </div>
      </section>
    </PageShell>
  );
}
