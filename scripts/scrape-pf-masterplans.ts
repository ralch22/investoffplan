#!/usr/bin/env npx tsx
/**
 * Backfill masterPlanUrl from PF detail pages (masterPlan.image field).
 *
 *   npx tsx scripts/scrape-pf-masterplans.ts
 *   npx tsx scripts/scrape-pf-masterplans.ts --limit 20
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const DELAY_MS = 800;
const CONCURRENCY = 4;

function parseArgs() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && process.argv[limitIdx + 1]
      ? Number(process.argv[limitIdx + 1])
      : null;
  return { limit };
}

async function fetchMasterPlan(
  page: import("playwright").Page,
  pfSlug: string,
): Promise<string | undefined> {
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

  return page.evaluate(() => {
    const el = document.getElementById("__NEXT_DATA__");
    const data = JSON.parse(el!.textContent!);
    const mp = data.props.pageProps.detailResult?.masterPlan;
    return mp?.image ?? mp?.url ?? undefined;
  });
}

async function main() {
  const { limit } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as {
    projects: Array<{ pfSlug?: string; masterPlanUrl?: string; name: string }>;
  };

  const targets = catalog.projects.filter((p) => p.pfSlug && !p.masterPlanUrl);
  const slice = limit ? targets.slice(0, limit) : targets;
  let done = 0;
  let found = catalog.projects.filter((p) => p.masterPlanUrl).length;

  console.log(
    `[masterplans] ${slice.length} projects to backfill (${found} already have masterPlanUrl)`,
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
          const imageUrl = await fetchMasterPlan(page, project.pfSlug);
          if (imageUrl) {
            project.masterPlanUrl = imageUrl;
            found++;
          }
        } catch (err) {
          console.warn(
            `[masterplans] worker ${workerId} failed ${project.pfSlug}: ${(err as Error).message}`,
          );
        }

        done++;
        if (done % 10 === 0 || done === slice.length) {
          writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
          console.log(
            `[masterplans] ${done}/${slice.length} — ${found} with masterPlanUrl`,
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
    console.log(`[masterplans] Done. ${found} projects have masterPlanUrl`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});