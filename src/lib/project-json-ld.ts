import { cityLabel } from "@/lib/format";
import { resolveBrochureUrl } from "@/lib/brochure";
import { parseMedia } from "@/lib/media";
import type { Project } from "@/lib/types";

/**
 * VideoObject for a project's embeddable walkthrough (YouTube/Vimeo embed or
 * self-hosted mp4). Returns null for non-embeddable / missing video.
 */
export function buildVideoObjectJsonLd(opts: {
  videoUrl?: string | null;
  name: string;
  description: string;
  thumbnailUrl?: string;
  uploadDate: string;
}) {
  const { videoUrl, name, description, thumbnailUrl, uploadDate } = opts;
  if (!videoUrl) return null;
  const m = parseMedia(videoUrl);
  const thumb = m.poster || (thumbnailUrl && thumbnailUrl.startsWith("http") ? thumbnailUrl : undefined);
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: name.slice(0, 110),
    description: (description || name).slice(0, 500),
    uploadDate,
    ...(thumb ? { thumbnailUrl: thumb } : {}),
  };
  if (m.kind === "file" && m.fileSrc) return { ...base, contentUrl: m.fileSrc };
  if ((m.kind === "youtube" || m.kind === "vimeo") && m.embedSrc) return { ...base, embedUrl: m.embedSrc };
  return null;
}

function absoluteAsset(siteUrl: string, url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildProjectJsonLd(opts: {
  project: Project;
  projectUrl: string;
  siteUrl: string;
  minPrice: number;
  description?: string;
  gallery: string[];
}) {
  const { project, projectUrl, siteUrl, minPrice, description, gallery } = opts;
  const images = gallery
    .map((src) => absoluteAsset(siteUrl, src))
    .filter((src): src is string => Boolean(src))
    .slice(0, 8);

  const brochure = resolveBrochureUrl(project);

  // No stated price → no offers block: `lowPrice: 0` is schema spam and
  // renders "From AED 0" in rich results (8 live Emaar projects hit this).
  const offers: Record<string, unknown> | undefined =
    minPrice > 0
      ? {
          "@type": "AggregateOffer",
          lowPrice: minPrice,
          priceCurrency: "AED",
          offerCount: project.units.length,
          availability:
            project.status === "sold-out"
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: project.developer,
          },
        }
      : undefined;

  const additionalProperty = [
    project.handover
      ? { "@type": "PropertyValue", name: "Handover", value: project.handover }
      : null,
    project.paymentPlan
      ? { "@type": "PropertyValue", name: "Payment plan", value: project.paymentPlan }
      : null,
    brochure
      ? { "@type": "PropertyValue", name: "Brochure", value: brochure }
      : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: project.name,
    description,
    url: projectUrl,
    image: images.length ? images : undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.area,
      addressRegion: cityLabel(project.city),
      addressCountry: "AE",
    },
    geo: project.coordinates
      ? {
          "@type": "GeoCoordinates",
          latitude: project.coordinates.lat,
          longitude: project.coordinates.lng,
        }
      : undefined,
    offers,
    additionalProperty: additionalProperty.length ? additionalProperty : undefined,
  };
}

/**
 * Generic BreadcrumbList JSON-LD builder. Pass the same trail the visible
 * <Breadcrumbs> component renders (same labels, same order) with absolute
 * URLs. The final crumb (current page) conventionally omits `item`/url.
 */
export function buildBreadcrumbListJsonLd(
  items: Array<{ name: string; url?: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function buildProjectBreadcrumbJsonLd(opts: {
  projectName: string;
  projectUrl: string;
  siteUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: opts.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: `${opts.siteUrl}/projects`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: opts.projectName,
      },
    ],
  };
}

export function buildDeveloperJsonLd(opts: {
  developer: {
    name: string;
    projectCount: number;
    unitCount?: number;
    cities?: string[];
    logoUrl?: string;
    foundedYear?: number;
  };
  developerUrl: string;
  siteUrl: string;
}) {
  const { developer, developerUrl, siteUrl } = opts;
  const areaServed = (developer.cities ?? [])
    .map((city) => cityLabel(city))
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: developer.name,
    url: developerUrl,
    ...(developer.logoUrl
      ? {
          image: absoluteAsset(siteUrl, developer.logoUrl),
          logo: absoluteAsset(siteUrl, developer.logoUrl),
        }
      : {}),
    foundingDate: developer.foundedYear
      ? String(developer.foundedYear)
      : undefined,
    areaServed: areaServed.length
      ? areaServed.map((name) => ({ "@type": "City", name }))
      : undefined,
    description: `Browse ${developer.projectCount} off-plan project${
      developer.projectCount === 1 ? "" : "s"
    }${
      developer.unitCount ? ` and ${developer.unitCount.toLocaleString()} unit options` : ""
    } by ${developer.name} in the UAE.`,
  };
}

/**
 * ItemList (wrapped in a CollectionPage) of the projects visible on the main
 * search SERP — mirrors buildDeveloperItemListJsonLd's shape. Returns null when
 * there are no projects so the caller can skip rendering the <script>.
 */
export function buildProjectsItemListJsonLd(opts: {
  projects: Project[];
  pageUrl: string;
  siteUrl: string;
  limit?: number;
}) {
  const { projects, pageUrl, siteUrl, limit = 24 } = opts;
  const items = projects.slice(0, limit);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Off-Plan Projects for Sale in Dubai & the UAE",
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.name,
        url: `${siteUrl}/projects/${project.slug}`,
      })),
    },
  };
}

export function buildDeveloperItemListJsonLd(opts: {
  developer: { name: string };
  projects: Project[];
  developerUrl: string;
  siteUrl: string;
}) {
  const { developer, projects, developerUrl, siteUrl } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `New & Off-Plan Projects by ${developer.name}`,
    url: developerUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.name,
        url: `${siteUrl}/projects/${project.slug}`,
      })),
    },
  };
}