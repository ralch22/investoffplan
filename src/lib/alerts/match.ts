/**
 * Pure saved-search matcher — no DB, no framework imports, safe to run in
 * tests, on the client (filter serialization), and inside the dispatch route.
 *
 * A saved search stores a JSON subset of the SERP URL param vocabulary
 * (projects-search-sync.tsx): q, city, beds, type, minP, maxP, dev, pay,
 * handover, amen — all strings, exactly as they appear in the URL.
 *
 * Matching semantics mirror catalog-core's filterUnits, lifted to PROJECT
 * level: unit-scoped predicates (beds / type / minP / maxP) match if ANY unit
 * of the project satisfies all of them together; project-scoped predicates
 * (city / dev / q substring) apply to the project row. Params the matcher
 * does not understand (pay, handover, amen) are intentionally ignored here —
 * alerts degrade to broader rather than silently dropping matches.
 */

import { slugify } from "@/lib/slugify";
import type { ProjectFilters } from "@/lib/types";

/** JSON shape persisted in saved_searches.filters — SERP URL params. */
export interface SavedSearchFilters {
  q?: string;
  city?: string;
  beds?: string;
  type?: string;
  minP?: string;
  maxP?: string;
  dev?: string;
  pay?: string;
  handover?: string;
  amen?: string;
}

export const SAVED_SEARCH_FILTER_KEYS = [
  "q",
  "city",
  "beds",
  "type",
  "minP",
  "maxP",
  "dev",
  "pay",
  "handover",
  "amen",
] as const;

/** Minimal project shape the matcher needs (drizzle projects row + units). */
export interface AlertProject {
  name: string;
  developer: string;
  area: string;
  /** City slug (projects.city_slug ?? projects.city). */
  city: string;
  units: Array<{
    beds: number;
    propertyType: string;
    launchPriceAed: number;
  }>;
}

/** Keep only known keys with non-empty string values. */
export function sanitizeSavedSearchFilters(input: unknown): SavedSearchFilters {
  const out: SavedSearchFilters = {};
  if (!input || typeof input !== "object") return out;
  const record = input as Record<string, unknown>;
  for (const key of SAVED_SEARCH_FILTER_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value.trim();
    }
  }
  return out;
}

/**
 * Serialize live SERP filter state into the persisted param subset — the same
 * mapping projects-search-sync.tsx writes to the URL.
 */
export function serializeFilters(filters: ProjectFilters): SavedSearchFilters {
  const out: SavedSearchFilters = {};
  if (filters.query) out.q = filters.query;
  if (filters.city !== "all") out.city = filters.city;
  if (filters.beds !== "all") out.beds = String(filters.beds);
  if (filters.propertyType !== "all") out.type = filters.propertyType;
  if (filters.minPrice) out.minP = String(filters.minPrice);
  if (filters.maxPrice) out.maxP = String(filters.maxPrice);
  if (filters.developer !== "all") out.dev = filters.developer;
  if (filters.paymentPlan !== "all") out.pay = filters.paymentPlan;
  if (filters.handoverBy !== "all") out.handover = String(filters.handoverBy);
  if (filters.amenities.length > 0) out.amen = filters.amenities.join(",");
  return out;
}

/** SERP deep-link (path + query) for a saved search, e.g. "/projects?city=dubai". */
export function savedSearchPath(filters: SavedSearchFilters, locale: "en" | "ar" = "en"): string {
  const params = new URLSearchParams();
  for (const key of SAVED_SEARCH_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  const base = locale === "ar" ? "/ar/projects" : "/projects";
  return qs ? `${base}?${qs}` : base;
}

function parsePrice(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function unitMatches(
  unit: AlertProject["units"][number],
  filters: SavedSearchFilters,
): boolean {
  // Beds vocabulary mirrors filterUnits: "studio" = 0 beds, "5" = 5+.
  if (filters.beds) {
    if (filters.beds === "studio") {
      if (unit.beds !== 0) return false;
    } else {
      const beds = Number(filters.beds);
      if (Number.isFinite(beds)) {
        if (beds === 5) {
          if (unit.beds < 5) return false;
        } else if (unit.beds !== beds) {
          return false;
        }
      }
    }
  }
  if (filters.type && unit.propertyType !== filters.type) return false;
  const minP = parsePrice(filters.minP);
  if (minP != null && unit.launchPriceAed < minP) return false;
  const maxP = parsePrice(filters.maxP);
  if (maxP != null && unit.launchPriceAed > maxP) return false;
  return true;
}

/**
 * Does a project satisfy a saved search? Project-level predicates first,
 * then ANY-unit for the unit-scoped ones. A project with no unit rows can
 * only match searches without unit-scoped predicates.
 */
export function projectMatchesFilters(
  project: AlertProject,
  filters: SavedSearchFilters,
): boolean {
  if (filters.city && filters.city !== "all" && project.city !== filters.city) {
    return false;
  }
  if (filters.dev && filters.dev !== "all" && slugify(project.developer) !== filters.dev) {
    return false;
  }
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    const haystack = `${project.name} ${project.developer} ${project.area}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }

  const hasUnitPredicate = Boolean(
    filters.beds || filters.type || parsePrice(filters.minP) != null || parsePrice(filters.maxP) != null,
  );
  if (!hasUnitPredicate) return true;
  return project.units.some((unit) => unitMatches(unit, filters));
}
