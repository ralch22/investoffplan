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
    skipDevPortfolio: process.argv.includes("--skip-dev-portfolio"),
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
    skipDevPortfolio,
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