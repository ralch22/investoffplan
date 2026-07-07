import type { CatalogUnit, DevListEntry, Project, UnitType } from "@/lib/types";
import type {
  catalogUnits,
  developers,
  projectUnits,
  projects,
} from "./schema";

type ProjectRow = typeof projects.$inferSelect;
type ProjectUnitRow = typeof projectUnits.$inferSelect;
type CatalogUnitRow = typeof catalogUnits.$inferSelect;
type DeveloperRow = typeof developers.$inferSelect;

function parseJsonArray(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : undefined;
  } catch {
    return undefined;
  }
}

export function rowToUnitType(row: ProjectUnitRow): UnitType {
  return {
    id: row.id,
    beds: row.beds,
    sqftMin: row.sqftMin,
    sqftMax: row.sqftMax ?? undefined,
    launchPriceAed: row.launchPriceAed,
    launchPriceMaxAed: row.launchPriceMaxAed ?? undefined,
    propertyType: row.propertyType,
  };
}

export function rowToProject(row: ProjectRow, units: ProjectUnitRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    pfSlug: row.pfSlug ?? undefined,
    name: row.name,
    developer: row.developer,
    developerInitials: row.developerInitials,
    developerLogo: row.developerLogo ?? undefined,
    city: row.city as Project["city"],
    citySlug: row.citySlug ?? undefined,
    area: row.area,
    status: row.status as Project["status"],
    handover: row.handover ?? undefined,
    paymentPlan: row.paymentPlan,
    paymentPlanCount: row.paymentPlanCount ?? undefined,
    isPremium: row.isPremium,
    unitCount: row.unitCount,
    featuredRank: row.featuredRank ?? undefined,
    imageGradient: row.imageGradient ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    imageGallery: parseJsonArray(row.imageGallery),
    videoAvailable: row.videoAvailable ?? undefined,
    coordinates:
      row.lat != null && row.lng != null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
    brochureUrl: row.brochureUrl ?? undefined,
    description: row.description ?? undefined,
    amenities: parseJsonArray(row.amenities),
    masterPlanUrl: row.masterPlanUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    whatsapp: row.whatsapp,
    units: units.map(rowToUnitType),
  };
}

export function rowToCatalogUnit(row: CatalogUnitRow): CatalogUnit {
  return {
    id: row.id,
    projectId: row.projectId,
    projectSlug: row.projectSlug,
    projectName: row.projectName,
    pfSlug: row.pfSlug ?? undefined,
    developer: row.developer,
    developerLogo: row.developerLogo ?? undefined,
    city: row.city,
    citySlug: row.citySlug,
    area: row.area,
    locationFull: row.locationFull,
    propertyType: row.propertyType,
    beds: row.beds,
    sqftMin: row.sqftMin,
    sqftMax: row.sqftMax ?? undefined,
    launchPriceAed: row.launchPriceAed,
    launchPriceMaxAed: row.launchPriceMaxAed ?? undefined,
    paymentPlan: row.paymentPlan,
    paymentPlanCount: row.paymentPlanCount ?? undefined,
    handover: row.handover ?? undefined,
    isPremium: row.isPremium,
    imageUrl: row.imageUrl ?? undefined,
    imageGallery: parseJsonArray(row.imageGallery),
    videoAvailable: row.videoAvailable ?? undefined,
    coordinates:
      row.lat != null && row.lng != null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
    projectUnitCount: row.projectUnitCount,
    whatsapp: row.whatsapp,
    status: row.status,
  };
}

export function rowToDevListEntry(row: DeveloperRow): DevListEntry {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl ?? undefined,
    description: row.description ?? undefined,
    establishedSince: row.establishedSince ?? undefined,
    numProjectsOnline: row.numProjectsOnline ?? undefined,
    devPageEnabled: row.devPageEnabled ?? undefined,
  };
}

export function stringifyJsonArray(values: string[] | undefined): string | null {
  if (!values?.length) return null;
  return JSON.stringify(values);
}