import {
  hasBrochure,
  isWaterfront,
  valueScore,
} from "./investment-metrics";
import { sanitizePfFaqs } from "./sanitize-html";
import { slugify } from "./slugify";
import type {
  CatalogUnit,
  CitySlug,
  CollectionFilter,
  DevListEntry,
  Project,
  ProjectFilters,
  SortOption,
  UnitType,
} from "./types";

export interface CatalogFile {
  version: 2;
  unitCount: number;
  projectCount: number;
  scrapedAt: string;
  cityCounts: Array<{ slug: string; label: string; count: number }>;
  developerSerpLinks: Array<{ title: string; path: string }>;
  devList?: DevListEntry[];
  projects: Project[];
  units: CatalogUnit[];
}

export interface CatalogMeta {
  unitCount: number;
  projectCount: number;
  scrapedAt: string;
  developerSerpLinks: Array<{ title: string; path: string }>;
  devList: DevListEntry[];
}

export interface FlatUnit {
  project: Project;
  unit: UnitType;
  catalog?: CatalogUnit;
  /**
   * True when this item was pinned by a PAID serp-boost placement (not organic
   * isPremium). The UI must visibly label these ("Featured") — ad disclosure.
   */
  placed?: boolean;
}

export interface CatalogApi {
  meta: CatalogMeta;
  projects: Project[];
  units: CatalogUnit[];
  getDevList(): DevListEntry[];
  getCityCounts(): Array<{
    slug: CitySlug | "all";
    label: string;
    count: number;
  }>;
  getProjectBySlug(slug: string): Project | undefined;
  flattenCatalogUnits(): FlatUnit[];
  flattenProjects(projects: Project[]): FlatUnit[];
  applyCollectionFilter(items: FlatUnit[], collection: CollectionFilter): FlatUnit[];
  filterUnits(items: FlatUnit[], filters: ProjectFilters): FlatUnit[];
  sortUnits(items: FlatUnit[], sort: SortOption): FlatUnit[];
  aggregateProjectView(items: FlatUnit[]): FlatUnit[];
  resolveCompareUnits(ids: `${string}:${string}`[]): FlatUnit[];
}

export const PAGE_SIZE = 24;

/**
 * PF project names often already end with "By {developer}" ("Nesba 1 By
 * Arada") — every downstream composition ("{name} by {developer}", the PDP h1,
 * meta/OG, JSON-LD `name`) then doubles it ("Nesba 1 By Arada by ARADA").
 * Strip the trailing developer mention once here, at the single data chokepoint
 * every server/client catalog read flows through, so the name is clean
 * everywhere. Inlined (not imported from developer-utils) to keep catalog-core a
 * dependency-light leaf. Mirrors developer-utils.stripTrailingDeveloper.
 */
function stripTrailingDeveloperName(name: string, developer?: string): string {
  if (!developer) return name;
  const esc = developer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return name.replace(new RegExp(`\\s+by\\s+${esc}\\s*$`, "i"), "").trim() || name;
}

/** Case/accent-insensitive comparison key (so "Émerge" === "Emerge"). */
function foldKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * PF's location breadcrumb frequently repeats the project name as its trailing
 * comma-segment ("Al Marjan Island, Arthouse Residences", "Meydan, Meydan
 * Avenue, Émerge Residences") — the building name leaks into the location
 * string. This is systematic across the PF catalog (~337 of 767 rows), so fix
 * it deterministically at the single read chokepoint every server/client
 * catalog read flows through rather than hand-editing rows. Only strips the last
 * segment when it equals the project name (accent/case-insensitive) AND at least
 * one location segment remains, so the field is never emptied and real
 * sub-community names are preserved.
 */
export function stripTrailingProjectNameFromArea(
  area: string | undefined,
  name: string,
): string {
  if (!area) return area ?? "";
  const parts = area.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1 && foldKey(parts[parts.length - 1]) === foldKey(name)) {
    parts.pop();
  }
  return parts.join(", ") || area;
}

/**
 * Short, deterministic developer token used to disambiguate a colliding slug
 * ("Aviaan Real Estate Development" → "aviaan", "Elysian Development" →
 * "elysian"). First word of the developer slug; falls back to the full slug.
 */
function developerToken(developer?: string): string {
  const s = slugify(developer ?? "");
  return s.split("-")[0] || s;
}

/**
 * Give a colliding project a distinct, deterministic, still-readable slug so
 * BOTH twins get a reachable URL instead of one being silently dropped. Tries a
 * short developer token first, then the full developer slug, then a numeric
 * suffix — always returning something not already in `taken`.
 */
