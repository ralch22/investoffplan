import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { PageHero } from "@/components/page-hero";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCatalogApi, getDevelopers, getTopAmenities } from "@/lib/catalog";
import { PAGE_SIZE } from "@/lib/catalog-core";
import { getMapProjectsFromList } from "@/lib/map-data";
import { ProjectsPage } from "@/app/(en)/projects/projects-page";
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

type CollectionChrome = {
  title: string;
  h1: string;
  description: string;
  /** Long-form body paragraphs (#368). Falls back to COLLECTION_PAGES.intro. */
  intro?: readonly string[];
};

function collectionChrome(locale: Locale, slug: string): CollectionChrome | null {
  const page = getCollectionPage(slug);
  if (!page) return null;
  const dict = getDictionary(locale);
  const pages = dict.pages.collections.pages as Record<string, CollectionChrome>;
  const copy = pages[slug];
  return {
    title: copy?.title ?? page.title,
    h1: copy?.h1 ?? page.h1,
    description: copy?.description ?? page.description,
    // Prefer locale dict intro so AR SSR does not leak EN editorial body (#368).
    intro: copy?.intro?.length ? copy.intro : page.intro,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chrome = collectionChrome("en", slug);
  // Soft metadata titles with HTTP 200 are banned (#241 / #322).
  if (!chrome) notFound();
  const siteUrl = getSiteUrl();
  return {
    title: chrome.title,
    description: chrome.description,
    alternates: enMeta(`/collections/${slug}`),
    openGraph: {
      title: chrome.title,
      description: chrome.description,
      url: `${siteUrl}/collections/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: chrome.title,
      description: chrome.description,
    },
  };
}

const MAX_PROJECTS = 12;

export default async function CollectionsSlugPage({ params, locale = "en" }: PageProps) {
  const dict = getDictionary(locale);
  const t = dict.pages.collections;
  const { slug } = await params;
  const page = getCollectionPage(slug);
  const chrome = collectionChrome(locale, slug);
  if (!page || !chrome) notFound();

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

  // Calculate total number of unique projects
  const uniqueProjectIds = new Set<string>();
  for (const item of items) {
    uniqueProjectIds.add(item.project.id);
  }
  const fullProjectCount = uniqueProjectIds.size;
  const initialResultCount = fullProjectCount;

  const initialPageItems = api.aggregateProjectView(api.sortUnits(items, "featured")).slice(0, PAGE_SIZE);

  const heroImage = await getHeroImage();
  const siteUrl = getSiteUrl();
  const fmtLocale = locale === "ar" ? "ar-AE" : "en-US";
  const unitsLabel = items.length.toLocaleString(fmtLocale);
  const projectsLabel = fullProjectCount.toLocaleString(fmtLocale);
  // Locale-aware site origin for AR JSON-LD when mirrored under /ar.
  const pageUrl =
    locale === "ar"
      ? `${siteUrl}/ar/collections/${page.slug}`
      : `${siteUrl}/collections/${page.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: chrome.title,
    description: chrome.description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: initialPageItems.length,
      itemListElement: initialPageItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.project.name,
        url: `${siteUrl}${localePath(locale, `/projects/${item.project.slug}`)}`,
      })),
    },
  };

  const otherCollections = COLLECTION_PAGES.filter(
    (other) => other.slug !== page.slug,
  ).slice(0, 6);
  const pagesCopy = t.pages as Record<string, CollectionChrome>;

  const initialCityCounts = api.getCityCounts();
  // Generate map pins for all projects in this collection
  const initialMapProjects = getMapProjectsFromList(
    Array.from(new Set(items.map((i) => i.project)))
  );
  const [developersList, amenityOptions] = await Promise.all([
    getDevelopers(),
    getTopAmenities(18),
  ]);
  const developerOptions = developersList
    .slice(0, 60)
    .map((dev) => ({ slug: dev.slug, name: dev.name }));

  const headerOverride = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumbListJsonLd([
              {
                name: dict.common.home,
                url: `${siteUrl}${localePath(locale, "/")}`,
              },
              {
                name: dict.nav.projects,
                url: `${siteUrl}${localePath(locale, "/projects")}`,
              },
              { name: chrome.h1 },
            ]),
          ),
        }}
      />
      <PageHero
        title={chrome.h1}
        italicTitle
        subtitle={interpolate(t.unitOptionsSubtitle, {
          units: unitsLabel,
          projects: projectsLabel,
        })}
        imageUrl={heroImage}
      />

      <section className="mx-auto max-w-[1200px] px-5 py-8 pb-0 md:px-8">
        <Breadcrumbs
          items={[
            { label: dict.common.home, href: "/" },
            { label: dict.nav.projects, href: "/projects" },
            { label: chrome.h1 },
          ]}
        />
        <div
          data-testid="collection-intro"
          className="mt-8 max-w-3xl space-y-4"
        >
          {(chrome.intro ?? page.intro).map((paragraph, index) => (
            <p key={index} className="leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <ProjectsPage
      initialMeta={{
        unitCount: api.meta.unitCount,
        projectCount: api.meta.projectCount,
        scrapedAt: api.meta.scrapedAt,
      }}
      initialPageItems={initialPageItems}
      initialCityCounts={initialCityCounts}
      initialResultCount={initialResultCount}
      initialMapProjects={initialMapProjects}
      developerOptions={developerOptions}
      amenityOptions={amenityOptions}
      collectionSlug={page.slug}
      fixedCollection={page.collection}
      disableApi={true}
      headerOverride={headerOverride}
    />
  );
}


/** Shared by AR mirror for locale-aware title/description (#253). */
export { collectionChrome };
