import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "data", "catalog.json");
const outDir = join(root, "public", "data");

mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "catalog.json"));

const catalog = JSON.parse(readFileSync(src, "utf8"));

const meta = {
  version: catalog.version,
  unitCount: catalog.unitCount,
  projectCount: catalog.projectCount,
  scrapedAt: catalog.scrapedAt,
};

writeFileSync(join(outDir, "catalog-meta.json"), `${JSON.stringify(meta)}\n`, "utf8");
writeFileSync(join(root, "public", "catalog-meta.json"), `${JSON.stringify(meta)}\n`, "utf8");

const mapProjects = catalog.projects
  .filter((p) => p.coordinates)
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    developer: p.developer,
    area: p.area,
    city: p.city,
    lat: p.coordinates.lat,
    lng: p.coordinates.lng,
    minPriceAed: Math.min(...p.units.map((u) => u.launchPriceAed)),
    handover: p.handover,
    imageUrl: p.imageUrl,
  }));

const mapFile = { scrapedAt: catalog.scrapedAt, projects: mapProjects };
writeFileSync(join(outDir, "catalog-map.json"), `${JSON.stringify(mapFile)}\n`, "utf8");

// Build locationFull (project-level) and minPrice for lite slice
const locationByProjectId = {};
const minPriceByProjectId = {};
for (const u of catalog.units || []) {
  if (u.locationFull && !locationByProjectId[u.projectId]) {
    locationByProjectId[u.projectId] = u.locationFull;
  }
}
for (const p of catalog.projects || []) {
  if (p.units && p.units.length) {
    minPriceByProjectId[p.id] = Math.min(...p.units.map((u) => u.launchPriceAed));
  }
}

function slimProject(p) {
  return {
    id: p.id,
    slug: p.slug,
    pfSlug: p.pfSlug,
    name: p.name,
    developer: p.developer,
    developerInitials: p.developerInitials,
    developerLogo: p.developerLogo,
    city: p.city,
    citySlug: p.citySlug,
    area: p.area,
    locationFull: p.locationFull || locationByProjectId[p.id],
    minPriceAed: p.minPriceAed || minPriceByProjectId[p.id],
    status: p.status,
    handover: p.handover,
    paymentPlan: p.paymentPlan,
    paymentPlanCount: p.paymentPlanCount,
    isPremium: p.isPremium,
    unitCount: p.unitCount,
    featuredRank: p.featuredRank,
    imageGradient: p.imageGradient,
    imageUrl: p.imageUrl,
    imageGallery: p.imageGallery,
    videoAvailable: p.videoAvailable,
    videoUrl: p.videoUrl ?? null,
    coordinates: p.coordinates,
    brochureUrl: p.brochureUrl,
    masterPlanUrl: p.masterPlanUrl,
    whatsapp: p.whatsapp,
    units: [],
  };
}

function slimUnit(u) {
  // Keep only unit-variant fields + project ref. Drop imageGallery (heavy, PDP only) and all
  // duplicated project metadata (locationFull, prices etc now on project or fallbacks).
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

const liteCatalog = {
  version: catalog.version,
  unitCount: catalog.unitCount,
  projectCount: catalog.projectCount,
  scrapedAt: catalog.scrapedAt,
  cityCounts: catalog.cityCounts,
  developerSerpLinks: catalog.developerSerpLinks,
  devList: catalog.devList,
  projects: catalog.projects.map(slimProject),
  units: catalog.units.map(slimUnit),
};

writeFileSync(
  join(outDir, "catalog-lite.json"),
  `${JSON.stringify(liteCatalog)}\n`,
  "utf8",
);

// Top DLD areas by gross rental yield — powers the smart-search "yield" intent.
const dldStats = JSON.parse(
  readFileSync(join(root, "data", "dld-area-stats.json"), "utf8"),
);
const yieldCommunities = Object.entries(dldStats.areas || {})
  .filter(([, a]) => a.grossYieldPct != null && a.saleSample >= 40)
  .sort(([, a], [, b]) => b.grossYieldPct - a.grossYieldPct)
  .slice(0, 40)
  .map(([key, a]) => ({ key, name: a.areaLabel, grossYieldPct: a.grossYieldPct }));

writeFileSync(
  join(outDir, "yield-communities.json"),
  `${JSON.stringify(yieldCommunities)}\n`,
  "utf8",
);

const liteKb = Math.round(JSON.stringify(liteCatalog).length / 1024);
console.log(
  `[sync-catalog] catalog.json + lite (${liteKb}KB) + map (${meta.unitCount} units, ${mapProjects.length} pins) + yield (${yieldCommunities.length} areas)`,
);