function disambiguateSlug(
  base: string,
  developer: string | undefined,
  taken: Set<string>,
): string {
  const token = developerToken(developer);
  const candidates = [token && `${base}-${token}`, `${base}-${slugify(developer ?? "")}`];
  for (const c of candidates) {
    if (c && !c.endsWith("-") && !taken.has(c)) return c;
  }
  let i = 2;
  while (taken.has(`${base}-${token || "dup"}-${i}`)) i++;
  return `${base}-${token || "dup"}-${i}`;
}

export interface SlugResolution<T> {
  /** Projects to keep, each carrying its final (possibly disambiguated) slug. */
  kept: T[];
  /** projectId → final slug, for callers that link units back to a project. */
  slugByProjectId: Map<string, string>;
  /** Ids of the kept projects (units of dropped projects should be filtered). */
  keptProjectIds: Set<string>;
}

/**
 * Drop placeholder listings and resolve slug collisions so BOTH the static
 * build (catalog.json), the D1 seed, and every client read agree on the same
 * set of reachable, distinct slugs.
 *
 * - The FIRST project to claim a slug keeps it unchanged (existing URL / SEO is
 *   preserved for the winner).
 * - A genuinely different project (different id) that wants an already-taken
 *   slug is DISAMBIGUATED (given a distinct slug) rather than dropped — the old
 *   behaviour silently discarded the twin and made its inventory unreachable.
 * - The bait-and-switch guard is kept for TRUE duplicates: a repeated row with
 *   an id already kept is dropped (an identical project accidentally listed
 *   twice — same id — must not spawn a second page).
 *
 * Deterministic: same input ordering → same slugs every build. Idempotent: run
 * again over already-disambiguated rows (e.g. D1 reads after the seed applied
 * the same resolution) and nothing changes.
 */
export function resolveProjectSlugs<
  T extends { id: string; slug: string; developer?: string; name: string },
>(rawProjects: T[]): SlugResolution<T> {
  const seenSlugs = new Set<string>();
  const keptProjectIds = new Set<string>();
  const slugByProjectId = new Map<string, string>();
  const kept: T[] = [];
  for (const p of rawProjects) {
    if (isPlaceholderProject(p.name)) continue;
    // True duplicate: this exact project id was already kept. Drop it (the twin
    // resolution below only fires for DIFFERENT ids sharing a slug).
    if (keptProjectIds.has(p.id)) continue;
    let slug = p.slug;
    if (seenSlugs.has(slug)) {
      slug = disambiguateSlug(p.slug, p.developer, seenSlugs);
    }
    seenSlugs.add(slug);
    keptProjectIds.add(p.id);
    slugByProjectId.set(p.id, slug);
    kept.push(slug === p.slug ? p : ({ ...p, slug } as T));
  }
  return { kept, slugByProjectId, keptProjectIds };
}

/**
 * Fix wrongly all-caps scraped developer names to their real brand casing.
 * Scoped to VERIFIED cases only — DIFC/IMKAN/ORA are legitimately all-caps
 * brands, so no blanket title-casing. slugify() is case-insensitive, so the
 * developer URL (/developers/arada) is unchanged; only the display label fixes.
 */
const DEVELOPER_DISPLAY_CASING: Record<string, string> = {
  ARADA: "Arada",
};

function normalizeProject(p: Project & { citySlug?: string }): Project {
  const slug = (p.citySlug || p.city) as Project["city"];
  const developer = DEVELOPER_DISPLAY_CASING[p.developer] ?? p.developer;
  const pfFaqs = p.pfFaqs ? sanitizePfFaqs(p.pfFaqs) : undefined;
  // A project whose handover quarter is already in the past can't honestly be
  // labelled "off-plan" (upcoming). 26 such rows carry a pre-2026 handover but
  // status "off-plan" → relabel to "ready" so the developer-card badge reads
  // correctly. (2026 hardcoded to match the Latest-Launches guard; keeps
  // static build == D1 deterministic rather than drifting with request time.)
  const hy = handoverYear(p.handover);
  const status: Project["status"] =
    p.status === "off-plan" && hy != null && hy < 2026 ? "ready" : p.status;
  const name = stripTrailingDeveloperName(p.name, p.developer);
  return {
    ...p,
    name,
    developer,
    area: stripTrailingProjectNameFromArea(p.area, name),
    status,
    city: slug,
    imageGradient: p.imageGradient ?? "from-slate-800 via-slate-600 to-sky-700",
    featuredRank: p.featuredRank ?? 999,
    pfFaqs: pfFaqs && pfFaqs.length > 0 ? pfFaqs : undefined,
  };
}

/** Sort key that pushes no-price (launchPriceAed 0) units to the bottom of an
 * ascending price sort instead of the top. */
