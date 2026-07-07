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
    status: p.status,
    handover: p.handover,
    paymentPlan: p.paymentPlan,
    paymentPlanCount: p.paymentPlanCount,
    isPremium: p.isPremium,
    unitCount: p.unitCount,
    featuredRank: p.featuredRank,
    imageGradient: p.imageGradient,
    imageUrl: p.imageUrl,
    videoAvailable: p.videoAvailable,
    coordinates: p.coordinates,
    brochureUrl: p.brochureUrl,
    masterPlanUrl: p.masterPlanUrl,
    whatsapp: p.whatsapp,
    units: [],
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
  units: catalog.units,
};

writeFileSync(
  join(outDir, "catalog-lite.json"),
  `${JSON.stringify(liteCatalog)}\n`,
  "utf8",
);

const liteKb = Math.round(JSON.stringify(liteCatalog).length / 1024);
console.log(
  `[sync-catalog] catalog.json + lite (${liteKb}KB) + map (${meta.unitCount} units, ${mapProjects.length} pins)`,
);