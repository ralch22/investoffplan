import { cityLabel } from "@/lib/format";
import { resolveBrochureUrl } from "@/lib/brochure";
import type { Project } from "@/lib/types";

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

  const offers: Record<string, unknown> = {
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
  };

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
        item: opts.projectUrl,
      },
    ],
  };
}

export function buildDeveloperJsonLd(opts: {
  developer: { name: string; projectCount: number };
  developerUrl: string;
  siteUrl: string;
}) {
  const { developer, developerUrl, siteUrl } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: developer.name,
    url: developerUrl,
    image: absoluteAsset(siteUrl, "/brand/icon-red.png"),
    description: `Browse ${developer.projectCount} off-plan projects by ${developer.name} in the UAE.`,
  };
}