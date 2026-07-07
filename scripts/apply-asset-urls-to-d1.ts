/// <reference path="../cloudflare-env.d.ts" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import { execSync } from "node:child_process";
import type { CatalogFile } from "../src/lib/catalog-core";
import { updateAssetUrlsFromCatalog } from "../src/lib/db/update-asset-urls";
import * as schema from "../src/lib/db/schema";

const CATALOG_PATH = join(process.cwd(), "data", "catalog.json");

function getWranglerConfig(): string {
  const args = process.argv.slice(2);
  const flag = args.find((arg) => arg.startsWith("--config="));
  return flag
    ? join(process.cwd(), flag.split("=")[1])
    : join(process.cwd(), "wrangler.jsonc");
}

async function main() {
  const remote = process.argv.includes("--remote");
  const syncPublic = !process.argv.includes("--skip-sync");
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as CatalogFile;
  const wranglerConfig = getWranglerConfig();

  if (syncPublic) {
    execSync("node scripts/sync-catalog-public.mjs", { stdio: "inherit" });
  }

  const { env, dispose } = await getPlatformProxy({
    configPath: wranglerConfig,
    remoteBindings: remote,
    persist: remote ? false : undefined,
  });

  const d1 = env.DB as D1Database | undefined;
  if (!d1) {
    throw new Error(`D1 binding DB is missing from ${wranglerConfig}`);
  }

  const db = drizzle(d1, { schema });
  console.log(`[assets:d1] ${remote ? "remote" : "local"} — applying hosted URLs`);

  const stats = await updateAssetUrlsFromCatalog(db, catalog);
  console.log(
    `[assets:d1] Done — projects=${stats.projects} catalogUnits=${stats.catalogUnits} developers=${stats.developers}`,
  );

  await dispose();
}

main().catch((error) => {
  console.error("[assets:d1] Failed:", error);
  process.exit(1);
});