import {
  hasBrochure,
  isWaterfront,
  valueScore,
} from "./investment-metrics";
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

function normalizeProject(p: Project & { citySlug?: string }): Project {
  const slug = (p.citySlug || p.city) as Project["city"];
  return {
    ...p,
    city: slug,
    imageGradient: p.imageGradient ?? "from-slate-800 via-slate-600 to-sky-700",
    featuredRank: p.featuredRank ?? 999,
  };
}

function handoverValue(handover?: string): number {
  if (!handover) return 9999;
  const match = handover.match(/Q(\d)\s+(\d{4})/);
  if (!match) return 9999;
  return Number(match[2]) * 10 + Number(match[1]);
}

export function createCatalogApi(raw: CatalogFile): CatalogApi {
  const projects = raw.projects.map((p) =>
    normalizeProject(p as Project & { citySlug?: string }),
  );
  const units = raw.units;
  const meta: CatalogMeta = {
    unitCount: raw.unitCount,
    projectCount: raw.projectCount,
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
            return item.catalog?.videoAvailable ?? item.project.videoAvailable;
          case "under-2m":
            return item.unit.launchPriceAed <= 2_000_000;
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
          sorted.sort((a, b) => a.unit.launchPriceAed - b.unit.launchPriceAed);
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
          sorted.sort((a, b) => valueScore(a) - valueScore(b));
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
          .sort((a, b) => a.unit.launchPriceAed - b.unit.launchPriceAed)[0];
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