import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
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
import { ProjectSummaryRail } from "@/components/project-summary-rail";
import { PROJECT_DETAIL_SECTIONS } from "@/lib/project-detail-sections";
import { ProjectUnitsTable } from "@/components/project-units-table";
import { ShareButton } from "@/components/share-button";
import { getProjectBySlug, slugify } from "@/lib/catalog";
import { getAreaInsightsForProject } from "@/lib/area-insights";
import { ProjectLivingInArea } from "@/components/project-living-in-area";
import { ProjectMasterplan } from "@/components/project-masterplan";
import { ProjectFloorPlans } from "@/components/project-floor-plans";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqPageJsonLd } from "@/lib/faq-json-ld";
import { buildProjectFaqs } from "@/lib/project-faqs";
import { ProjectGallery } from "@/components/project-gallery";
import { getEnrichment } from "@/lib/enrichments";
import { DldAreaStatsBand } from "@/components/dld-area-stats";
import { getAreaStats, getDldSource } from "@/lib/dld-area-stats";
import {
  cityLabel,
  formatPrice,
} from "@/lib/format";
import { unitPricePerSqft } from "@/lib/investment-metrics";
import { getSiteUrl } from "@/lib/site-url";
import {
  buildProjectBreadcrumbJsonLd,
  buildProjectJsonLd,
} from "@/lib/project-json-ld";
import { unoptimizedProp } from "@/lib/asset-image";

interface PageProps {
  params: Promise<{ slug: string }>;
}

