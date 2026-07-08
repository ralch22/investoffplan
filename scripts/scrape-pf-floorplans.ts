#!/usr/bin/env npx tsx
/**
 * Backfill floor plans + detail-page extras (salesStartDate, ownershipType,
 * constructionProgress, PF FAQs) from PF project detail pages.
 * Source: detailResult.units[].units[].list[].layouts[].floorPlans[].
 *
 *   npx tsx scripts/scrape-pf-floorplans.ts
 *   npx tsx scripts/scrape-pf-floorplans.ts --limit 20
 *   npx tsx scripts/scrape-pf-floorplans.ts --force   # re-scrape even if present
 *
 * Polite by design: 4 workers max, ~1 req/s per worker with delays.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { sanitizePfFaqs } from "../src/lib/sanitize-html";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const DELAY_MS = 1000;
const CONCURRENCY = 4;
const MAX_PLANS_PER_PROJECT = 16;

export interface FloorPlanEntry {
  beds: number;
  propertyType?: string;
  area?: number;
  layoutType?: string;
  imageUrl: string;
}

interface PdpExtras {
  floorPlans: FloorPlanEntry[];
  salesStartDate?: string;
  ownershipType?: string;
  constructionProgress?: number;
  pfFaqs?: Array<{ q: string; a: string }>;
}

function parseArgs() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && process.argv[limitIdx + 1]
      ? Number(process.argv[limitIdx + 1])
      : null;
  return { limit, force: process.argv.includes("--force") };
}

async function fetchPdpExtras(
  page: import("playwright").Page,
  pfSlug: string,
): Promise<PdpExtras> {
  const url = `https://www.propertyfinder.ae/en/new-projects/${pfSlug}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(
    () => {
      const el = document.getElementById("__NEXT_DATA__");
      if (!el?.textContent) return false;
      try {
        return Boolean(
          JSON.parse(el.textContent).props?.pageProps?.detailResult?.id,
        );
      } catch {
        return false;
      }
    },
    { timeout: 90000 },
  );

  const extras = await page.evaluate((maxPlans) => {
    const el = document.getElementById("__NEXT_DATA__");
    const detail = JSON.parse(el!.textContent!).props.pageProps.detailResult;
    // Selector-drift guard: `units` disappearing means PF changed the payload.
    if (!detail || !Array.isArray(detail.units)) {
      throw new Error("PF payload drift: detailResult.units missing");
    }

    const plans: Array<{
      beds: number;
      propertyType?: string;
      area?: number;
      layoutType?: string;
      imageUrl: string;
    }> = [];
    const seen = new Set<string>();

    for (const block of detail.units ?? []) {
      for (const group of block?.units ?? []) {
        for (const band of group?.list ?? []) {
          for (const layout of band?.layouts ?? []) {
            for (const imageUrl of layout?.floorPlans ?? []) {
              if (!imageUrl || seen.has(imageUrl)) continue;
              seen.add(imageUrl);
              plans.push({
                beds: band?.bedrooms ?? layout?.bedrooms ?? 0,
                propertyType: group?.propertyType,
                area: layout?.area,
                layoutType: layout?.layoutType,
                imageUrl,
              });
              if (plans.length >= maxPlans) break;
            }
            if (plans.length >= maxPlans) break;
          }
          if (plans.length >= maxPlans) break;
        }
        if (plans.length >= maxPlans) break;
      }
      if (plans.length >= maxPlans) break;
    }

    const faqs = Array.isArray(detail.faqs)
      ? detail.faqs
          .map((f: { question?: string; answer?: string }) => ({
            q: f?.question ?? "",
            a: f?.answer ?? "",
          }))
          .filter((f: { q: string; a: string }) => f.q && f.a)
          .slice(0, 8)
      : undefined;

    return {
      floorPlans: plans,
      salesStartDate: detail.salesStartDate ?? undefined,
      ownershipType: detail.ownershipType ?? undefined,
      constructionProgress:
        typeof detail.constructionProgress === "number"
          ? detail.constructionProgress
          : undefined,
      pfFaqs: faqs && faqs.length > 0 ? faqs : undefined,
    };
  }, MAX_PLANS_PER_PROJECT);

  // Sanitize FAQs in Node context (the browser sandbox can't import the lib):
  // plain-text only, q≤200/a≤600, and drop source-attribution sentences.
  const cleanedFaqs = sanitizePfFaqs(extras.pfFaqs ?? null);
  return { ...extras, pfFaqs: cleanedFaqs.length > 0 ? cleanedFaqs : undefined };
}

async function main() {
  const { limit, force } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as {
    projects: Array<
      {
        pfSlug?: string;
        name: string;
      } & Partial<PdpExtras>
    >;
  };

  const targets = catalog.projects.filter(
    (p) => p.pfSlug && (force || p.floorPlans === undefined),
  );
  const slice = limit ? targets.slice(0, limit) : targets;
  let done = 0;
  let withPlans = catalog.projects.filter(
    (p) => (p.floorPlans?.length ?? 0) > 0,
  ).length;
  let driftErrors = 0;

  console.log(
    `[floorplans] ${slice.length} projects to scan (${withPlans} already have plans)`,
  );

  const browser = await chromium.launch({ headless: true });
  const queue = [...slice];

  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    const page = await browser.newPage();
    try {
      while (queue.length > 0) {
        const project = queue.shift();
        if (!project?.pfSlug) break;

        try {
          const extras = await fetchPdpExtras(page, project.pfSlug);
          project.floorPlans = extras.floorPlans;
          if (extras.salesStartDate) project.salesStartDate = extras.salesStartDate;
          if (extras.ownershipType) project.ownershipType = extras.ownershipType;
          if (extras.constructionProgress !== undefined) {
            project.constructionProgress = extras.constructionProgress;
          }
          if (extras.pfFaqs) project.pfFaqs = extras.pfFaqs;
          if (extras.floorPlans.length > 0) withPlans++;
        } catch (err) {
          const message = (err as Error).message;
          if (message.includes("payload drift")) driftErrors++;
          console.warn(
            `[floorplans] worker ${workerId} failed ${project.pfSlug}: ${message}`,
          );
        }

        done++;
        if (done % 10 === 0 || done === slice.length) {
          writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
          console.log(
            `[floorplans] ${done}/${slice.length} — ${withPlans} projects with plans`,
          );
        }

        if (queue.length > 0) await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    } finally {
      await page.close();
    }
  });

  try {
    await Promise.all(workers);
    writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log(`[floorplans] Done. ${withPlans} projects have floor plans`);
    // Fail loudly if PF changed its payload shape across a meaningful share.
    if (driftErrors > Math.max(5, slice.length * 0.2)) {
      console.error(
        `[floorplans] ${driftErrors} payload-drift errors — PF structure likely changed`,
      );
      process.exit(2);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
