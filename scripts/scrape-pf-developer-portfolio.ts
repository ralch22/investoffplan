#!/usr/bin/env npx tsx
/**
 * Ingest missing developer portfolio projects from PF dev SERP pages.
 *
 *   npx tsx scripts/scrape-pf-developer-portfolio.ts --slug emaar-properties
 *   npx tsx scripts/scrape-pf-developer-portfolio.ts --all-devlist
 *   npx tsx scripts/scrape-pf-developer-portfolio.ts --slug emaar-properties --limit 5 --dry-run
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import {
  formatHandover,
  formatPaymentPlanFromPhases,
  initials,
  mapStockStatus,
  normalizeUnitSize,
  parseCity,
  projectSlugFromPf,
} from "./lib/pf-ingest-helpers";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const DEV_BASE = "https://www.propertyfinder.ae/en/new-projects/dev";
const PAGE_DELAY_MS = 1200;
const PDP_DELAY_MS = 700;
const DEFAULT_WHATSAPP = process.env.IOP_WHATSAPP || "+971500000000";

interface CatalogFile {
  version: 2;
  source?: string;
  scrapedAt: string;
  unitCount: number;
  projectCount: number;
  cityCounts: Array<{ slug: string; label: string; count: number }>;
  developerSerpLinks: Array<{ title: string; path: string }>;
  devList?: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    description?: string;
    establishedSince?: string;
    numProjectsOnline?: number;
    devPageEnabled?: boolean;
  }>;
  projects: CatalogProject[];
  units: CatalogUnit[];
}

interface CatalogProject {
  id: string;
  slug: string;
  pfSlug?: string;
  name: string;
  developer: string;
  developerInitials: string;
  developerLogo?: string;
  city: string;
  citySlug?: string;
  area: string;
  locationFull?: string;
  status: string;
  handover?: string;
  paymentPlan: string;
  paymentPlanCount?: number;
  isPremium: boolean;
  unitCount: number;
  imageUrl?: string;
  imageGallery?: string[];
  videoAvailable?: boolean;
  coordinates?: { lat: number; lng: number };
  brochureUrl?: string;
  description?: string;
  amenities?: string[];
  masterPlanUrl?: string;
  videoUrl?: string;
  whatsapp: string;
  units: Array<{
    id: string;
    beds: number;
    sqftMin: number;
    sqftMax?: number;
    launchPriceAed: number;
    launchPriceMaxAed?: number;
    propertyType: string;
  }>;
}

interface CatalogUnit {
  id: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  pfSlug?: string;
  developer: string;
  developerLogo?: string;
  city: string;
  citySlug: string;
  area: string;
  locationFull: string;
  propertyType: string;
  beds: number;
  sqftMin: number;
  sqftMax?: number;
  launchPriceAed: number;
  launchPriceMaxAed?: number;
  paymentPlan: string;
  paymentPlanCount?: number;
  handover?: string;
  isPremium: boolean;
  imageUrl?: string;
  imageGallery?: string[];
  videoAvailable?: boolean;
  coordinates?: { lat: number; lng: number };
  projectUnitCount: number;
  whatsapp: string;
  status: string;
}

interface PfDetailResult {
  id: string;
  slug: string;
  title: string;
  stockAvailability?: string;
  salesPhase?: string;
  startingPrice?: number;
  deliveryDate?: string;
  description?: string;
  brochureUrl?: string;
  amenities?: Array<{ name: string }>;
  masterPlan?: { url?: string; image?: string };
  videoUrl?: string;
  images?: Array<{ medium?: string; large?: string; small?: string }>;
  developer: { name: string; logoUrl?: string; slug?: string };
  location: {
    fullName: string;
    coordinates?: { lat: number; lng?: number; lon?: number };
  };
  paymentPlans?: Array<{
    phases?: Array<{ label: string; value: number }>;
    title?: string;
  }>;
  propertyTypes?: string[];
  units?: Array<{
    units: Array<{
      propertyType: string;
      list: Array<{
        bedrooms: number;
        areaFrom: number;
        areaTo: number;
        startingPrice: number;
      }>;
    }>;
  }>;
}

function parseArgs() {
  const slugIdx = process.argv.indexOf("--slug");
  const slug =
    slugIdx >= 0 && process.argv[slugIdx + 1]
      ? process.argv[slugIdx + 1]
      : null;
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && process.argv[limitIdx + 1]
      ? Number(process.argv[limitIdx + 1])
      : null;
  return {
    slug,
    allDevlist: process.argv.includes("--all-devlist"),
    limit,
    dryRun: process.argv.includes("--dry-run"),
    offPlanOnly: process.argv.includes("--off-plan-only"),
  };
}

async function fetchDevPageMeta(
  page: Page,
  devSlug: string,
  pageNum: number,
): Promise<{ totalPages: number; pfSlugs: string[] }> {
  const url =
    pageNum === 1
      ? `${DEV_BASE}/${devSlug}`
      : `${DEV_BASE}/${devSlug}?page=${pageNum}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(5000);

  return page.evaluate((slug) => {
    const el = document.getElementById("__NEXT_DATA__");
    const parsed = JSON.parse(el?.textContent || "{}");
    const meta = parsed?.props?.pageProps?.searchResult?.meta;
    const totalPages = meta?.pagination?.total ?? 1;
    const links = [
      ...document.querySelectorAll(`a[href*="/en/new-projects/${slug}/"]`),
    ]
      .map((a) => (a as HTMLAnchorElement).getAttribute("href"))
      .filter(Boolean);
    const pfSlugs = [
      ...new Set(
        links
          .map((href) =>
            href!
              .replace(/^.*\/en\/new-projects\//, "")
              .replace(/\?.*$/, "")
              .replace(/\/$/, ""),
          )
          .filter((value) => value.startsWith(`${slug}/`)),
      ),
    ];
    return { totalPages, pfSlugs };
  }, devSlug);
}

async function collectDevPfSlugs(
  page: Page,
  devSlug: string,
): Promise<string[]> {
  const first = await fetchDevPageMeta(page, devSlug, 1);
  const all = new Set(first.pfSlugs);
  console.log(
    `[dev-portfolio] ${devSlug} page 1/${first.totalPages} — ${first.pfSlugs.length} projects`,
  );

  for (let p = 2; p <= first.totalPages; p++) {
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    const res = await fetchDevPageMeta(page, devSlug, p);
    res.pfSlugs.forEach((slug) => all.add(slug));
    console.log(
      `[dev-portfolio] ${devSlug} page ${p}/${first.totalPages} — +${res.pfSlugs.length} (running ${all.size})`,
    );
  }

  return [...all];
}

async function fetchDetail(page: Page, pfSlug: string): Promise<PfDetailResult | null> {
  const url = `https://www.propertyfinder.ae/en/new-projects/${pfSlug}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(
    () => {
      const el = document.getElementById("__NEXT_DATA__");
      if (!el?.textContent) return false;
      try {
        const data = JSON.parse(el.textContent);
        return Boolean(data?.props?.pageProps?.detailResult?.id);
      } catch {
        return false;
      }
    },
    { timeout: 90000 },
  );

  return page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    const data = JSON.parse(el!.textContent!);
    return data.props.pageProps.detailResult as PfDetailResult;
  });
}

function detailToProject(detail: PfDetailResult): CatalogProject {
  const { city, citySlug, area } = parseCity(detail.location.fullName);
  const pay = formatPaymentPlanFromPhases(detail.paymentPlans);
  const handover = formatHandover(detail.deliveryDate);
  const status = mapStockStatus(detail.stockAvailability, detail.salesPhase);
  const imageUrl = detail.images?.[0]?.medium || detail.images?.[0]?.small;
  const imageGallery = detail.images
    ?.map((img) => img.medium || img.large || img.small)
    .filter(Boolean) as string[] | undefined;
  const coords = detail.location.coordinates;
  const coordinates = coords
    ? { lat: coords.lat, lng: coords.lng ?? coords.lon ?? 0 }
    : undefined;
  const masterPlanImage =
    detail.masterPlan?.url ?? detail.masterPlan?.image;

  const unitRows: CatalogProject["units"] = [];
  const seen = new Set<string>();

  for (const block of detail.units ?? []) {
    for (const group of block.units ?? []) {
      for (const band of group.list ?? []) {
        const key = `${group.propertyType}:${band.bedrooms}:${band.areaFrom}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const launchPriceAed =
          band.startingPrice > 0
            ? band.startingPrice
            : (detail.startingPrice ?? 0);
        const size = normalizeUnitSize({
          beds: band.bedrooms,
          sqftMin: band.areaFrom,
          sqftMax: band.areaTo !== band.areaFrom ? band.areaTo : undefined,
          priceAed: launchPriceAed,
        });
        unitRows.push({
          id: `${detail.id}::${group.propertyType}::${band.bedrooms}::${band.areaFrom}`,
          beds: band.bedrooms,
          sqftMin: size.sqftMin,
          sqftMax: size.sqftMax,
          launchPriceAed,
          propertyType: group.propertyType,
        });
      }
    }
  }

  if (unitRows.length === 0) {
    const propertyType = detail.propertyTypes?.[0] ?? "apartment";
    unitRows.push({
      id: `${detail.id}::${propertyType}::0`,
      beds: 0,
      sqftMin: 0,
      launchPriceAed: detail.startingPrice ?? 0,
      propertyType,
    });
  }

  if (
    detail.startingPrice &&
    detail.startingPrice > 0 &&
    unitRows.every((unit) => unit.launchPriceAed <= 0)
  ) {
    unitRows[0].launchPriceAed = detail.startingPrice;
  }

  return {
    id: detail.id,
    slug: projectSlugFromPf(detail.slug),
    pfSlug: detail.slug,
    name: detail.title,
    developer: detail.developer.name,
    developerInitials: initials(detail.developer.name),
    developerLogo: detail.developer.logoUrl,
    city,
    citySlug,
    area,
    locationFull: detail.location.fullName,
    status,
    handover,
    paymentPlan: pay.label.replace(/^Payment Plan: /, ""),
    paymentPlanCount: pay.count,
    isPremium: false,
    unitCount: unitRows.length,
    imageUrl,
    imageGallery,
    videoAvailable: Boolean(detail.videoUrl),
    coordinates,
    brochureUrl: detail.brochureUrl,
    description: detail.description,
    amenities: detail.amenities?.map((a) => a.name),
    masterPlanUrl: masterPlanImage,
    videoUrl: detail.videoUrl,
    whatsapp: DEFAULT_WHATSAPP,
    units: unitRows,
  };
}

function projectToCatalogUnits(project: CatalogProject): CatalogUnit[] {
  const { city, citySlug, area } = parseCity(
    project.locationFull ?? `${project.city},${project.area}`,
  );

  return project.units.map((unit) => ({
    id: unit.id,
    projectId: project.id,
    projectSlug: project.slug,
    projectName: project.name,
    pfSlug: project.pfSlug,
    developer: project.developer,
    developerLogo: project.developerLogo,
    city,
    citySlug,
    area,
    locationFull: project.locationFull ?? `${city}, ${area}`,
    propertyType: unit.propertyType,
    beds: unit.beds,
    sqftMin: unit.sqftMin,
    sqftMax: unit.sqftMax,
    launchPriceAed: unit.launchPriceAed,
    launchPriceMaxAed: unit.launchPriceMaxAed,
    paymentPlan: project.paymentPlan,
    paymentPlanCount: project.paymentPlanCount,
    handover: project.handover,
    isPremium: project.isPremium,
    imageUrl: project.imageUrl,
    imageGallery: project.imageGallery,
    videoAvailable: project.videoAvailable ?? false,
    coordinates: project.coordinates,
    projectUnitCount: project.unitCount,
    whatsapp: project.whatsapp,
    status: project.status,
  }));
}

function rebuildCityCounts(units: CatalogUnit[]) {
  const cityCounts = new Map<
    string,
    { slug: string; label: string; count: number }
  >();
  for (const unit of units) {
    const existing = cityCounts.get(unit.citySlug);
    if (existing) existing.count++;
    else {
      cityCounts.set(unit.citySlug, {
        slug: unit.citySlug,
        label: unit.city,
        count: 1,
      });
    }
  }
  return [...cityCounts.values()].sort((a, b) => b.count - a.count);
}

async function ingestDeveloper(
  listPage: Page,
  pdpPage: Page,
  catalog: CatalogFile,
  devSlug: string,
  opts: { limit: number | null; dryRun: boolean; offPlanOnly: boolean },
) {
  const existingPfSlugs = new Set(
    catalog.projects.map((p) => p.pfSlug).filter(Boolean) as string[],
  );
  const portfolioSlugs = await collectDevPfSlugs(listPage, devSlug);
  const missing = portfolioSlugs.filter((slug) => !existingPfSlugs.has(slug));
  const slice = opts.limit ? missing.slice(0, opts.limit) : missing;

  console.log(
    `[dev-portfolio] ${devSlug}: portfolio=${portfolioSlugs.length} existing=${portfolioSlugs.length - missing.length} missing=${missing.length}`,
  );

  if (slice.length === 0) {
    console.log(`[dev-portfolio] ${devSlug}: nothing to ingest`);
    return { addedProjects: 0, addedUnits: 0 };
  }

  if (opts.dryRun) {
    console.log(`[dev-portfolio] dry-run would ingest ${slice.length} projects:`);
    slice.slice(0, 10).forEach((slug) => console.log(`  - ${slug}`));
    if (slice.length > 10) console.log(`  … +${slice.length - 10} more`);
    return { addedProjects: 0, addedUnits: 0 };
  }

  let addedProjects = 0;
  let addedUnits = 0;

  for (const pfSlug of slice) {
    await new Promise((r) => setTimeout(r, PDP_DELAY_MS));
    try {
      const detail = await fetchDetail(pdpPage, pfSlug);
      if (!detail?.id) {
        console.warn(`[dev-portfolio] skip ${pfSlug}: no detailResult`);
        continue;
      }

      const status = mapStockStatus(detail.stockAvailability, detail.salesPhase);
      if (opts.offPlanOnly && status === "sold-out") {
        console.log(`[dev-portfolio] skip sold-out ${pfSlug}`);
        continue;
      }

      const project = detailToProject(detail);
      const catalogUnits = projectToCatalogUnits(project);
      catalog.projects.push(project);
      catalog.units.push(...catalogUnits);
      existingPfSlugs.add(pfSlug);
      addedProjects++;
      addedUnits += catalogUnits.length;
      console.log(
        `[dev-portfolio] +${project.name} (${project.status}, ${catalogUnits.length} units)`,
      );
    } catch (error) {
      console.warn(
        `[dev-portfolio] failed ${pfSlug}: ${(error as Error).message}`,
      );
    }
  }

  return { addedProjects, addedUnits };
}

async function main() {
  const { slug, allDevlist, limit, dryRun, offPlanOnly } = parseArgs();
  if (!slug && !allDevlist) {
    console.error(
      "Usage: --slug emaar-properties | --all-devlist [--limit N] [--dry-run] [--off-plan-only]",
    );
    process.exit(1);
  }

  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as CatalogFile;
  const devSlugs = allDevlist
    ? (catalog.devList ?? []).map((dev) => dev.slug)
    : [slug!];

  console.log(
    `[dev-portfolio] starting for ${devSlugs.length} developer(s)…`,
  );

  const browser = await chromium.launch({ headless: true });
  const listPage = await browser.newPage();
  const pdpPage = await browser.newPage();

  let totalProjects = 0;
  let totalUnits = 0;

  try {
    for (const devSlug of devSlugs) {
      const result = await ingestDeveloper(listPage, pdpPage, catalog, devSlug, {
        limit,
        dryRun,
        offPlanOnly,
      });
      totalProjects += result.addedProjects;
      totalUnits += result.addedUnits;
    }
  } finally {
    await browser.close();
  }

  if (dryRun || totalProjects === 0) {
    console.log("[dev-portfolio] done (no catalog write)");
    return;
  }

  catalog.projectCount = catalog.projects.length;
  catalog.unitCount = catalog.units.length;
  catalog.cityCounts = rebuildCityCounts(catalog.units);
  catalog.scrapedAt = new Date().toISOString();
  catalog.source = catalog.source
    ? `${catalog.source}+developer-portfolio`
    : "propertyfinder-developer-portfolio";

  writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[dev-portfolio] Wrote +${totalProjects} projects, +${totalUnits} units → ${catalog.projectCount} projects, ${catalog.unitCount} units`,
  );
}

main().catch((error) => {
  console.error("[dev-portfolio] fatal:", (error as Error).message);
  process.exit(1);
});