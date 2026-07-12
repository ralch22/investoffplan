import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ShowcaseProjectCard } from "@/components/showcase-project-card";
import { PrimaryButton } from "@/components/ui/primary-button";
import { getCatalogApi } from "@/lib/catalog";
import { COLLECTION_PAGES, getCollectionPage } from "@/lib/collections";
import { getHeroImage } from "@/lib/area-images";
import { buildBreadcrumbListJsonLd } from "@/lib/project-json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { enMeta } from "@/lib/ar-meta";
import type { Project } from "@/lib/types";
import type { FlatUnit } from "@/lib/catalog-core";
import { getDictionary } from "@/i18n";
import { interpolate, localePath, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ slug: string }>;
  locale?: Locale;
}

// Unknown slugs are real 404s — content is defined at build time by COLLECTION_PAGES.
export const dynamicParams = false;

export function generateStaticParams() {
  return COLLECTION_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getCollectionPage(slug);
  if (!page) return { title: "Collection not found" };
  const siteUrl = getSiteUrl();
  return {
    title: page.title,
    description: page.description,
    alternates: enMeta(`/collections/${slug}`),
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${siteUrl}/collections/${slug}`,
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description },
  };
}

const MAX_PROJECTS = 12;

type CollectionCopy = { title: string; h1: string; description: string };

export default async function CollectionsSlugPage({ params, locale = "en" }: PageProps) {
  const dict = getDictionary(locale);
  const t = dict.pages.collections;
  const { slug } = await params;
  const page = getCollectionPage(slug);
  if (!page) notFound();

  const pagesCopy = t.pages as Record<string, CollectionCopy>;
  const copy: CollectionCopy = pagesCopy[slug] ?? {
    title: page.title,
    h1: page.h1,
    description: page.description,
  };

  const api = await getCatalogApi();
  let items: FlatUnit[] = api.flattenCatalogUnits();

  if (page.city) {
    items = items.filter(
      (item) => (item.catalog?.citySlug ?? item.project.city) === page.city,
    );
  }
  if (page.collection) {
    items = api.applyCollectionFilter(items, page.collection);
  }
  if (page.predicate) {
    items = items.filter(page.predicate);
  }

  // Dedupe to projects, keep catalog order (featured-ish), cap the grid.
  const seen = new Set<string>();
  const projects: Project[] = [];
  for (const item of api.sortUnits(items, "featured")) {
    if (seen.has(item.project.id)) continue;
    seen.add(item.project.id);
    projects.push(item.project);
    if (projects.length >= MAX_PROJECTS) break;
  }

  const heroImage = await getHeroImage();
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}${localePath(locale, `/collections/${page.slug}`)}`;
  const fmtLocale = locale === "ar" ? "ar-AE" : "en-US";
  const unitsLabel = items.length.toLocaleString(fmtLocale);
  const projectsLabel =
    seen.size >= MAX_PROJECTS
      ? `${MAX_PROJECTS.toLocaleString(fmtLocale)}+`
      : projects.length.toLocaleString(fmtLocale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.name,
        url: `${siteUrl}${localePath(locale, `/projects/${project.slug}`)}`,
      })),
    },
  };

  const otherCollections = COLLECTION_PAGES.filter(
    (other) => other.slug !== page.slug,
  ).slice(0, 6);

  return (
    <PageShell headerVariant="transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              { name: dict.common.home, url: `${siteUrl}${localePath(locale, "/")}` },
              {
                name: dict.nav.projects,
                url: `${siteUrl}${localePath(locale, "/projects")}`,
              },
              { name: copy.h1 },
            ]),
          ),
        }}
      />
      <PageHero
        title={copy.h1}
        italicTitle
        subtitle={interpolate(t.unitOptionsSubtitle, {
          units: unitsLabel,
          projects: projectsLabel,
        })}
        imageUrl={heroImage}
      />

      <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: localePath(locale, "/") },
            { label: dict.nav.projects, href: localePath(locale, "/projects") },
            { label: copy.h1 },
          ]}
        />

        <section className="mt-8 max-w-3xl space-y-4">
          {page.intro.map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </section>

        {projects.length === 0 ? (
          <p className="mt-10 text-muted">{t.emptyState}</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ShowcaseProjectCard
                key={project.id}
                project={project}
                featured={index === 0}
              />
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-brand p-8 text-center text-white">
          <p className="text-xl font-semibold">{t.refineCta}</p>
          <PrimaryButton
            href={localePath(locale, `/projects?${page.serpQuery}`)}
            className="mt-4 bg-white text-brand hover:bg-white/90"
          >
            {t.openInProjects}
          </PrimaryButton>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-text-dark">
            {t.moreCollections}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {otherCollections.map((other) => {
              const otherCopy = pagesCopy[other.slug] ?? {
                title: other.title,
                h1: other.h1,
                description: other.description,
              };
              return (
                <Link
                  key={other.slug}
                  href={localePath(locale, `/collections/${other.slug}`)}
                  className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
                >
                  {otherCopy.h1}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