import { getCatalogApi } from "@/lib/catalog";

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

  const enrichment = getEnrichment(slug);
  const minPriceMeta = Math.min(...project.units.map((u) => u.launchPriceAed).filter((v) => v > 0));
  const description = [
    `${project.name} by ${project.developer} in ${project.area}, ${project.city}`,
    Number.isFinite(minPriceMeta) ? `from AED ${minPriceMeta.toLocaleString("en-US")}` : "",
    project.handover ? `handover ${project.handover}` : "",
    project.paymentPlan ? `${project.paymentPlan} payment plan` : "",
    "floor plans + brochure.",
  ]
    .filter(Boolean)
    .join(" — ")
    .slice(0, 158);

  const imageUrl = project.imageUrl ?? project.imageGallery?.[0];
  const absoluteImage = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${getSiteUrl()}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`
    : `${getSiteUrl()}/brand/icon-red.png`;

  return {
    title: project.name,
    description,
    alternates: { canonical: `${getSiteUrl()}/projects/${slug}` },
    openGraph: {
      title: project.name,
      description,
      type: "website",
      url: `${getSiteUrl()}/projects/${slug}`,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description,
      images: [absoluteImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const enrichment = getEnrichment(slug);
  const dldStats = getAreaStats(project.area);
  const dldSource = getDldSource();
  const pfFaqs = project.pfFaqs ?? [];
  const minPrice = Math.min(...project.units.map((u) => u.launchPriceAed));
  // UAE grants a 10-year Golden Visa for property investment >= AED 2M.
  const goldenVisaEligible = project.units.some((u) => u.launchPriceAed >= 2_000_000);
  const catalogGallery =
    project.imageGallery?.length
      ? project.imageGallery
      : project.imageUrl
        ? [project.imageUrl]
        : [];
  // Append enrichment-discovered images (issue #37); catalog photos lead so the
  // hero stays a first-party image. ProjectGallery dedupes downstream. External
  // enrichment URLs are hotlinked (unoptimized) — never proxied — see asset-image.ts.
  const enrichmentImages = Array.isArray(enrichment?.images) ? enrichment.images : [];
  const gallery = [...catalogGallery, ...enrichmentImages];
  const mapUrl = project.coordinates
    ? `https://www.google.com/maps?q=${project.coordinates.lat},${project.coordinates.lng}`
    : null;
  const api = await getCatalogApi();
  const related = api.projects.filter(
    (p) => p.slug !== slug && p.city === project.city,
  ).slice(0, 3);
  const areaInsights = await getAreaInsightsForProject(slugify(project.area));
  const projectFaqs = buildProjectFaqs(project);

  const siteUrl = getSiteUrl();
  const projectUrl = `${siteUrl}/projects/${slug}`;
  const description =
    stripHtml(project.descriptionUnique ?? "")?.slice(0, 300) ??
    enrichment?.summary ??
    stripHtml(project.description)?.slice(0, 300) ??
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
  });

  const enrichmentAmenities = Array.isArray(enrichment?.facts?.amenities)
    ? (enrichment.facts.amenities as string[])
    : [];
  const amenities = project.amenities ?? enrichmentAmenities;

  const heroImage = gallery[0];
  const additionalPhotoCount = heroImage
    ? [...new Set(gallery.filter(Boolean))].filter((src) => src !== heroImage).length
    : gallery.length;

  const firstUnitPpsf = project.units[0]
    ? unitPricePerSqft({ project, unit: project.units[0] })
    : null;
  const pricePerSqftLabel = firstUnitPpsf
    ? `AED ${firstUnitPpsf.toLocaleString()}/sqft`
    : null;

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
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
          <Link href="/projects" className="text-sm text-white/80 hover:text-white">
            ← Back to projects
          </Link>
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
            {cityLabel(project.city)}, United Arab Emirates
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {[
              { label: "From", value: formatPrice(minPrice, "AED") },
              { label: "Payment", value: project.paymentPlan },
              { label: "Units", value: String(project.unitCount) },
              { label: "Type", value: project.units[0]?.propertyType ?? "Apartment" },
            ].map((stat) => (
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
                {additionalPhotoCount + 1} photos
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 py-8 pb-28 md:px-8 md:pb-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Projects", href: "/projects" },
            { label: project.name },
          ]}
        />
        <div className="mt-4">
          <ProjectDetailNav
            sections={PROJECT_DETAIL_SECTIONS.filter((section) => {
              if (section.id === "masterplan") return Boolean(project.masterPlanUrl);
              if (section.id === "floor-plans")
                return (project.floorPlans?.length ?? 0) > 0;
              if (section.id === "living-in-area") return Boolean(areaInsights);
              if (section.id === "related") return related.length > 0;
              return true;
            })}
          />
        </div>

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
                  Premium
                </span>
              ) : null}
              {project.status === "sold-out" ? (
                <span className="rounded-[5px] bg-surface-dark px-2.5 py-1 text-xs font-semibold uppercase text-white">
                  Sold out
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
                <Link
                  href={`/map?project=${slug}`}
                  className="text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  View on project map →
                </Link>
              ) : null}
              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Google Maps →
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
          FROM {formatPrice(minPrice, "AED")}
          {project.units[0] ? (
            <span className="ms-3 text-base font-medium text-muted">
              {(() => {
                const ppsf = unitPricePerSqft({
                  project,
                  unit: project.units[0],
                });
                return ppsf ? `· AED ${ppsf.toLocaleString()}/sqft` : "";
              })()}
            </span>
          ) : null}
        </p>

        {goldenVisaEligible ? (
          <Link
            href="/faq/golden-visa"
            className="iop-btn-press focus-ring mt-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-muted px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8z" />
            </svg>
            Golden Visa eligible · 10-year residency
          </Link>
        ) : null}

        <ProjectDetailCtas
          projectName={project.name}
          projectSlug={project.slug}
          whatsapp={project.whatsapp}
          brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
          videoUrl={project.videoUrl ?? enrichment?.videoUrl}
        />



        <div id="key-facts" className="scroll-mt-24">
          <ProjectKeyFacts project={project} />
          <ProjectTimeline project={project} />
        </div>

        <ProjectAbout
          enrichment={enrichment}
          brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
          videoUrl={project.videoUrl ?? enrichment?.videoUrl}
          description={project.descriptionUnique ?? project.description}
          amenities={amenities}
        />

        <ProjectUnitRanges units={project.units} />

        <ProjectMasterplan project={project} />

        <ProjectFloorPlans project={project} />
        </div>

        {areaInsights ? <ProjectLivingInArea insights={areaInsights} /> : null}

        <ProjectLocationSection project={project} />

        <div id="calculator" className="mt-10 scroll-mt-24">
          <ProjectPaymentCalculator project={project} />
          <p className="mt-4 text-sm text-muted">
            Financing part of the purchase?{" "}
            <Link
              href="/tools/mortgage"
              className="font-semibold text-brand hover:text-brand-dark"
            >
              Model your mortgage and get pre-approved →
            </Link>
          </p>
        </div>

        <section id="units" className="mt-10 scroll-mt-24">
          <h2 className="text-xl font-semibold text-text-dark">Unit types</h2>
          <ProjectUnitsTable units={project.units} project={project} />
        </section>

        {dldStats ? (
          <div id="market-data" className="mt-4 scroll-mt-24">
            <DldAreaStatsBand
              stats={dldStats}
              areaName={project.area.split(",")[0]}
              source={dldSource.source}
            />
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
              {project.name} FAQ
            </h2>
            <div className="mt-5">
              <FaqAccordion faqs={projectFaqs} />
            </div>
          </section>
        ) : null}

        {related.length > 0 ? (
          <section id="related" className="mt-12 scroll-mt-24">
            <h2 className="text-xl font-semibold text-text-dark">
              More in {cityLabel(project.city)}
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              priceLabel={formatPrice(minPrice, "AED")}
              pricePerSqft={pricePerSqftLabel}
              paymentPlan={project.paymentPlan}
              unitCount={project.unitCount}
              handover={project.handover ?? "To be announced"}
              whatsapp={project.whatsapp}
              brochureUrl={project.brochureUrl ?? enrichment?.brochureUrl}
            />
          </aside>
        </div>
      </main>
    </PageShell>
  );
}