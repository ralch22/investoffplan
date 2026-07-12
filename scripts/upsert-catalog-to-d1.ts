/// <reference path="../cloudflare-env.d.ts" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import type { CatalogFile } from "../src/lib/catalog-core";
import { upsertCatalogFile } from "../src/lib/db/catalog-upsert";
import * as schema from "../src/lib/db/schema";

const WRANGLER_CONFIG = join(process.cwd(), "wrangler.jsonc");

async function main() {
  const remote = process.argv.includes("--remote");
  const catalogPath = join(process.cwd(), "data", "catalog.json");
  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogFile;

  const { env, dispose } = await getPlatformProxy({
    configPath: WRANGLER_CONFIG,
    remoteBindings: remote,
    persist: remote ? false : undefined,
  });

  const d1 = env.DB as D1Database | undefined;
  if (!d1) {
    throw new Error("D1 binding DB is missing from wrangler.jsonc");
  }

  const db = drizzle(d1, { schema });
  console.log(
    `[db:upsert] ${remote ? "remote" : "local"} — ${raw.projectCount} projects, ${raw.unitCount} units`,
  );

  const stats = await upsertCatalogFile(db, d1, raw);
  console.log(
    `[db:upsert] Done — projects=${stats.projects} units=${stats.catalogUnits} developers=${stats.developers} scrapedAt=${stats.scrapedAt}`,
  );

  if (stats.skippedDuplicateSlugs > 0) {
    console.log(
      `[db:upsert] Skipped ${stats.skippedDuplicateSlugs} same-id duplicate project rows`,
    );
  }

  await dispose();
}

main().catch((error) => {
  console.error("[db:upsert] Failed:", error);
  process.exit(1);
});