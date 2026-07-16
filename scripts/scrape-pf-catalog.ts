#!/usr/bin/env npx tsx
/**
 * Ingest Property Finder new-projects unit view into InvestOffPlan catalog.
 * Source: __NEXT_DATA__.props.pageProps.unitLevelListings (24/page).
 *
 *   npx tsx scripts/scrape-pf-catalog.ts
 *   npx tsx scripts/scrape-pf-catalog.ts --pages 3   # smoke test — never writes
 *
 * This script MERGES onto data/catalog.json; it must never replace it. PF is the
 * source of truth for pricing, media and availability — and for nothing else.
 * Everything an editor or another script added (unique descriptions, floor
 * plans, master plans, FAQs) exists only in the catalog, and most of it has no
 * other producer in the weekly pipeline. A wholesale overwrite is unrecoverable
 * short of a git revert, and it auto-commits and upserts to production D1.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { normalizeUnitSize } from "./lib/pf-ingest-helpers";
import {
  enrichmentSummary,
  loadPreviousCatalog,
  mergeCatalogProjects,
  mergeCatalogUnits,
  MIN_PROJECT_RETENTION,
  MIN_UNIT_COMPLETENESS,
  MIN_UNIT_RETENTION,
} from "./lib/catalog-merge";
import {
  parsePagePayload,
  type PfPageResult,
  type PfUnit,
} from "./lib/pf-page-payload";

const BASE =
  "https://www.propertyfinder.ae/en/new-projects?view=unit_types";
const OUT = join(process.cwd(), "data", "catalog.json");
const PAGE_DELAY_MS = 1200;

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

/**
 * Fetch one page of the unit view, retrying only what is worth retrying: a
 * navigation or render failure. A page that renders and reports no unit view
 * (`units: null`) is an answer, not a failure — see parsePagePayload — and the
 * caller reads it differently depending on which page asked.
 */
async function fetchPageUnits(
  browserPage: import("playwright").Page,
  pageNum: number,
): Promise<PfPageResult> {
  const url = pageNum === 1 ? BASE : `${BASE}&page=${pageNum}`;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await browserPage.goto(url, {
        waitUntil: attempt === 0 ? "networkidle" : "domcontentloaded",
        timeout: 120000,
      });

      // Wait for the page to render, not for it to have results. __NEXT_DATA__
      // is server-rendered, so its presence is the entire signal; waiting on
      // listings instead means a page that legitimately has none costs a full
      // timeout and then throws.
      await browserPage.waitForFunction(
        () => {
          const el = document.getElementById("__NEXT_DATA__");
          if (!el?.textContent) return false;
          try {
            return !!JSON.parse(el.textContent)?.props?.pageProps;
          } catch {
            return false;
          }
        },
        // waitForFunction(pageFunction, arg, options): options passed in the
        // second slot become the callback's argument and are never applied, so
        // the timeout below silently used to be Playwright's 30s default.
        undefined,
        { timeout: 90000 },
      );

      const payload = await browserPage.evaluate(
        () => document.getElementById("__NEXT_DATA__")?.textContent || "",
      );
      return parsePagePayload(payload);
    } catch (err) {
      lastError = err as Error;
      console.warn(
        `[scrape-pf] page ${pageNum} failed (attempt ${attempt + 1}/3): ` +
          `${lastError.message.split("\n")[0]}`,
      );
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }

  throw new Error(
    `[scrape-pf] page ${pageNum} failed after 3 attempts: ${lastError?.message}`,
  );
}

