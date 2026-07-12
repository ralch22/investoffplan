import Image from "next/image";
import { LocaleLink } from "@/components/locale-link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { communitySlugFor } from "@/lib/community-slug";
import { ProjectAbout } from "@/components/project-about";
import { ProjectKeyFacts } from "@/components/project-key-facts";
import { ProjectLocationSection } from "@/components/project-location-section";
import { ProjectTimeline } from "@/components/project-timeline";
import { ProjectUnitRanges } from "@/components/project-unit-ranges";
import { ProjectDetailCtas } from "@/components/project-detail-ctas";
import { ProjectDetailFavorite } from "@/components/project-detail-favorite";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DeveloperAttribution } from "@/components/developer-attribution";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { ProjectPaymentCalculator } from "@/components/project-payment-calculator";
import { ProjectDetailNav } from "@/components/project-detail-nav";
import { SectionViewTracker } from "@/components/section-view-tracker";
import { ProjectSummaryRail } from "@/components/project-summary-rail";
import { Price, PricePerSqft } from "@/components/currency-price";
import { PROJECT_DETAIL_SECTIONS } from "@/lib/project-detail-sections";
import { ProjectUnitsTable } from "@/components/project-units-table";
import { ProjectMedia } from "@/components/project-media";
import { isEmbeddableVideo } from "@/lib/media";
import { ShareButton } from "@/components/share-button";
import { getProjectBySlug, slugify } from "@/lib/catalog";
import { shouldNoindexProject } from "@/lib/catalog-core";
import { getAreaInsightsForProject } from "@/lib/area-insights";
import { ProjectLivingInArea } from "@/components/project-living-in-area";
import { ProjectMasterplan } from "@/components/project-masterplan";
import { ProjectFloorPlans } from "@/components/project-floor-plans";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildProjectFaqs } from "@/lib/project-faqs";
import { ProjectGallery } from "@/components/project-gallery";
import { normalizeGalleryUrls } from "@/lib/project-gallery-images";
import { getEnrichment } from "@/lib/enrichments";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import { getProjectComparisonLinks } from "@/lib/project-compare";
import {
  cityLabel,
} from "@/lib/format";
import { stripTrailingDeveloper } from "@/lib/developer-utils";
import {
  buildFactualSummary,
  hasSubstantialProjectCopy,
} from "@/lib/project-factual-summary";
import { hasPaymentPlan, unitPricePerSqft } from "@/lib/investment-metrics";
import { getSiteUrl } from "@/lib/site-url";
import {
  buildProjectBreadcrumbJsonLd,
  buildProjectJsonLd,
  buildVideoObjectJsonLd,
} from "@/lib/project-json-ld";
import { unoptimizedProp } from "@/lib/asset-image";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  /** Set to "ar" by the /ar mirror so page chrome + child labels localize. */
  locale?: Locale;
}

import { getCatalogApi } from "@/lib/catalog";

// The catalog is fully baked at build time, so an unknown slug is a real 404 —
// without this, unknown /projects/<slug> soft-404s (HTTP 200 "Project not found").
export const dynamicParams = false;

export async function generateStaticParams() {
  const api = await getCatalogApi();
  return api.projects.map((project) => ({ slug: project.slug }));
}

