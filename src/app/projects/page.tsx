import type { Metadata } from "next";
import { getCatalogApi } from "@/lib/catalog";
import { PAGE_SIZE } from "@/lib/catalog-core";
import { getMapProjectsFromList } from "@/lib/map-data";
import { ProjectsPage } from "./projects-page";

export const metadata: Metadata = {
  title: "New Off-Plan Projects",
  description:
    "Browse UAE off-plan projects with unit-level pricing, payment plans, and direct WhatsApp contact.",
};

export default async function Page() {
  const api = await getCatalogApi();
  const initialPageItems = api.sortUnits(api.flattenCatalogUnits(), "featured").slice(0, PAGE_SIZE);
  const initialCityCounts = api.getCityCounts();
  const initialMapProjects = getMapProjectsFromList(api.projects);

  return (
    <>
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
      />
    </>
  );
}