async function main() {
  const { maxPages } = parseArgs();
  console.log("[scrape-pf] starting unit-view ingest…");

  // One timestamp for the whole run, stamped as lastSeenAt on every row this
  // scrape actually observed and reused as the catalog-level scrapedAt. The
  // shared value is the contract: a row was seen by run R iff its lastSeenAt
  // equals R's scrapedAt, so each weekly commit partitions the catalog into
  // seen/carried with one comparison — no per-row clock skew across a
  // 20-minute paginated run to reason about.
  const runTimestamp = new Date().toISOString();

  // Read the catalog we have to merge onto before touching the network: if it
  // is unreadable, say so in 10ms rather than after ~20 minutes of politely
  // rate-limited pagination.
  const previous = loadPreviousCatalog(OUT);
  console.log(
    `[scrape-pf] merging onto ${previous?.projects.length ?? 0} existing projects / ` +
      `${previous?.units.length ?? 0} units — ${enrichmentSummary(previous?.projects ?? [])}`,
  );

  const browser = await chromium.launch({ headless: true });
  const browserPage = await browser.newPage();

  try {
    const first = await fetchPageUnits(browserPage, 1);
    // No unit view on page 1 means the view itself is gone — PF ignoring
    // view=unit_types, or the payload moving. Nothing later can recover from
    // that, so say which it is rather than paginating through all of it.
    if (!first.units?.length) {
      throw new Error(
        first.units === null
          ? "[scrape-pf] page 1 has no unitLevelListings — PF did not serve the " +
            `unit view for ${BASE} (its answer describes ${first.total} results ` +
            `over ${first.totalPages} pages)`
          : "[scrape-pf] page 1 returned an empty unit view — aborting",
      );
    }

    const totalPages = maxPages ?? first.totalPages;
    const allUnits: PfUnit[] = [...first.units];
    let devList = first.devList;
    let developerSerpLinks = first.developerSerpLinks;

    console.log(
      `[scrape-pf] page 1/${totalPages} — ${first.units.length} units (total ${first.total})`,
    );

    for (let p = 2; p <= totalPages; p++) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
      let res = await fetchPageUnits(browserPage, p);

      // Out of results — but confirm before believing it. PF's count is a
      // snapshot taken at page 1 and this scrape runs for ~20 minutes, so the
      // tail legitimately moves: pages it promised may stop existing, and PF
      // answers those by dropping the unit view rather than by returning an
      // empty one. That is the expected way to finish. A single bad answer
      // mid-run looks identical and would truncate the catalog quietly, so pay
      // one re-fetch to tell them apart.
      if (!res.units?.length) {
        await new Promise((r) => setTimeout(r, PAGE_DELAY_MS * 3));
        res = await fetchPageUnits(browserPage, p);
      }

      // Still nothing: stop and keep what we have. MIN_UNIT_COMPLETENESS below
      // decides whether it is enough to write. Treating this as an error is
      // what used to discard a whole run at the last page.
      if (!res.units?.length) {
        console.log(
          `[scrape-pf] page ${p}/${totalPages} — no listings on two attempts, ` +
            `stopping (${allUnits.length}/${first.total} units collected)`,
        );
        break;
      }

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
      lastSeenAt: string;
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

  const DEFAULT_WHATSAPP = process.env.IOP_WHATSAPP || "+971585276222";

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
        lastSeenAt: runTimestamp,
        units: [],
      };
      projectsMap.set(u.projectId, project);
    }

    const size = normalizeUnitSize({
      beds: u.bedrooms,
      sqftMin: u.area.min,
      sqftMax: u.area.max !== u.area.min ? u.area.max : undefined,
      priceAed: u.startingPrice.min,
    });
    project.units.push({
      id: u.id,
      beds: u.bedrooms,
      sqftMin: size.sqftMin,
      sqftMax: size.sqftMax,
      launchPriceAed: u.startingPrice.min,
      launchPriceMaxAed:
        u.startingPrice.max !== u.startingPrice.min
          ? u.startingPrice.max
          : undefined,
      propertyType: u.propertyType,
    });
  }

  const scrapedProjects = [...projectsMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // PF owns pricing, media and availability. Everything else in the catalog was
  // put there by someone else and has no producer in this pipeline.
  const { projects, matched, carried } = mergeCatalogProjects(
    previous?.projects ?? [],
    scrapedProjects,
  );

  const scrapedUnits = allUnits.map((u) => {
      const { city, citySlug, area } = parseCity(u.location.fullName);
      const pay = formatPaymentPlan(u.paymentPlan);
      const size = normalizeUnitSize({
        beds: u.bedrooms,
        sqftMin: u.area.min,
        sqftMax: u.area.max !== u.area.min ? u.area.max : undefined,
        priceAed: u.startingPrice.min,
      });
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
        sqftMin: size.sqftMin,
        sqftMax: size.sqftMax,
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
        lastSeenAt: runTimestamp,
      };
  });

  const { units, carried: carriedUnits } = mergeCatalogUnits(
    previous?.units ?? [],
    scrapedUnits,
  );

  // The weekly staleness readout. Absent = never seen since tracking began
  // (2026-07); "carried w/ earlier stamp" rows flapped out of PF's unit view
  // after being seen at least once. Task #31's refresh/prune decision reads
  // these three numbers off a few Monday logs instead of guessing.
  const partition = (rows: Array<Record<string, unknown>>) => {
    let seen = 0;
    let stale = 0;
    let never = 0;
    for (const r of rows) {
      if (r.lastSeenAt === runTimestamp) seen++;
      else if (r.lastSeenAt) stale++;
      else never++;
    }
    return `${seen} seen this run / ${stale} carried w/ earlier stamp / ${never} never stamped`;
  };
  console.log(
    `[scrape-pf] lastSeenAt — projects: ${partition(projects)}; units: ${partition(units)}`,
  );

  // Counted off the merged units rather than the scrape: these drive the city
  // facets, and counting only what PF served this run would undercount every
  // city by whatever the developer-portfolio runs contributed.
  const cityCounts = new Map<string, { slug: string; label: string; count: number }>();
  for (const u of units) {
    const citySlug = String(u.citySlug);
    const existing = cityCounts.get(citySlug);
    if (existing) existing.count++;
    else cityCounts.set(citySlug, { slug: citySlug, label: String(u.city), count: 1 });
  }

  const catalog = {
    version: 2 as const,
    source: "propertyfinder-unit-view",
    scrapedAt: runTimestamp,
    unitCount: units.length,
    projectCount: projects.length,
    cityCounts: [...cityCounts.values()].sort((a, b) => b.count - a.count),
    developerSerpLinks,
    devList,
    projects,
    units,
  };

    // A partial run refreshes only the pages it fetched — every other project
    // rides through on the carry-forward, stale. --pages is a smoke test: it
    // proves the scrape/parse/merge chain still survives PF's markup, and stops
    // there. (The workflow's smoke button reaches the commit step, so this is
    // the difference between validating an ingest and committing a catalog in
    // which 95% of the prices are last week's.)
    //
    // The merge above has already run, so these numbers are what a full run
    // would write — which makes this the cheapest honest check on the merge.
    if (maxPages !== null) {
      console.log(
        `[scrape-pf] --pages ${maxPages}: parsed ${allUnits.length} units / ` +
          `${scrapedProjects.length} projects from PF; would write ${units.length} units / ` +
          `${projects.length} projects (${carriedUnits} units, ${carried} projects carried ` +
          `forward). Partial run — not writing ${OUT}.`,
      );
      return;
    }

    // Being throttled at page 40 and writing what we got would delete ~40% of
    // the site, and the workflow would commit it and upsert it to production D1
    // before a human saw the log. Failing red is always the better trade here:
    // the cost of a missed refresh is a week of stale prices.
    if (allUnits.length < first.total * MIN_UNIT_COMPLETENESS) {
      throw new Error(
        `[scrape-pf] only ${allUnits.length}/${first.total} units ` +
          `(${Math.round((allUnits.length / first.total) * 100)}%) — refusing to write a short scrape`,
      );
    }
    // Both retention guards compare against what the catalog already held, which
    // is the comparison MIN_UNIT_COMPLETENESS above cannot make. With the merge
    // carrying rows forward, neither should ever fire — which is exactly why
    // they stay: if a future change starts dropping rows again, these are what
    // stops it reaching production D1, and the log line below is what explains
    // it. The projects guard has already earned its keep once.
    if (previous && projects.length < previous.projects.length * MIN_PROJECT_RETENTION) {
      throw new Error(
        `[scrape-pf] ${projects.length} projects vs ${previous.projects.length} in the existing catalog — ` +
          `refusing to write a ${Math.round((1 - projects.length / previous.projects.length) * 100)}% drop`,
      );
    }
    if (previous && units.length < previous.units.length * MIN_UNIT_RETENTION) {
      throw new Error(
        `[scrape-pf] ${units.length} units vs ${previous.units.length} in the existing catalog — ` +
          `refusing to write a ${Math.round((1 - units.length / previous.units.length) * 100)}% drop`,
      );
    }

    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log(
      `[scrape-pf] Wrote ${catalog.unitCount} units, ${catalog.projectCount} projects → data/catalog.json`,
    );
    console.log(
      `[scrape-pf] projects: ${matched} matched, ${scrapedProjects.length - matched} new, ` +
        `${carried} carried forward (PF's unit view listed ${scrapedProjects.length} of ` +
        `${previous?.projects.length ?? 0})`,
    );
    console.log(
      `[scrape-pf] units: ${scrapedUnits.length} from PF, ${carriedUnits} carried forward`,
    );
    console.log(`[scrape-pf] enrichment carried forward: ${enrichmentSummary(projects)}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("[scrape-pf] fatal:", (e as Error).message);
  process.exit(1);
});