import type { Metadata } from "next";
import { getCatalogApi, getDevelopers, getTopAmenities } from "@/lib/catalog";
import { PAGE_SIZE } from "@/lib/catalog-core";
import { getMapProjectsFromList } from "@/lib/map-data";
import { ProjectsPage } from "@/app/(en)/projects/projects-page";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "المشاريع الجديدة على الخارطة في الإمارات",
  description:
    "تصفح مشاريع العقارات الجديدة على الخارطة في الإمارات مع الأسعار على مستوى الوحدة وخطط السداد والبروشورات المباشرة.",
  alternates: {
    canonical: `${getSiteUrl()}/ar/projects`,
    languages: {
      en: `${getSiteUrl()}/projects`,
      ar: `${getSiteUrl()}/ar/projects`,
    },
  },
};

export default async function ArabicProjectsPage() {
  const api = await getCatalogApi();
  const initialPageItems = api
    .sortUnits(api.flattenCatalogUnits(), "featured")
    .slice(0, PAGE_SIZE);
  const initialCityCounts = api.getCityCounts();
  const initialMapProjects = getMapProjectsFromList(api.projects);
  const [developers, amenityOptions] = await Promise.all([
    getDevelopers(),
    getTopAmenities(18),
  ]);
  const developerOptions = developers
    .slice(0, 60)
    .map((dev) => ({ slug: dev.slug, name: dev.name }));

  return (
    <ProjectsPage
      initialMeta={{
        unitCount: api.meta.unitCount,
        projectCount: api.meta.projectCount,
        scrapedAt: api.meta.scrapedAt,
      }}
      initialPageItems={initialPageItems}
      initialCityCounts={initialCityCounts}
      initialResultCount={api.meta.unitCount}
      initialMapProjects={initialMapProjects}
      developerOptions={developerOptions}
      amenityOptions={amenityOptions}
    />
  );
}
