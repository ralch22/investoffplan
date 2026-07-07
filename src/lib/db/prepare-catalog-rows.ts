import type { CatalogFile } from "@/lib/catalog-core";
import type { CatalogUnit, DevListEntry, Project } from "@/lib/types";
import { stringifyJsonArray } from "./mappers";

export interface PreparedProjectUnit {
  id: string;
  projectId: string;
  beds: number;
  sqftMin: number;
  sqftMax: number | null;
  launchPriceAed: number;
  launchPriceMaxAed: number | null;
  propertyType: string;
  sortOrder: number;
}

export interface PreparedCatalogRows {
  updatedAt: string;
  projects: Project[];
  projectUnits: PreparedProjectUnit[];
  catalogUnits: CatalogUnit[];
  cityCounts: CatalogFile["cityCounts"];
  developerSerpLinks: CatalogFile["developerSerpLinks"];
  devList: DevListEntry[];
  skippedDuplicateSlugs: string[];
  skippedDuplicateUnitIds: string[];
}

export function prepareCatalogRows(raw: CatalogFile): PreparedCatalogRows {
  const seenSlugs = new Set<string>();
  const projects: Project[] = [];
  const skippedDuplicateSlugs: string[] = [];

  for (const project of raw.projects) {
    if (seenSlugs.has(project.slug)) {
      skippedDuplicateSlugs.push(project.slug);
      continue;
    }
    seenSlugs.add(project.slug);
    projects.push(project);
  }

  const projectIds = new Set(projects.map((p) => p.id));
  const seenUnitIds = new Set<string>();
  const skippedDuplicateUnitIds: string[] = [];
  const projectUnits: PreparedProjectUnit[] = [];

  for (const project of projects) {
    project.units.forEach((unit, index) => {
      if (seenUnitIds.has(unit.id)) {
        skippedDuplicateUnitIds.push(unit.id);
        return;
      }
      seenUnitIds.add(unit.id);
      projectUnits.push({
        id: unit.id,
        projectId: project.id,
        beds: unit.beds,
        sqftMin: unit.sqftMin,
        sqftMax: unit.sqftMax ?? null,
        launchPriceAed: unit.launchPriceAed,
        launchPriceMaxAed: unit.launchPriceMaxAed ?? null,
        propertyType: unit.propertyType,
        sortOrder: index,
      });
    });
  }

  const seenCatalogUnitIds = new Set<string>();
  const catalogUnits: CatalogUnit[] = [];
  for (const unit of raw.units) {
    if (!projectIds.has(unit.projectId)) continue;
    if (seenCatalogUnitIds.has(unit.id)) {
      skippedDuplicateUnitIds.push(unit.id);
      continue;
    }
    seenCatalogUnitIds.add(unit.id);
    catalogUnits.push(unit);
  }

  return {
    updatedAt: raw.scrapedAt,
    projects,
    projectUnits,
    catalogUnits,
    cityCounts: raw.cityCounts,
    developerSerpLinks: raw.developerSerpLinks,
    devList: raw.devList ?? [],
    skippedDuplicateSlugs,
    skippedDuplicateUnitIds,
  };
}

export function projectToInsertValues(project: Project, updatedAt: string) {
  return {
    id: project.id,
    slug: project.slug,
    pfSlug: project.pfSlug ?? null,
    name: project.name,
    developer: project.developer,
    developerInitials: project.developerInitials,
    developerLogo: project.developerLogo ?? null,
    city: project.city,
    citySlug: project.citySlug ?? project.city,
    area: project.area,
    status: project.status,
    handover: project.handover ?? null,
    paymentPlan: project.paymentPlan,
    paymentPlanCount: project.paymentPlanCount ?? null,
    isPremium: project.isPremium,
    unitCount: project.unitCount,
    featuredRank: project.featuredRank ?? null,
    imageGradient: project.imageGradient ?? null,
    imageUrl: project.imageUrl ?? null,
    imageGallery: stringifyJsonArray(project.imageGallery),
    videoAvailable: project.videoAvailable ?? null,
    lat: project.coordinates?.lat ?? null,
    lng: project.coordinates?.lng ?? null,
    brochureUrl: project.brochureUrl ?? null,
    description: project.description ?? null,
    amenities: stringifyJsonArray(project.amenities),
    masterPlanUrl: project.masterPlanUrl ?? null,
    videoUrl: project.videoUrl ?? null,
    whatsapp: project.whatsapp,
    updatedAt,
  };
}

export function catalogUnitToInsertValues(unit: CatalogUnit) {
  return {
    id: unit.id,
    projectId: unit.projectId,
    projectSlug: unit.projectSlug,
    projectName: unit.projectName,
    pfSlug: unit.pfSlug ?? null,
    developer: unit.developer,
    developerLogo: unit.developerLogo ?? null,
    city: unit.city,
    citySlug: unit.citySlug,
    area: unit.area,
    locationFull: unit.locationFull,
    propertyType: unit.propertyType,
    beds: unit.beds,
    sqftMin: unit.sqftMin,
    sqftMax: unit.sqftMax ?? null,
    launchPriceAed: unit.launchPriceAed,
    launchPriceMaxAed: unit.launchPriceMaxAed ?? null,
    paymentPlan: unit.paymentPlan,
    paymentPlanCount: unit.paymentPlanCount ?? null,
    handover: unit.handover ?? null,
    isPremium: unit.isPremium,
    imageUrl: unit.imageUrl ?? null,
    imageGallery: stringifyJsonArray(unit.imageGallery),
    videoAvailable: unit.videoAvailable ?? null,
    lat: unit.coordinates?.lat ?? null,
    lng: unit.coordinates?.lng ?? null,
    projectUnitCount: unit.projectUnitCount,
    whatsapp: unit.whatsapp,
    status: unit.status,
  };
}