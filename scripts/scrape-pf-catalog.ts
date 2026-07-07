#!/usr/bin/env npx tsx
/**
 * Ingest Property Finder new-projects unit view into InvestOffPlan catalog.
 * Source: __NEXT_DATA__.props.pageProps.unitLevelListings (24/page, ~63 pages).
 *
 *   npx tsx scripts/scrape-pf-catalog.ts
 *   npx tsx scripts/scrape-pf-catalog.ts --pages 3   # smoke test
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE =
  "https://www.propertyfinder.ae/en/new-projects?view=unit_types";
const OUT = join(process.cwd(), "data", "catalog.json");
const PAGE_DELAY_MS = 1200;

interface PfUnit {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  propertyType: string;
  bedrooms: number;
  area: { min: number; max: number };
  location: { fullName: string; coordinates?: { lat: number; lng: number } };
  startingPrice: { min: number; max: number };
  paymentPlan: Array<{
    downPayment: number;
    duringConstruction: number;
    handover: number;
    afterHandover: number;
  }>;
  images: Array<{ small?: string; medium?: string; large?: string }>;
  videoAvailable?: boolean;
  developer: { name: string; logo?: string; slug?: string };
  completionDate?: string;
  contactOptions?: Array<{ type: string; value?: string }>;
  listingLevel?: string;
  stockStatus?: string;
}

function parseArgs() {
  const pagesIdx = process.argv.indexOf("--pages");
  const maxPages =
    pagesIdx >= 0 && process.argv[pagesIdx + 1]
      ? Number(process.argv[pagesIdx + 1])
      : null;
  return { maxPages };
}

function formatPaymentPlan(
  plans: PfUnit["paymentPlan"],
): { label: string; count?: number } {
  if (!plans?.length) return { label: "" };
  const p = plans[0];
  const label = `${p.downPayment}/${p.duringConstruction}/${p.handover}${p.afterHandover ? `/${p.afterHandover}` : ""}`;
  return plans.length > 1
    ? { label: `${plans.length} Payment Plans`, count: plans.length }
    : { label: `Payment Plan: ${label}` };
}

function formatHandover(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const q = Math.ceil((d.getUTCMonth() + 1) / 3);
  return `Q${q} ${d.getUTCFullYear()}`;
}

function parseCity(fullName: string): {
  city: string;
  citySlug: string;
  area: string;
} {
  const parts = fullName.split(",").map((s) => s.trim());
  const city = parts[0] || "UAE";
  const citySlug = city
    .toLowerCase()
    .replace(/ras al khaimah/i, "rak")
    .replace(/abu dhabi/i, "abu-dhabi")
    .replace(/umm al quwain/i, "umm-al-quwain")
    .replace(/al ain/i, "al-ain")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return { city, citySlug, area: parts.slice(1).join(", ") || city };
}

function projectSlugFromPf(slug: string): string {
  const seg = slug.split("/").pop() || slug;
  return seg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function parsePagePayload(payload: string) {
  const data = JSON.parse(payload);
  const props = data?.props?.pageProps ?? {};
  const units = (props.unitLevelListings ?? []) as PfUnit[];
  const meta = props.searchResult?.meta ?? {};
  const devList = props.devList ?? [];
  const developerSerpLinks =
    props.seoData?.developerSerpPages?.links?.map(
      (l: { title: string; path: string }) => ({
        title: l.title,
        path: l.path,
      }),
    ) ?? [];

  return {
    units,
    total: meta?.count?.total ?? units.length,
    totalPages: meta?.pagination?.total ?? 1,
    devList,
    developerSerpLinks,
  };
}

async function fetchPageUnits(
  browserPage: import("playwright").Page,
  pageNum: number,
): Promise<{
  units: PfUnit[];
  total: number;
  totalPages: number;
  devList: unknown[];
  developerSerpLinks: Array<{ title: string; path: string }>;
}> {
  const url = pageNum === 1 ? BASE : `${BASE}&page=${pageNum}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    await browserPage.goto(url, {
      waitUntil: attempt === 0 ? "networkidle" : "domcontentloaded",
      timeout: 120000,
    });
    await browserPage.waitForFunction(
      () => {
        const el = document.getElementById("__NEXT_DATA__");
        if (!el?.textContent) return false;
        try {
          const data = JSON.parse(el.textContent);
          const listings = data?.props?.pageProps?.unitLevelListings;
          return Array.isArray(listings) && listings.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 90000 },
    );

    const payload = await browserPage.evaluate(() => {
      const el = document.getElementById("__NEXT_DATA__");
      return el?.textContent || "";
    });

    const parsed = parsePagePayload(payload);
    if (parsed.units.length > 0) return parsed;

    console.warn(
      `[scrape-pf] page ${pageNum} empty (attempt ${attempt + 1}/3), retrying…`,
    );
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }

  throw new Error(`[scrape-pf] page ${pageNum} returned 0 unitLevelListings`);
}

async function main() {
  const { maxPages } = parseArgs();
  console.log("[scrape-pf] starting unit-view ingest…");

  const browser = await chromium.launch({ headless: true });
  const browserPage = await browser.newPage();

  try {
    const first = await fetchPageUnits(browserPage, 1);
    if (first.units.length === 0) {
      throw new Error("[scrape-pf] page 1 returned no units — aborting");
    }
    const unitViewPages = first.totalPages;
    if (unitViewPages > 70) {
      throw new Error(
        `[scrape-pf] expected ~63 unit-view pages, got ${unitViewPages} (project view?)`,
      );
    }
    const totalPages = maxPages ?? unitViewPages;
    const allUnits: PfUnit[] = [...first.units];
    let devList = first.devList;
    let developerSerpLinks = first.developerSerpLinks;

    console.log(
      `[scrape-pf] page 1/${totalPages} — ${first.units.length} units (total ${first.total})`,
    );

    for (let p = 2; p <= totalPages; p++) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
      const res = await fetchPageUnits(browserPage, p);
      allUnits.push(...res.units);
      if (res.devList?.length) devList = res.devList;
      if (res.developerSerpLinks?.length)
        developerSerpLinks = res.developerSerpLinks;
      console.log(
        `[scrape-pf] page ${p}/${totalPages} — +${res.units.length} (running ${allUnits.length})`,
      );
    }

  const projectUnitCounts = new Map<string, number>();
  for (const u of allUnits) {
    projectUnitCounts.set(u.projectId, (projectUnitCounts.get(u.projectId) ?? 0) + 1);
  }

  const projectsMap = new Map<
    string,
    {
      id: string;
      slug: string;
      pfSlug: string;
      name: string;
      developer: string;
      developerInitials: string;
      developerLogo?: string;
      city: string;
      citySlug: string;
      area: string;
      handover?: string;
      paymentPlan: string;
      paymentPlanCount?: number;
      isPremium: boolean;
      unitCount: number;
      imageUrl?: string;
      imageGallery?: string[];
      videoAvailable?: boolean;
      coordinates?: { lat: number; lng: number };
      whatsapp: string;
      status: string;
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
  >();

  const DEFAULT_WHATSAPP = process.env.IOP_WHATSAPP || "+971500000000";

  for (const u of allUnits) {
    const { city, citySlug, area } = parseCity(u.location.fullName);
    const pay = formatPaymentPlan(u.paymentPlan);
    const slug = projectSlugFromPf(u.slug);
    const handover = formatHandover(u.completionDate);
    const imageUrl = u.images?.[0]?.medium || u.images?.[0]?.small;
    const imageGallery = u.images
      ?.map((img) => img.medium || img.large || img.small)
      .filter(Boolean) as string[] | undefined;
    const status =
      u.stockStatus === "sold_out" ? "sold-out" : "off-plan";

    let project = projectsMap.get(u.projectId);
    if (!project) {
      project = {
        id: u.projectId,
        slug,
        pfSlug: u.slug,
        name: u.title,
        developer: u.developer.name,
        developerInitials: initials(u.developer.name),
        developerLogo: u.developer.logo,
        city,
        citySlug,
        area,
        handover,
        paymentPlan: pay.label.replace(/^Payment Plan: /, ""),
        paymentPlanCount: pay.count,
        isPremium: u.listingLevel === "premium",
        unitCount: projectUnitCounts.get(u.projectId) ?? 1,
        imageUrl,
        imageGallery,
        videoAvailable: u.videoAvailable,
        coordinates: u.location.coordinates,
        whatsapp: DEFAULT_WHATSAPP,
        status,
        units: [],
      };
      projectsMap.set(u.projectId, project);
    }

    project.units.push({
      id: u.id,
      beds: u.bedrooms,
      sqftMin: u.area.min,
      sqftMax: u.area.max !== u.area.min ? u.area.max : undefined,
      launchPriceAed: u.startingPrice.min,
      launchPriceMaxAed:
        u.startingPrice.max !== u.startingPrice.min
          ? u.startingPrice.max
          : undefined,
      propertyType: u.propertyType,
    });
  }

  const projects = [...projectsMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const cityCounts = new Map<string, { slug: string; label: string; count: number }>();
  for (const u of allUnits) {
    const { city, citySlug } = parseCity(u.location.fullName);
    const existing = cityCounts.get(citySlug);
    if (existing) existing.count++;
    else cityCounts.set(citySlug, { slug: citySlug, label: city, count: 1 });
  }

  const catalog = {
    version: 2 as const,
    source: "propertyfinder-unit-view",
    scrapedAt: new Date().toISOString(),
    unitCount: allUnits.length,
    projectCount: projects.length,
    cityCounts: [...cityCounts.values()].sort((a, b) => b.count - a.count),
    developerSerpLinks,
    devList,
    projects,
    units: allUnits.map((u) => {
      const { city, citySlug, area } = parseCity(u.location.fullName);
      const pay = formatPaymentPlan(u.paymentPlan);
      return {
        id: u.id,
        projectId: u.projectId,
        projectSlug: projectSlugFromPf(u.slug),
        projectName: u.title,
        developer: u.developer.name,
        developerLogo: u.developer.logo,
        city,
        citySlug,
        area,
        locationFull: u.location.fullName,
        propertyType: u.propertyType,
        beds: u.bedrooms,
        sqftMin: u.area.min,
        sqftMax: u.area.max !== u.area.min ? u.area.max : undefined,
        launchPriceAed: u.startingPrice.min,
        launchPriceMaxAed:
          u.startingPrice.max !== u.startingPrice.min
            ? u.startingPrice.max
            : undefined,
        paymentPlan: pay.label.replace(/^Payment Plan: /, ""),
        paymentPlanCount: pay.count,
        handover: formatHandover(u.completionDate),
        isPremium: u.listingLevel === "premium",
        imageUrl: u.images?.[0]?.medium || u.images?.[0]?.small,
        imageGallery: u.images
          ?.map((img) => img.medium || img.large || img.small)
          .filter(Boolean),
        videoAvailable: u.videoAvailable ?? false,
        coordinates: u.location.coordinates,
        pfSlug: u.slug,
        projectUnitCount: projectUnitCounts.get(u.projectId) ?? 1,
        whatsapp: DEFAULT_WHATSAPP,
        status: u.stockStatus === "sold_out" ? "sold-out" : "off-plan",
      };
    }),
  };

    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log(
      `[scrape-pf] Wrote ${catalog.unitCount} units, ${catalog.projectCount} projects → data/catalog.json`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("[scrape-pf] fatal:", (e as Error).message);
  process.exit(1);
});