function stripHtml(html?: string): string | undefined {
  if (!html) return undefined;
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  const minPriceMeta = Math.min(...project.units.map((u) => u.launchPriceAed).filter((v) => v > 0));
  // Clean composition: PF names often end "By {developer}" (doubling), the
  // raw area string contains the project name, and project.city is the
  // lowercase slug — Google snippets showed "…By Object 1 by Object 1 in …,
  // 1WOOD Residence, dubai".
  const metaName = stripTrailingDeveloper(project.name, project.developer);
  const metaArea = project.area.split(",")[0].trim();
  const description = [
    `${metaName} by ${project.developer} in ${metaArea}, ${cityLabel(project.city)}`,
    Number.isFinite(minPriceMeta) ? `from AED ${minPriceMeta.toLocaleString("en-US")}` : "",
    project.handover ? `handover ${project.handover}` : "",
    hasPaymentPlan(project.paymentPlan)
      ? `${project.paymentPlan.trim()} payment plan`
      : "",
    "floor plans + brochure.",
  ]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 158);

  // Keyword-rich title: project name (strong navigational demand) + "off-plan"
  // (category) + community/city (location). Front-loaded so it survives SERP
  // truncation; brand suffix dropped here since Google appends the site name.
  const areaName = project.area.split(",")[0].trim();
  const cityName = cityLabel(project.city);
  const hasDistinctArea =
    Boolean(areaName) && areaName.toLowerCase() !== cityName.toLowerCase();
  const locBit = hasDistinctArea ? `${areaName}, ${cityName}` : cityName;

  // Duplicate-title disambiguation: two DIFFERENT projects can share the same
  // (name, area, city) — e.g. the Arthouse Residences twins (Cledor + Aviaan) —
  // and would render byte-identical titles. Only when a genuine collision
  // exists do we append the developer, so the ~768 non-colliding titles stay
  // unchanged. Developer is already correctly cased ("Arada") by normalizeProject.
  const api = await getCatalogApi();
  const collisionKey = (p: (typeof api.projects)[number]) =>
    `${p.name.trim().toLowerCase()}|${p.area.split(",")[0].trim().toLowerCase()}|${p.city}`;
  const thisKey = collisionKey(project);
  const isCollision =
    api.projects.filter((p) => collisionKey(p) === thisKey).length > 1;
  const nameBit = isCollision
    ? `${project.name} by ${project.developer}`
    : project.name;

  // Sold-out projects (212 of them) must NOT be framed as "Off-Plan". Prefer a
  // "Sold Out in {loc}" frame when it fits the length budget; otherwise a plain
  // "{name} — {loc}". Off-plan/ready projects keep the "Off-Plan in" frame.
  const SEO_TITLE_MAX = 60;
  const isSoldOut = project.status === "sold-out";
  const compose = (loc: string): string => {
    if (isSoldOut) {
      const framed = `${nameBit} — Sold Out in ${loc}`;
      return framed.length <= SEO_TITLE_MAX ? framed : `${nameBit} — ${loc}`;
    }
    return `${nameBit} — Off-Plan in ${loc}`;
  };
  // Length: if the full "{area}, {city}" title overflows, drop the city and
  // keep the (more specific) area; if it still overflows (e.g. a long developer
  // appended on a collision), drop the location clause entirely rather than
  // leave a dangling "— Off-"; hard-trim only as the true last resort so the
  // name is never butchered.
  let seoTitle = compose(locBit);
  if (seoTitle.length > SEO_TITLE_MAX && hasDistinctArea) {
    seoTitle = compose(areaName);
  }
  if (seoTitle.length > SEO_TITLE_MAX && nameBit.length <= SEO_TITLE_MAX) {
    seoTitle = nameBit;
  }
  if (seoTitle.length > SEO_TITLE_MAX) {
    seoTitle = seoTitle.slice(0, SEO_TITLE_MAX).trimEnd();
  }

  return {
    title: { absolute: seoTitle },
    description,
    // PF placeholder marketing names (slug new-project-by-*) keep a soft title
    // but stay noindex until a real name lands in the scrape.
    ...(shouldNoindexProject(project)
      ? { robots: { index: false, follow: true } }
      : {}),
    alternates: {
      canonical: `${getSiteUrl()}/projects/${slug}`,
      languages: {
        "x-default": `${getSiteUrl()}/projects/${slug}`,
        en: `${getSiteUrl()}/projects/${slug}`,
        ar: `${getSiteUrl()}/ar/projects/${slug}`,
      },
    },
    openGraph: {
      title: seoTitle,
      description,
      type: "website",
      url: `${getSiteUrl()}/projects/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
    },
  };
}

export default async function ProjectDetailPage({
  params,
  locale = "en",
}: PageProps) {
  const dict = getDictionary(locale);
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const enrichment = getEnrichment(slug);
  const dldStats = getAreaStats(project.area);
  const dldSource = getDldSource();
  const pfFaqs = project.pfFaqs ?? [];
  // Stated prices only — 8 live projects carry 0-price units and rendered
  // "FROM AED 0" in the hero, key facts, sticky bar, and JSON-LD offers.
  const pricedUnits = project.units.filter((u) => u.launchPriceAed > 0);
  const minPrice = pricedUnits.length
    ? Math.min(...pricedUnits.map((u) => u.launchPriceAed))
    : 0;
  // UAE grants a 10-year Golden Visa for property investment >= AED 2M.
  const goldenVisaEligible = project.units.some((u) => u.launchPriceAed >= 2_000_000);
  const projectCompareLinks = await getProjectComparisonLinks(project);
  const catalogGallery =
    project.imageGallery?.length
      ? project.imageGallery
      : project.imageUrl
        ? [project.imageUrl]
        : [];
  // Append enrichment-discovered images (issue #37); catalog photos lead so the
  // hero stays a first-party image. ProjectGallery dedupes downstream. External
  // enrichment URLs are hotlinked (unoptimized) — never proxied — see asset-image.ts.
  // Drop PF walkthrough video paths that cannot render as <img>.
  const enrichmentImages = Array.isArray(enrichment?.images) ? enrichment.images : [];
  const gallery = normalizeGalleryUrls([...catalogGallery, ...enrichmentImages]);
  const mapUrl = project.coordinates
    ? `https://www.google.com/maps?q=${project.coordinates.lat},${project.coordinates.lng}`
    : null;
  const api = await getCatalogApi();
  // Genuinely-related projects: same community first, then same city by price
  // proximity — not the alphabetical catalog head (which showed the identical
  // three cards on every PDP).
  const projectMinPrice = Math.min(
    ...project.units.map((u) => u.launchPriceAed).filter((v) => v > 0),
  );
  const community = communitySlugFor(project.area);
  const priceDistance = (p: (typeof api.projects)[number]) => {
    const min = Math.min(...p.units.map((u) => u.launchPriceAed).filter((v) => v > 0));
    if (!Number.isFinite(min) || !Number.isFinite(projectMinPrice)) return Infinity;
    return Math.abs(min - projectMinPrice);
  };
  const candidates = api.projects.filter((p) => p.slug !== slug && p.city === project.city);
  const sameCommunity = candidates
    .filter((p) => communitySlugFor(p.area) === community)
    .sort((a, b) => priceDistance(a) - priceDistance(b));
  const sameCity = candidates
    .filter((p) => communitySlugFor(p.area) !== community)
    .sort((a, b) => priceDistance(a) - priceDistance(b));
  const related = [...sameCommunity, ...sameCity].slice(0, 3);
  const areaInsights = await getAreaInsightsForProject(slugify(project.area));
  const projectFaqs = buildProjectFaqs(project, locale);

  const siteUrl = getSiteUrl();
  const projectUrl = `${siteUrl}${localePath(locale, `/projects/${slug}`)}`;
  const description =
    stripHtml(project.descriptionUnique ?? "")?.slice(0, 300) ||
    enrichment?.summary ||
    stripHtml(project.description)?.slice(0, 300) ||
    `${project.name} by ${project.developer} in ${project.area}.`;

  const jsonLd = buildProjectJsonLd({
    project,
    projectUrl,
    siteUrl,
    minPrice,
    description,
    gallery,
  });

  const breadcrumbLd = buildProjectBreadcrumbJsonLd({
    projectName: project.name,
    projectUrl,
    siteUrl,
    homeName: dict.common.home,
    projectsName: dict.nav.projects,
    homeUrl: `${siteUrl}${localePath(locale, "/")}`,
    projectsUrl: `${siteUrl}${localePath(locale, "/projects")}`,
  });

  const enrichmentAmenities = Array.isArray(enrichment?.facts?.amenities)
    ? (enrichment.facts.amenities as string[])
    : [];
  const amenities = project.amenities ?? enrichmentAmenities;

  // Thin-PDP fallback: no-copy / junk-HTML projects would render empty About
  // and stay thin/indexable. Compose a FACTUAL, verified-claims-only summary
  // from stated catalog fields ONLY when richer sources are absent (plain-text
  // gate — empty `<p><br></p>` shells do not count as real copy).
  const factualAbout =
    !hasSubstantialProjectCopy(project) && !enrichment?.summary?.trim()
      ? buildFactualSummary(project, locale)
      : undefined;

  const heroImage = gallery[0];
  const resolvedVideoUrl = project.videoUrl ?? enrichment?.videoUrl ?? null;
  const absoluteHero = heroImage
    ? heroImage.startsWith("http")
      ? heroImage
      : `${siteUrl}${heroImage.startsWith("/") ? "" : "/"}${heroImage}`
    : undefined;
  const videoLd = buildVideoObjectJsonLd({
    videoUrl: resolvedVideoUrl,
    name: `${project.name} — video walkthrough`,
    description:
      description ??
      `${stripTrailingDeveloper(project.name, project.developer)} by ${project.developer} in ${project.area.split(",")[0].trim()}.`,
    thumbnailUrl: absoluteHero,
    uploadDate: enrichment?.enrichedAt ?? project.salesStartDate ?? "2025-01-01",
  });
  const additionalPhotoCount = heroImage
    ? [...new Set(gallery.filter(Boolean))].filter((src) => src !== heroImage).length
    : gallery.length;

  const firstUnitPpsf = project.units[0]
    ? unitPricePerSqft({ project, unit: project.units[0] })
    : null;

  const detailSections = PROJECT_DETAIL_SECTIONS.filter((section) => {
    if (section.id === "masterplan") return Boolean(project.masterPlanUrl);
    if (section.id === "floor-plans") return (project.floorPlans?.length ?? 0) > 0;
    if (section.id === "media")
      return isEmbeddableVideo(resolvedVideoUrl) || Boolean(enrichment?.virtualTourUrl);
    if (section.id === "living-in-area") return Boolean(areaInsights);
    if (section.id === "related") return related.length > 0;
    return true;
  });

  return (
    <PageShell headerVariant="transparent" mobileDock="cta" showCurrency>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {videoLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
        />
      ) : null}
      <section className="relative overflow-hidden bg-surface-dark text-white">
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
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${project.imageGradient}`} />
        )}
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="relative mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
          <LocaleLink href="/projects" className="text-sm text-white/80 hover:text-white">
            {dict.pdp.hero.backToProjects}
          </LocaleLink>
          <h1 className="font-display mt-6 text-4xl font-semibold md:text-5xl">
            {(() => {
              const words = project.name.split(" ");
              const lastWord = words.pop();
              const restWords = words.join(" ");
              return restWords ? (
                <>
                  {restWords} <em className="italic">{lastWord}.</em>
                </>
              ) : (
                project.name
              );
            })()}
          </h1>
          <p className="mt-2 text-white/85">
            {cityLabel(project.city)}, {dict.pdp.hero.country}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              {
                label: dict.pdp.hero.statFrom,
                value: <Price aed={minPrice} fallback={dict.pdp.priceOnRequest} />,
                show: true,
              },
              {
                label: dict.pdp.hero.statPayment,
                value: project.paymentPlan.trim(),
                show: hasPaymentPlan(project.paymentPlan),
              },
              {
                label: dict.pdp.hero.statUnits,
                value: String(project.unitCount),
                show: true,
              },
              {
                label: dict.pdp.hero.statType,
                value: project.units[0]?.propertyType ?? dict.pdp.hero.apartment,
                show: true,
              },
            ]
              .filter((stat) => stat.show)
              .map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                <p className="mt-1 font-semibold">{stat.value}</p>
              </div>
            ))}
            {additionalPhotoCount > 0 ? (
              <a
                href="#project-gallery"
                className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                {interpolate(dict.pdp.hero.photos, { count: additionalPhotoCount })}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* PageShell owns the single <main> landmark — avoid nested mains (WCAG 1.3.1). */}
      <section className="mx-auto max-w-[1200px] px-5 py-8 pb-28 md:px-8 md:pb-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.projects, href: "/projects" },
            { label: project.name },
          ]}
        />
        <div className="mt-4">
          <ProjectDetailNav sections={detailSections} />
        </div>
        <SectionViewTracker sections={detailSections.map((section) => section.id)} />

        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <div className="min-w-0">
        <div id="overview">
        <ProjectGallery
          images={gallery}
          alt={project.name}
          excludeUrls={heroImage ? [heroImage] : []}
          fallbackClassName={`bg-gradient-to-br ${project.imageGradient}`}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-text-dark md:text-3xl">
                {project.name}
              </h2>
              {project.isPremium ? (
                <span className="rounded-[5px] bg-accent-red px-2.5 py-1 text-xs font-semibold uppercase text-white">
                  {dict.common.premium}
                </span>
              ) : null}
              {project.status === "sold-out" ? (
                <span className="rounded-[5px] bg-surface-dark px-2.5 py-1 text-xs font-semibold uppercase text-white">
                  {dict.common.soldOut}
                </span>
              ) : null}
            </div>
            <DeveloperAttribution
              name={project.developer}
              logoUrl={project.developerLogo}
              suffix={` · ${cityLabel(project.city)}, ${project.area}`}
              uppercase={false}
              className="mt-2"
            />
            <div className="mt-1 flex flex-wrap gap-4">
              {project.coordinates ? (
                <LocaleLink
                  href={`/map?project=${slug}`}
                  className="text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  {dict.pdp.viewOnProjectMap}
                </LocaleLink>
              ) : null}
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  {dict.pdp.googleMaps}
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ShareButton title={project.name} />
            <ProjectDetailFavorite slug={slug} />
          </div>
        </div>

        <p className="mt-4 text-2xl font-semibold text-brand">
          {minPrice > 0 ? (
            <>{dict.pdp.fromUpper} <Price aed={minPrice} /></>
          ) : (
            dict.pdp.priceOnRequestUpper
          )}
          {firstUnitPpsf ? (
            <span className="ms-3 text-base font-medium text-muted">
              · <PricePerSqft aed={firstUnitPpsf} />
            </span>
          ) : null}
        </p>

        {goldenVisaEligible ? (
          <LocaleLink
            href="/faq/golden-visa"
            className="iop-btn-press focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-muted px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z" />
            </svg>
            {dict.pdp.goldenVisa}
          </LocaleLink>
        ) : null}

        <ProjectDetailCtas
          projectName={project.name}
          projectSlug={project.slug}
          whatsapp={project.whatsapp}
          brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
          videoUrl={project.videoUrl ?? enrichment?.videoUrl}
          virtualTourUrl={enrichment?.virtualTourUrl}
        />



        <div id="key-facts" className="scroll-mt-24">
          <ProjectKeyFacts project={project} locale={locale} />
          <ProjectTimeline project={project} />
        </div>

        <ProjectAbout
          enrichment={enrichment}
          brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
          videoUrl={project.videoUrl ?? enrichment?.videoUrl}
          description={project.descriptionUnique ?? project.description}
          amenities={amenities}
          locale={locale}
          factualFallback={factualAbout}
        />

        <ProjectUnitRanges units={project.units} locale={locale} />

        <ProjectMasterplan project={project} />

        <ProjectFloorPlans project={project} locale={locale} />
        </div>

        {areaInsights ? <ProjectLivingInArea insights={areaInsights} locale={locale} /> : null}

        <ProjectLocationSection project={project} locale={locale} />

        <div id="calculator" className="mt-10 scroll-mt-24">
          <ProjectPaymentCalculator project={project} />
          <p className="mt-4 text-sm text-muted">
            {dict.pdp.financingQuestion}{" "}
            <LocaleLink
              href="/tools/mortgage"
              className="font-semibold text-brand hover:text-brand-dark"
            >
              {dict.pdp.modelMortgage}
            </LocaleLink>
          </p>
        </div>

        <section id="units" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-dark">{dict.pdp.unitTypes}</h2>
          <ProjectUnitsTable units={project.units} project={project} locale={locale} />
        </section>

        <ProjectMedia
          videoUrl={project.videoUrl ?? enrichment?.videoUrl}
          virtualTourUrl={enrichment?.virtualTourUrl}
          projectName={project.name}
        />

        {dldStats ? (
          <div id="market-data" className="mt-4 scroll-mt-24">
            <DldAreaStatsBand
              stats={dldStats}
              areaName={project.area.split(",")[0]}
              source={dldSource.source}
              locale={locale}
            />
          </div>
        ) : null}

        {projectCompareLinks.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-dark">{interpolate(dict.pdp.compareWith, { name: project.name })}</span>
            {projectCompareLinks.map((c) => (
              <LocaleLink
                key={c.pairSlug}
                href={`/compare-projects/${c.pairSlug}`}
                className="iop-btn-press focus-ring rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-text-dark transition hover:border-brand hover:text-brand"
              >
                {c.otherName}
              </LocaleLink>
            ))}
          </div>
        ) : null}

        {projectFaqs.length > 0 ? (
          <section id="project-faq" className="mt-12 scroll-mt-24">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(buildFaqPageJsonLd(projectFaqs)),
              }}
            />
            <h2 className="text-xl font-semibold text-text-dark">
              {interpolate(dict.pdp.faqHeading, { name: project.name })}
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={projectFaqs} />
            </div>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section id="related" className="mt-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-text-dark">
              {interpolate(dict.pdp.moreInCity, { city: cityLabel(project.city) })}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ShowcaseProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        ) : null}
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24">
            <ProjectSummaryRail
              projectName={project.name}
              projectSlug={project.slug}
              minPriceAed={minPrice}
              pricePerSqftAed={firstUnitPpsf}
              paymentPlan={project.paymentPlan}
              unitCount={project.unitCount}
              handover={project.handover ?? dict.pdp.keyFacts.toBeAnnounced}
              whatsapp={project.whatsapp}
              brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
            />
          </aside>
        </div>
      </section>
    </PageShell>
  );
}