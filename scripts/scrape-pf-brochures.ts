#!/usr/bin/env npx tsx
/**
 * Fetch brochure URLs + detail metadata from PF project detail pages.
 *
 *   npx tsx scripts/scrape-pf-brochures.ts
 *   npx tsx scripts/scrape-pf-brochures.ts --limit 10
 *   npx tsx scripts/scrape-pf-brochures.ts --resume
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const DELAY_MS = 900;

interface DetailResult {
  brochureUrl?: string;
  description?: string;
  amenities?: Array<{ id: string; name: string }>;
  masterPlan?: { url?: string };
  videoUrl?: string;
  images?: Array<{ medium?: string; large?: string }>;
}

function parseArgs() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && process.argv[limitIdx + 1]
      ? Number(process.argv[limitIdx + 1])
      : null;
  const resume = process.argv.includes("--resume");
  return { limit, resume };
}

async function fetchDetail(
  page: import("playwright").Page,
  pfSlug: string,
): Promise<DetailResult | null> {
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
    const dr = data.props.pageProps.detailResult;
    return {
      brochureUrl: dr.brochureUrl,
      description: dr.description,
      amenities: dr.amenities,
      masterPlan: dr.masterPlan,
      videoUrl: dr.videoUrl,
      images: dr.images,
    };
  });
}

async function main() {
  const { limit, resume } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as {
    projects: Array<{
      id: string;
      pfSlug?: string;
      brochureUrl?: string;
      description?: string;
      amenities?: string[];
      masterPlanUrl?: string;
      videoUrl?: string;
    }>;
  };

  const targets = catalog.projects.filter((p) => p.pfSlug);
  const slice = limit ? targets.slice(0, limit) : targets;
  let done = 0;
  let withBrochure = catalog.projects.filter((p) => p.brochureUrl).length;

  console.log(`[brochures] ${slice.length} projects to enrich (with 8 concurrent workers)…`);

  const browser = await chromium.launch({ headless: true });
  const queue = [...slice];
  const CONCURRENCY = 8;

  const workers = Array.from({ length: CONCURRENCY }, async (_, workerId) => {
    const page = await browser.newPage();
    try {
      while (queue.length > 0) {
        const project = queue.shift();
        if (!project) break;

        if (resume && project.brochureUrl) {
          done++;
          continue;
        }

        try {
          const detail = await fetchDetail(page, project.pfSlug!);
          if (detail?.brochureUrl) {
            project.brochureUrl = detail.brochureUrl;
            withBrochure++;
          }
          if (detail?.description) project.description = detail.description;
          if (detail?.amenities?.length) {
            project.amenities = detail.amenities.map((a) => a.name);
          }
          if (detail?.masterPlan?.url) project.masterPlanUrl = detail.masterPlan.url;
          if (detail?.videoUrl) project.videoUrl = detail.videoUrl;
        } catch (err) {
          console.warn(
            `[brochures] worker ${workerId} failed ${project.pfSlug}: ${(err as Error).message}`,
          );
        }

        done++;
        if (done % 10 === 0 || done === slice.length) {
          writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
          console.log(
            `[brochures] ${done}/${slice.length} — ${withBrochure} with brochure (checkpoint)`,
          );
        }

        if (queue.length > 0) {
          await new Promise((r) => setTimeout(r, DELAY_MS));
        }
      }
    } finally {
      await page.close();
    }
  });

  try {
    await Promise.all(workers);
    writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.log(
      `[brochures] Done. ${withBrochure}/${slice.length} projects have brochureUrl`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("[brochures] fatal:", (e as Error).message);
  process.exit(1);
});