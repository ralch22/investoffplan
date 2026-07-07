import { execSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();

function run(cmd: string) {
  console.log(`[ingest] ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", env: process.env });
}

function parseArgs() {
  return {
    skipScrape: process.argv.includes("--skip-scrape"),
    skipBrochures: process.argv.includes("--skip-brochures"),
    skipDb: process.argv.includes("--skip-db"),
    smoke: process.argv.includes("--smoke"),
    remote: process.argv.includes("--remote"),
  };
}

async function main() {
  const { skipScrape, skipBrochures, skipDb, smoke, remote } = parseArgs();

  if (!skipScrape) {
    const pagesFlag = smoke ? " --pages 2" : "";
    run(`npx tsx scripts/scrape-pf-catalog.ts${pagesFlag}`);
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