import { execSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();

function run(cmd: string) {
  console.log(`[ingest] ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

function parseArgs() {
  const devSlugIdx = process.argv.indexOf("--dev-slug");
  const devSlug =
    devSlugIdx >= 0 && process.argv[devSlugIdx + 1]
      ? process.argv[devSlugIdx + 1]
      : null;
  return {
    skipScrape: process.argv.includes("--skip-scrape"),
    skipBrochures: process.argv.includes("--skip-brochures"),
    skipFloorplans: process.argv.includes("--skip-floorplans"),
    skipMasterplans: process.argv.includes("--skip-masterplans"),
    skipDevPortfolio: process.argv.includes("--skip-dev-portfolio"),
    skipMirror: process.argv.includes("--skip-mirror"),
    skipDb: process.argv.includes("--skip-db"),
    smoke: process.argv.includes("--smoke"),
    remote: process.argv.includes("--remote"),
    devSlug,
    allDevlist: process.argv.includes("--all-devlist"),
  };
}

async function main() {
  const {
    skipScrape,
    skipBrochures,
    skipFloorplans,
    skipMasterplans,
    skipDevPortfolio,
    skipMirror,
    skipDb,
    smoke,
    remote,
    devSlug,
    allDevlist,
  } = parseArgs();

  if (!skipScrape) {
    const pagesFlag = smoke ? " --pages 2" : "";
    run(`npx tsx scripts/scrape-pf-catalog.ts${pagesFlag}`);
  }

  if (!skipDevPortfolio && (devSlug || allDevlist || smoke)) {
    const devFlag = allDevlist
      ? " --all-devlist"
      : devSlug
        ? ` --slug ${devSlug}`
        : " --slug emaar-properties";
    const limitFlag = smoke ? " --limit 3" : "";
    run(`npx tsx scripts/scrape-pf-developer-portfolio.ts${devFlag}${limitFlag}`);
  }

  if (!skipBrochures) {
    const limitFlag = smoke ? " --limit 5" : " --resume";
    run(`npx tsx scripts/scrape-pf-brochures.ts${limitFlag}`);
  }

  // Floor plans and master plans are PF data that the listing scrape does not
  // return — they live on the project's own PF page and need a per-project
  // visit. Nothing scheduled fetched them, so the catalog has been carrying
  // whatever a manual run last left behind: 1,021 of 1,746 projects have never
  // been checked for floor plans at all (2026-07-16). Both stages read and
  // rewrite data/catalog.json, so they belong after the scrape that rebuilds it
  // and before the slices and the D1 upsert that publish it.
  //
  // The two look asymmetric on purpose:
  //
  // scrape-pf-floorplans.ts self-limits to projects whose floorPlans is
  // undefined and writes [] for a project it checked and found none, so the
  // first scheduled run works through the ~1,021 backlog (~20 min) and later
  // runs cost almost nothing. --force is how you re-check.
  //
  // scrape-pf-masterplans.ts has no such memo: it retries all 240 projects
  // still missing a master plan every week. That is the point — a master plan
  // PF publishes after launch is only ever picked up by re-asking, and re-
  // asking is 240 fetches at concurrency 4, about 5 minutes of the workflow's
  // 180. Memoizing it would buy back those 5 minutes by freezing 240 projects
  // as permanent misses.
  if (!skipFloorplans) {
    const limitFlag = smoke ? " --limit 5" : "";
    run(`npx tsx scripts/scrape-pf-floorplans.ts${limitFlag}`);
  }

  if (!skipMasterplans) {
    const limitFlag = smoke ? " --limit 5" : "";
    run(`npx tsx scripts/scrape-pf-masterplans.ts${limitFlag}`);
  }

  // Take ownership of every asset the scrapes just pointed at a third party.
  //
  // This MUST run every ingest, not once: scrape-pf-catalog rebuilds imageUrl/
  // imageGallery from PropertyFinder and mergeProject takes fresh defined
  // values, so a /cdn URL written by a previous run is overwritten by a PF
  // hotlink here. Mirroring once would silently revert next Monday.
  //
  // It is cheap on steady state: keys are content-addressed on the source URL
  // (src/lib/assets/mirror-plan.ts), so a re-scraped image costs one HEAD and
  // nothing transfers. Only genuinely new assets are fetched.
  //
  // Placed BEFORE the public slices and the D1 upsert so /cdn URLs are what
  // actually reach the site; after it, no external asset URL should survive
  // (src/lib/assets/no-hotlinks.test.ts enforces that in CI).
  if (!skipMirror) {
    const limitFlag = smoke ? " --limit=5" : "";
    run(`npx tsx scripts/mirror-assets.ts${limitFlag}`);
  }

  // PF scrape re-writes bare colliding slugs for known twins. Pin + rewrite
  // data/catalog.json BEFORE public slices / D1 upsert so seed source matches
  // runtime (issue #196). Idempotent; does not touch D1 itself.
  run("npx tsx scripts/apply-slug-disambiguation-to-catalog.ts");

  run("node scripts/sync-catalog-public.mjs");

  if (!skipDb) {
    const remoteFlag = remote ? " --remote" : "";
    run(`npx tsx scripts/upsert-catalog-to-d1.ts${remoteFlag}`);
  }

  console.log("[ingest] Pipeline complete.");
}

main().catch((error) => {
  console.error("[ingest] Pipeline failed:", error);
  process.exit(1);
});