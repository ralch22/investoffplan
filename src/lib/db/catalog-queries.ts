import { asc, eq, inArray } from "drizzle-orm";
import { createCatalogApi, type CatalogFile, PAGE_SIZE } from "@/lib/catalog-core";
import type { CatalogUnit, CollectionFilter, Project, ProjectFilters, SortOption, ViewMode } from "@/lib/types";
import { getMapProjectsFromList } from "@/lib/map-data";
import type { CatalogDatabase } from "./client";
import { rowToCatalogUnit, rowToDevListEntry, rowToProject } from "./mappers";
import {
  catalogMeta,
  catalogUnits,
  cityCounts,
  developerSerpLinks,
  developers,
  projectUnits,
  projects,
} from "./schema";

export async function isCatalogDbSeeded(db: CatalogDatabase): Promise<boolean> {
  const meta = await db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get();
  return Boolean(meta);
}

export async function fetchCatalogMeta(db: CatalogDatabase) {
  const [meta, cities, serpLinks, devRows] = await Promise.all([
    db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get(),
    db.select().from(cityCounts).orderBy(asc(cityCounts.sortOrder)).all(),
    db.select().from(developerSerpLinks).orderBy(asc(developerSerpLinks.sortOrder)).all(),
    db.select().from(developers).all(),
  ]);

  if (!meta) return null;

  return {
    version: meta.version as 2,
    unitCount: meta.unitCount,
    projectCount: meta.projectCount,
    scrapedAt: meta.scrapedAt,
    cityCounts: cities.map((c) => ({
      slug: c.slug,
      label: c.label,
      count: c.count,
    })),
    developerSerpLinks: serpLinks.map((l) => ({
      title: l.title,
      path: l.path,
    })),
    devList: devRows.map(rowToDevListEntry),
  };
}

async function fetchAllProjects(db: CatalogDatabase): Promise<Project[]> {
  const [projectRows, unitRows] = await Promise.all([
    db.select().from(projects).all(),
    db.select().from(projectUnits).orderBy(asc(projectUnits.sortOrder)).all(),
  ]);

  const unitsByProject = new Map<string, typeof unitRows>();
  for (const unit of unitRows) {
    const list = unitsByProject.get(unit.projectId) ?? [];
    list.push(unit);
    unitsByProject.set(unit.projectId, list);
  }

  return projectRows.map((row) =>
    rowToProject(row, unitsByProject.get(row.id) ?? []),
  );
}

function slimProjectForLite(project: Project): Project {
  return {
    ...project,
    units: [],
    description: undefined,
    amenities: undefined,
  };
}

function slimUnitForLite(u: any) {
  // Minimal unit for lite slice (grid perf). Heavy fields + project dups stripped;
  // locationFull and minPriceAed live on project in lite.
  return {
    id: u.id,
    projectId: u.projectId,
    beds: u.beds,
    sqftMin: u.sqftMin,
    sqftMax: u.sqftMax,
    launchPriceAed: u.launchPriceAed,
    launchPriceMaxAed: u.launchPriceMaxAed,
    propertyType: u.propertyType,
  };
}

export async function fetchCatalogLite(db: CatalogDatabase): Promise<CatalogFile | null> {
  const full = await fetchCatalogFile(db);
  if (!full) return null;

  const locMap = new Map<string, string>();
  (full.units || []).forEach((u: any) => {
    if (u.locationFull && !locMap.has(u.projectId)) {
      locMap.set(u.projectId, u.locationFull);
    }
  });

  const slimProjects = full.projects.map((p) => {
    const sp = slimProjectForLite(p);
    if (!sp.locationFull) {
      sp.locationFull = locMap.get(p.id);
    }
    if (sp.minPriceAed == null && p.units && p.units.length > 0) {
      sp.minPriceAed = Math.min(...p.units.map((u: any) => u.launchPriceAed));
    }
    return sp;
  });

  return {
    ...full,
    projects: slimProjects,
    units: full.units.map(slimUnitForLite) as CatalogUnit[],
  };
}

