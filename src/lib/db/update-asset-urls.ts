import { eq, sql } from "drizzle-orm";
import type { CatalogFile } from "@/lib/catalog-core";
import { developerSlugFromName } from "@/lib/assets/keys";
import type { CatalogDatabase } from "./client";
import { catalogUnits, developers, projects } from "./schema";

export interface AssetUrlUpdateStats {
  projects: number;
  catalogUnits: number;
  developers: number;
}

export async function updateAssetUrlsFromCatalog(
  db: CatalogDatabase,
  catalog: CatalogFile,
): Promise<AssetUrlUpdateStats> {
  let projectUpdates = 0;
  let unitUpdates = 0;
  let developerUpdates = 0;

  const developerLogos = new Map<string, string>();
  for (const project of catalog.projects) {
    if (!project.developerLogo) continue;
    developerLogos.set(developerSlugFromName(project.developer), project.developerLogo);
  }

  for (const dev of catalog.devList ?? []) {
    if (dev.logoUrl) developerLogos.set(dev.slug, dev.logoUrl);
  }

  for (const project of catalog.projects) {
    await db
      .update(projects)
      .set({
        imageUrl: project.imageUrl ?? null,
        imageGallery: project.imageGallery
          ? JSON.stringify(project.imageGallery)
          : null,
        brochureUrl: project.brochureUrl ?? null,
        developerLogo: project.developerLogo ?? null,
        updatedAt: catalog.scrapedAt,
      })
      .where(eq(projects.id, project.id));
    projectUpdates += 1;
  }

  for (const unit of catalog.units) {
    await db
      .update(catalogUnits)
      .set({
        imageUrl: unit.imageUrl ?? null,
        imageGallery: unit.imageGallery
          ? JSON.stringify(unit.imageGallery)
          : null,
        developerLogo: unit.developerLogo ?? null,
      })
      .where(eq(catalogUnits.id, unit.id));
    unitUpdates += 1;
  }

  for (const [slug, logoUrl] of developerLogos) {
    await db.update(developers).set({ logoUrl }).where(eq(developers.slug, slug));
    developerUpdates += 1;
  }

  for (const project of catalog.projects) {
    if (!project.developerLogo) continue;
    await db
      .update(developers)
      .set({ logoUrl: project.developerLogo })
      .where(sql`lower(${developers.name}) = lower(${project.developer})`);
  }

  return {
    projects: projectUpdates,
    catalogUnits: unitUpdates,
    developers: developerUpdates,
  };
}