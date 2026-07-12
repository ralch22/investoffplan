import type { CatalogUnit, DevListEntry, Project, UnitType } from "@/lib/types";
import { displayProjectName, sanitizeUnitSizes } from "@/lib/catalog-core";
import { sanitizePfFaqs, type PfFaq } from "@/lib/sanitize-html";
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
  // Display/compute size gate (#180) — D1 PDP path bypasses createCatalogApi.
  return sanitizeUnitSizes({
    id: row.id,
    beds: row.beds,
    sqftMin: row.sqftMin,
    sqftMax: row.sqftMax ?? undefined,
    launchPriceAed: row.launchPriceAed,
    launchPriceMaxAed: row.launchPriceMaxAed ?? undefined,
    propertyType: row.propertyType,
  });
}

export function rowToProject(row: ProjectRow, units: ProjectUnitRow[]): Project {
  return {
    id: row.id,
    slug: row.slug,
    pfSlug: row.pfSlug ?? undefined,
    // Display-layer soft-title for PF "New Project by X" placeholders (matches
    // createCatalogApi / normalizeProject — D1 may still store the raw scrape).
    name: displayProjectName(row.name, row.developer),
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
    descriptionUnique: row.descriptionUnique ?? undefined,
    amenities: parseJsonArray(row.amenities),
    masterPlanUrl: row.masterPlanUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    floorPlans: parseJson(row.floorPlans),
    salesStartDate: row.salesStartDate ?? undefined,
    ownershipType: row.ownershipType ?? undefined,
    constructionProgress: row.constructionProgress ?? undefined,
    pfFaqs: sanitizeRowFaqs(row.pfFaqs),
    whatsapp: row.whatsapp,
    units: units.map(rowToUnitType),
  };
}

function parseJson<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function sanitizeRowFaqs(value: string | null): PfFaq[] | undefined {
  const faqs = sanitizePfFaqs(parseJson<PfFaq[]>(value));
  return faqs.length > 0 ? faqs : undefined;
}

export function rowToCatalogUnit(row: CatalogUnitRow): CatalogUnit {
  const sizes = sanitizeUnitSizes({
    beds: row.beds,
    propertyType: row.propertyType,
    sqftMin: row.sqftMin,
    sqftMax: row.sqftMax ?? undefined,
  });
  return {
    id: row.id,
    projectId: row.projectId,
    projectSlug: row.projectSlug,
    projectName: displayProjectName(row.projectName, row.developer),
    pfSlug: row.pfSlug ?? undefined,
    developer: row.developer,
    developerLogo: row.developerLogo ?? undefined,
    city: row.city,
    citySlug: row.citySlug,
    area: row.area,
    locationFull: row.locationFull,
    propertyType: row.propertyType,
    beds: row.beds,
    sqftMin: sizes.sqftMin,
    sqftMax: sizes.sqftMax,
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