export async function fetchCatalogFile(db: CatalogDatabase): Promise<CatalogFile | null> {
  const meta = await fetchCatalogMeta(db);
  if (!meta) return null;

  const [projectList, unitRows] = await Promise.all([
    fetchAllProjects(db),
    db.select().from(catalogUnits).all(),
  ]);

  return {
    version: meta.version,
    unitCount: meta.unitCount,
    projectCount: meta.projectCount,
    scrapedAt: meta.scrapedAt,
    cityCounts: meta.cityCounts,
    developerSerpLinks: meta.developerSerpLinks,
    devList: meta.devList,
    projects: projectList,
    units: unitRows.map(rowToCatalogUnit),
  };
}

export async function fetchProjectBySlug(
  db: CatalogDatabase,
  slug: string,
): Promise<Project | null> {
  const projectRow = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .get();
  if (!projectRow) return null;

  const units = await db
    .select()
    .from(projectUnits)
    .where(eq(projectUnits.projectId, projectRow.id))
    .orderBy(asc(projectUnits.sortOrder))
    .all();

  return rowToProject(projectRow, units);
}

export async function fetchProjectsBySlugs(
  db: CatalogDatabase,
  slugs: string[],
): Promise<Project[]> {
  if (!slugs.length) return [];

  const projectRows = await db
    .select()
    .from(projects)
    .where(inArray(projects.slug, slugs))
    .all();
  if (!projectRows.length) return [];

  const projectIds = projectRows.map((p) => p.id);
  const unitRows = await db
    .select()
    .from(projectUnits)
    .where(inArray(projectUnits.projectId, projectIds))
    .orderBy(asc(projectUnits.sortOrder))
    .all();

  const unitsByProject = new Map<string, typeof unitRows>();
  for (const unit of unitRows) {
    const list = unitsByProject.get(unit.projectId) ?? [];
    list.push(unit);
    unitsByProject.set(unit.projectId, list);
  }

  const bySlug = new Map(
    projectRows.map((row) => [
      row.slug,
      rowToProject(row, unitsByProject.get(row.id) ?? []),
    ]),
  );

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((project): project is Project => Boolean(project));
}

export async function fetchMapPayload(db: CatalogDatabase) {
  const meta = await db.select().from(catalogMeta).where(eq(catalogMeta.id, 1)).get();
  if (!meta) return null;

  const projectList = await fetchAllProjects(db);
  return {
    scrapedAt: meta.scrapedAt,
    projects: getMapProjectsFromList(projectList),
  };
}

export interface CatalogProjectsQuery {
  page?: number;
  pageSize?: number;
  view?: ViewMode;
  sort?: SortOption;
  collection?: CollectionFilter;
  filters?: Partial<ProjectFilters>;
}

export async function queryCatalogProjects(
  db: CatalogDatabase,
  query: CatalogProjectsQuery,
) {
  const catalog = await fetchCatalogFile(db);
  if (!catalog) return null;

  const api = createCatalogApi(catalog);
  const pageSize = Math.min(Math.max(query.pageSize ?? PAGE_SIZE, 1), 100);
  const page = Math.max(query.page ?? 1, 1);

  const filters: ProjectFilters = {
    query: query.filters?.query ?? "",
    city: query.filters?.city ?? "all",
    propertyType: query.filters?.propertyType ?? "all",
    beds: query.filters?.beds ?? "all",
    minPrice: query.filters?.minPrice ?? null,
    maxPrice: query.filters?.maxPrice ?? null,
  };

  let items = api.flattenCatalogUnits();
  items = api.applyCollectionFilter(items, query.collection ?? "all");
  items = api.filterUnits(items, filters);
  items = api.sortUnits(items, query.sort ?? "featured");

  if ((query.view ?? "unit") === "project") {
    items = api.aggregateProjectView(items);
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const offset = (page - 1) * pageSize;

  return {
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      view: query.view ?? "unit",
      sort: query.sort ?? "featured",
      collection: query.collection ?? "all",
      filters,
      scrapedAt: catalog.scrapedAt,
    },
    items: items.slice(offset, offset + pageSize),
  };
}