function priceAscKey(item: FlatUnit): number {
  return item.unit.launchPriceAed > 0
    ? item.unit.launchPriceAed
    : Number.POSITIVE_INFINITY;
}

function handoverValue(handover?: string): number {
  if (!handover) return 9999;
  const match = handover.match(/Q(\d)\s+(\d{4})/);
  if (!match) return 9999;
  return Number(match[2]) * 10 + Number(match[1]);
}

export function handoverYear(handover?: string): number | null {
  const match = handover?.match(/(\d{4})/);
  return match ? Number(match[1]) : null;
}

/**
 * Payment-plan classification from the scraped label:
 * "10/35/5/50" (4 segments, last > 0) = post-handover plan;
 * "N Payment Plans" (paymentPlanCount > 1) = multiple plans.
 */
export function matchesPaymentPlan(
  plan: string | undefined,
  planCount: number | undefined,
  filter: "post-handover" | "multiple",
): boolean {
  if (filter === "multiple") return (planCount ?? 0) > 1;
  if (!plan) return false;
  const segments = plan.split("/").map((s) => Number(s.trim()));
  return segments.length >= 4 && segments.every(Number.isFinite) && segments[3] > 0;
}

/** PF publishes unnamed placeholder listings ("New Project by X") — never a
 * real, linkable project. */
export function isPlaceholderProject(name: string): boolean {
  return /^\s*new project by\b/i.test(name);
}

