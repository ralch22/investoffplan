import type { Metadata } from "next";
import { getCatalogApi, getDevelopers, getTopAmenities } from "@/lib/catalog";
import { PAGE_SIZE } from "@/lib/catalog-core";
import { getMapProjectsFromList } from "@/lib/map-data";
import { ProjectsPage } from "./projects-page";
import { getSiteUrl } from "@/lib/site-url";
import { buildProjectsItemListJsonLd } from "@/lib/project-json-ld";

export const metadata: Metadata = {
  title: "Off-Plan Projects for Sale in Dubai & the UAE",
  description:
    "Browse every UAE off-plan project — unit-level pricing, payment plans, floor plans, and brochures. Filter by developer, community, handover, and price.",
  alternates: {
    canonical: `${getSiteUrl()}/projects`,
    languages: {
      "x-default": `${getSiteUrl()}/projects`,
      en: `${getSiteUrl()}/projects`,
      ar: `${getSiteUrl()}/ar/projects`,
    },
  },
};

export default async function Page() {
  const api = await getCatalogApi();
  const initialPageItems = api.aggregateProjectView(api.sortUnits(api.flattenCatalogUnits(), "featured")).slice(0, PAGE_SIZE);
  const initialCityCounts = api.getCityCounts();
  const initialMapProjects = getMapProjectsFromList(api.projects);
  const [developers, amenityOptions] = await Promise.all([
    getDevelopers(),
    getTopAmenities(18),
  ]);
  const developerOptions = developers
    .slice(0, 60)
    .map((dev) => ({ slug: dev.slug, name: dev.name }));

  // ItemList JSON-LD of the first SERP page (dedup units → projects), matching
  // the structured-data pattern used on PDP/developer/community pages.
  const siteUrl = getSiteUrl();
  const serpProjects: typeof api.projects = [];
  const seenSerpSlugs = new Set<string>();
  for (const item of initialPageItems) {
    if (seenSerpSlugs.has(item.project.slug)) continue;
    seenSerpSlugs.add(item.project.slug);
    serpProjects.push(item.project);
  }
  const itemListJsonLd = buildProjectsItemListJsonLd({
    projects: serpProjects,
    pageUrl: `${siteUrl}/projects`,
    siteUrl,
  });

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <ProjectsPage
        initialMeta={{
          unitCount: api.meta.unitCount,
          projectCount: api.meta.projectCount,
          scrapedAt: api.meta.scrapedAt,
        }}
        initialPageItems={initialPageItems}
        initialCityCounts={initialCityCounts}
        initialResultCount={api.projects.length}
        initialMapProjects={initialMapProjects}
        developerOptions={developerOptions}
        amenityOptions={amenityOptions}
      />
    </>
  );
}