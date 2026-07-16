/// <reference path="../cloudflare-env.d.ts" />

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import type { CatalogFile } from "../src/lib/catalog-core";
import { upsertCatalogFile } from "../src/lib/db/catalog-upsert";
import * as schema from "../src/lib/db/schema";

async function main() {
  const remote = process.argv.includes("--remote");
  const catalogPath = join(process.cwd(), "data", "catalog.json");
  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as CatalogFile;

  // --remote needs its own config: the binding-level "remote": true lives
  // there and must never enter wrangler.jsonc (local dev would write prod).
  // See the header of wrangler.remote-ingest.jsonc for the full story.
  const configName = remote ? "wrangler.remote-ingest.jsonc" : "wrangler.jsonc";
  const { env, dispose } = await getPlatformProxy({
    configPath: join(process.cwd(), configName),
    remoteBindings: remote,
    persist: remote ? false : undefined,
  });

  const d1 = env.DB as D1Database | undefined;
  if (!d1) {
    throw new Error(`D1 binding DB is missing from ${configName}`);
  }

  // Fail-closed proof the binding is the real database, not wrangler's
  // silent local simulation (an empty in-memory D1 when the per-binding
  // "remote" flag is absent — how run 29469509082 authenticated and then
  // "lost" catalog_meta). One read, before any write: production has had
  // catalog_meta since migration 0000, so its absence can only mean the
  // shim. Local runs keep the guard too — a local D1 without migrations
  // applied should be told to migrate, not be silently seeded row-less.
  const tables = await d1
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_meta'")
    .all();
  if (tables.results.length === 0) {
    throw new Error(
      `[db:upsert] binding "DB" from ${configName} has no catalog_meta table — ` +
        (remote
          ? "this is wrangler's local shim, not production D1; the per-binding " +
            '"remote": true flag is missing or remote bindings silently degraded. ' +
            "Refusing to write."
          : "local D1 has no migrations applied; run: npx wrangler d1 migrations apply investoffplan-catalog"),
    );
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