export function createCatalogApi(raw: CatalogFile): CatalogApi {
  // Drop placeholder listings and resolve slug collisions (identical rule to the
  // D1 seed, so static build, D1, and the client all agree). Two DIFFERENT
  // projects previously shared one URL (arthouse-residences = Cledor + Aviaan;
  // emerge-residences = NAAS + Elysian): first-wins silently DROPPED the twin,
  // making its inventory unreachable. Now the twin is disambiguated to a
  // distinct slug so both are reachable, while the winner's slug is preserved
  // and true duplicates (same id repeated) are still dropped.
  const { kept: rawProjects, keptProjectIds } = resolveProjectSlugs(raw.projects);
  const projects = rawProjects.map((p) =>
    normalizeProject(p as Project & { citySlug?: string }),
  );
  const units = raw.units.filter((u) => keptProjectIds.has(u.projectId));
  const meta: CatalogMeta = {
    // Recompute from the filtered set so headline counts match what's browsable
    // (dropping placeholders/dup-slugs would otherwise leave stats overstated).
    unitCount: units.length,
    projectCount: projects.length,
    scrapedAt: raw.scrapedAt,
    developerSerpLinks: raw.developerSerpLinks,
    devList: raw.devList ?? [],
  };

  function getCityCounts() {
    const all = raw.cityCounts.reduce((s, c) => s + c.count, 0);
    return [
      { slug: "all" as const, label: "All UAE", count: all },
      ...raw.cityCounts.map((c) => ({
        slug: c.slug as CitySlug,
        label: c.label,
        count: c.count,
      })),
    ];
  }

  function flattenCatalogUnits(): FlatUnit[] {
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const out: FlatUnit[] = [];
    for (const cu of units) {
      const project = projectById.get(cu.projectId);
      if (!project) continue;
      const unit: UnitType = {
        id: cu.id,
        beds: cu.beds,
        sqftMin: cu.sqftMin,
        sqftMax: cu.sqftMax,
        launchPriceAed: cu.launchPriceAed,
        launchPriceMaxAed: cu.launchPriceMaxAed,
        propertyType: cu.propertyType,
      };
      out.push({ project, unit, catalog: cu });
    }
    return out;
  }

  return {
    meta,
    projects,
    units,
    getDevList: () => meta.devList,
    getCityCounts,
    getProjectBySlug: (slug) => projects.find((p) => p.slug === slug),
    flattenCatalogUnits,
    flattenProjects: (list) =>
      list.flatMap((project) => project.units.map((unit) => ({ project, unit }))),
    applyCollectionFilter(items, collection) {
      if (collection === "all") return items;
      return items.filter((item) => {
        switch (collection) {
          case "premium":
            return item.catalog?.isPremium ?? item.project.isPremium;
          case "brochure":
            return hasBrochure(item);
          case "video":
            // Real, embeddable video — videoUrl is only set for videos, not tours.
            return Boolean(item.project.videoUrl);
          case "tour":
            // Has media but no video = virtual tour only. Use fresh D1 fields
            // (item.project) — item.catalog can carry a stale videoAvailable.
            return Boolean(item.project.videoAvailable && !item.project.videoUrl);
          case "under-2m":
            return (
              item.unit.launchPriceAed > 0 &&
              item.unit.launchPriceAed <= 2_000_000
            );
          case "studio":
            return item.unit.beds === 0;
          case "waterfront":
            return isWaterfront(item);
          default:
            return true;
        }
      });
    },
    filterUnits(items, filters) {
      const q = filters.query.trim().toLowerCase();
      return items.filter(({ project, unit, catalog: cu }) => {
        const citySlug = cu?.citySlug ?? project.city;
        if (filters.city !== "all" && citySlug !== filters.city) return false;
        if (
          filters.propertyType !== "all" &&
          unit.propertyType !== filters.propertyType
        )
          return false;
        if (filters.beds !== "all") {
          if (filters.beds === "studio" && unit.beds !== 0) return false;
          else if (filters.beds === 5 && unit.beds < 5) return false;
          else if (
            filters.beds !== "studio" &&
            filters.beds !== 5 &&
            unit.beds !== filters.beds
          )
            return false;
        }
        if (filters.minPrice != null && unit.launchPriceAed < filters.minPrice)
          return false;
        if (filters.maxPrice != null && unit.launchPriceAed > filters.maxPrice)
          return false;
        if (filters.developer && filters.developer !== "all") {
          const devSlug = slugify(cu?.developer ?? project.developer);
          if (devSlug !== filters.developer) return false;
        }
        if (filters.paymentPlan && filters.paymentPlan !== "all") {
          const plan = cu?.paymentPlan ?? project.paymentPlan;
          const planCount = cu?.paymentPlanCount ?? project.paymentPlanCount;
          if (!matchesPaymentPlan(plan, planCount, filters.paymentPlan)) return false;
        }
        if (filters.handoverBy && filters.handoverBy !== "all") {
          const year = handoverYear(cu?.handover ?? project.handover);
          if (year == null || year > filters.handoverBy) return false;
        }
        if (filters.amenities && filters.amenities.length > 0) {
          const projectAmenities = (project.amenities ?? []).map((a) =>
            a.toLowerCase(),
          );
          if (projectAmenities.length === 0) return false;
          const allPresent = filters.amenities.every((wanted) =>
            projectAmenities.some((a) => a.includes(wanted.toLowerCase())),
          );
          if (!allPresent) return false;
        }
        if (!q) return true;

        const haystack = [
          project.name,
          project.developer,
          project.area,
          cu?.locationFull ?? project.locationFull,
          project.city,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    },
    sortUnits(items, sort) {
      const sorted = [...items];
      switch (sort) {
        case "price-asc":
          // Units with no PF-stated price (launchPriceAed 0) must sink to the
          // bottom, not lead the SERP with "Price on request" cards.
          sorted.sort((a, b) => priceAscKey(a) - priceAscKey(b));
          break;
        case "price-desc":
          sorted.sort((a, b) => b.unit.launchPriceAed - a.unit.launchPriceAed);
          break;
        case "handover-asc":
          sorted.sort(
            (a, b) =>
              handoverValue(a.project.handover) -
              handoverValue(b.project.handover),
          );
          break;
        case "handover-desc":
          sorted.sort(
            (a, b) =>
              handoverValue(b.project.handover) -
              handoverValue(a.project.handover),
          );
          break;
        case "value-asc":
          // Zero-price units have a meaningless value score — keep them last.
          sorted.sort((a, b) => {
            const av = a.unit.launchPriceAed > 0 ? valueScore(a) : Number.POSITIVE_INFINITY;
            const bv = b.unit.launchPriceAed > 0 ? valueScore(b) : Number.POSITIVE_INFINITY;
            return av - bv;
          });
          break;
        default:
          sorted.sort((a, b) => {
            const ap = a.catalog?.isPremium ? 0 : 1;
            const bp = b.catalog?.isPremium ? 0 : 1;
            if (ap !== bp) return ap - bp;
            return a.project.name.localeCompare(b.project.name);
          });
      }
      return sorted;
    },
    aggregateProjectView(items) {
      const seen = new Set<string>();
      const out: FlatUnit[] = [];
      for (const item of items) {
        if (seen.has(item.project.id)) continue;
        seen.add(item.project.id);
        const cheapest = items
          .filter((x) => x.project.id === item.project.id)
          .sort((a, b) => priceAscKey(a) - priceAscKey(b))[0];
        out.push(cheapest ?? item);
      }
      return out;
    },
    resolveCompareUnits(ids) {
      const index = new Map(
        flattenCatalogUnits().map((item) => [
          `${item.project.id}:${item.unit.id}`,
          item,
        ]),
      );
      return ids
        .map((id) => index.get(id))
        .filter((item): item is FlatUnit => Boolean(item));
    },
  };
}