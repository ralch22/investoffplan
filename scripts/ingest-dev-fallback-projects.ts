#!/usr/bin/env npx tsx
/**
 * Additive ingest for PF developer pages whose projects only exist in the
 * `unitLevelFallbackProjects` shape (project-level, no unit rows) — e.g. ARADA,
 * whose 47 projects (Aljada/Masaar) never appear in the /new-projects
 * unit_types feed that scrape-pf-catalog.ts walks, so they were invisible to
 * every ingest and /developers/arada rendered empty.
 *
 * Reads the developerSerpLinks already captured in data/catalog.json, fetches
 * each /en/new-projects/dev/<slug> page (plain fetch + browser UA — no
 * Playwright needed; the payload is in __NEXT_DATA__), and MERGES fallback
 * projects the catalog doesn't already have (dedupe by project id AND slug).
 *
 * Verified-claims mapping: one synthetic unit per project carrying ONLY what
 * PF states — priceRange.min/max as the from-price band, min bedroom count,
 * first property type. sqft stays 0 (unknown, UI guards on v > 0). No per-bed
 * prices or sizes are invented.
 *
 * Usage:
 *   npx tsx scripts/ingest-dev-fallback-projects.ts             # all dev pages
 *   npx tsx scripts/ingest-dev-fallback-projects.ts --dev arada # one developer
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatHandover,
  initials,
  parseCity,
} from "./lib/pf-ingest-helpers";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const PAGE_DELAY_MS = 1200;
const PER_PAGE = 24;
const MAX_PAGES_PER_DEV = 12; // safety: 12×24 = 288 projects per developer (was 6/144, which truncated Damac 169 / Azizi 112)

interface FallbackProject {
  id: string;
  title: string;
  shareUrl?: string;
  location: {
    fullName: string;
    coordinates?: { lat: number; lng: number; lon?: number };
  };
  developer: { id?: string; name: string; logoUrl?: string };
  priceRange?: { min?: number; max?: number };
  startingPrice?: number;
  bedrooms?: string[];
  propertyTypes?: string[];
  paymentPlans?: string[];
  deliveryDate?: string;
  salesStartDate?: string;
  constructionProgress?: number | null;
  images?: string[];
  stockAvailability?: string;
  downPaymentPercentage?: number;
}

function slugFromShareUrl(p: FallbackProject): string {
  const seg = (p.shareUrl || "").split("/").filter(Boolean).pop() || p.title;
  return seg
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseBeds(bedrooms?: string[]): number {
  if (!bedrooms?.length) return 0;
  const nums = bedrooms
    .map((b) => (/^st/i.test(b) ? 0 : Number.parseInt(b, 10)))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.min(...nums) : 0;
}

function paymentPlanLabel(plans?: string[]): {
  label: string;
  count?: number;
} {
  if (!plans?.length) return { label: "" };
  return plans.length > 1
    ? { label: `${plans.length} Payment Plans`, count: plans.length }
    : { label: plans[0] };
}

async function fetchDevPage(
  path: string,
  page: number,
): Promise<{ projects: FallbackProject[]; total?: number }> {
  const url = `https://www.propertyfinder.ae${path}?view=unit_types${page > 1 ? `&page=${page}` : ""}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return { projects: [] };
  const data = JSON.parse(m[1]);
  const props = data?.props?.pageProps ?? {};
  const projects: FallbackProject[] = Array.isArray(
    props.unitLevelFallbackProjects,
  )
    ? props.unitLevelFallbackProjects
    : [];
  // Aggregation links carry per-city counts; their sum = total projects.
  const aggs: Array<{ count?: number }> =
    props.searchResult?.data?.aggregationLinks ?? [];
  const total = aggs.length
    ? aggs.reduce((s, a) => s + (a.count ?? 0), 0)
    : undefined;
  return { projects, total };
}

async function main() {
  const devIdx = process.argv.indexOf("--dev");
  const onlyDev =
    devIdx >= 0 && process.argv[devIdx + 1] ? process.argv[devIdx + 1] : null;

  const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
  const existingIds = new Set(catalog.projects.map((p: { id: string }) => p.id));
  const existingSlugs = new Set(
    catalog.projects.map((p: { slug: string }) => p.slug),
  );
  const DEFAULT_WHATSAPP = process.env.IOP_WHATSAPP || "+971585276222";

  const links: Array<{ title: string; path: string }> =
    catalog.developerSerpLinks ?? [];
  const targets = onlyDev
    ? links.filter((l) => l.path.endsWith(`/dev/${onlyDev}`))
    : links;
  if (!targets.length) {
    throw new Error(
      onlyDev
        ? `[dev-fallback] no developerSerpLink for --dev ${onlyDev}`
        : "[dev-fallback] no developerSerpLinks in catalog",
    );
  }

  let addedProjects = 0;
  let addedUnits = 0;

  for (const link of targets) {
    const devSlug = link.path.split("/").pop();
    const collected: FallbackProject[] = [];
    let total: number | undefined;

    for (let page = 1; page <= MAX_PAGES_PER_DEV; page++) {
      if (page > 1) await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
      const res = await fetchDevPage(link.path, page);
      if (page === 1) total = res.total;
      collected.push(...res.projects);
      const expected = total ?? res.projects.length;
      if (!res.projects.length || collected.length >= expected) break;
    }

    // Only fallback-shape projects we don't already carry.
    const fresh = collected.filter(
      (p) => !existingIds.has(p.id) && !existingSlugs.has(slugFromShareUrl(p)),
    );
    console.log(
      `[dev-fallback] ${devSlug}: ${collected.length} fallback projects (${total ?? "?"} total), ${fresh.length} new`,
    );

    for (const f of fresh) {
      const { city, citySlug, area } = parseCity(f.location.fullName);
      const slug = slugFromShareUrl(f);
      const priceMin = f.priceRange?.min ?? f.startingPrice ?? 0;
      if (!(priceMin > 0)) {
        // No stated price on PF → skip (a card would render "from AED 0";
        // verified-claims: we display only prices PF actually states).
        console.log(`[dev-fallback]   skip ${slug} — no stated price`);
        continue;
      }
      const priceMax = f.priceRange?.max;
      const pay = paymentPlanLabel(f.paymentPlans);
      const handover = formatHandover(f.deliveryDate);
      const beds = parseBeds(f.bedrooms);
      const propertyType = f.propertyTypes?.[0] ?? "apartment";
      const coordinates = f.location.coordinates
        ? { lat: f.location.coordinates.lat, lng: f.location.coordinates.lng ?? f.location.coordinates.lon! }
        : undefined;
      const status =
        f.stockAvailability === "sold_out" ? "sold-out" : "off-plan";
      const unitId = `${f.id}::fallback::0`;

      catalog.projects.push({
        id: f.id,
        slug,
        pfSlug: f.shareUrl ?? slug,
        name: f.title,
        developer: f.developer.name,
        developerInitials: initials(f.developer.name),
        developerLogo: f.developer.logoUrl,
        city,
        citySlug,
        area,
        handover,
        paymentPlan: pay.label,
        paymentPlanCount: pay.count,
        isPremium: false,
        unitCount: 1,
        imageUrl: f.images?.[0],
        imageGallery: f.images?.slice(0, 12),
        videoAvailable: false,
        coordinates,
        whatsapp: DEFAULT_WHATSAPP,
        status,
        salesStartDate: f.salesStartDate,
        constructionProgress: f.constructionProgress ?? undefined,
        units: [
          {
            id: unitId,
            beds,
            sqftMin: 0, // unknown — never invented; UI guards on sqft > 0
            launchPriceAed: priceMin,
            launchPriceMaxAed:
              priceMax && priceMax !== priceMin ? priceMax : undefined,
            propertyType,
          },
        ],
      });

      catalog.units.push({
        id: unitId,
        projectId: f.id,
        projectSlug: slug,
        projectName: f.title,
        developer: f.developer.name,
        developerLogo: f.developer.logoUrl,
        city,
        citySlug,
        area,
        locationFull: f.location.fullName,
        propertyType,
        beds,
        sqftMin: 0,
        sqftMax: undefined,
        launchPriceAed: priceMin,
        launchPriceMaxAed:
          priceMax && priceMax !== priceMin ? priceMax : undefined,
        paymentPlan: pay.label,
        paymentPlanCount: pay.count,
        handover,
        isPremium: false,
        imageUrl: f.images?.[0],
        imageGallery: f.images?.slice(0, 12),
        videoAvailable: false,
        coordinates,
        pfSlug: f.shareUrl ?? slug,
        projectUnitCount: 1,
        whatsapp: DEFAULT_WHATSAPP,
        status,
      });

      existingIds.add(f.id);
      existingSlugs.add(slug);
      addedProjects++;
      addedUnits++;

      const cc = catalog.cityCounts.find(
        (c: { slug: string }) => c.slug === citySlug,
      );
      if (cc) cc.count++;
      else catalog.cityCounts.push({ slug: citySlug, label: city, count: 1 });
    }
    if (targets.length > 1) await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }

  catalog.projectCount = catalog.projects.length;
  catalog.unitCount = catalog.units.length;
  catalog.projects.sort((a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name),
  );

  writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(
    `[dev-fallback] merged +${addedProjects} projects / +${addedUnits} units → ${catalog.projectCount} projects, ${catalog.unitCount} units`,
  );
}

main().catch((e) => {
  console.error("[dev-fallback] fatal:", (e as Error).message);
  process.exit(1);
});
