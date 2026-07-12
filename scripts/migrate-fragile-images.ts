#!/usr/bin/env npx tsx
/**
 * SCOPED, contained hero-image rehost — moves ONLY the fragile hotlinked hero /
 * gallery images (non-PropertyFinder hosts) onto our own R2/CDN, and rewrites
 * ONLY those rows in data/catalog.json.
 *
 * Why a separate script (not scripts/migrate-assets-to-r2.ts): that pipeline
 * rewrites the catalog for EVERY entry in data/asset-migration.json — which
 * already holds ~4,526 PropertyFinder entries of ambiguous bucket provenance.
 * Running it would repoint the whole catalog (~4,700 images) at /cdn URLs that
 * may not exist in the production bucket = every image could break. This script
 * IGNORES that manifest entirely: it builds its own scoped manifest from the
 * fragile tasks it actually uploads to the PRODUCTION bucket, so the blast
 * radius is exactly the fragile set and nothing else.
 *
 * Stable PropertyFinder heroes (new-projects-media.propertyfinder.com + its S3)
 * are intentionally LEFT hotlinked — they're reliable and huge in number.
 *
 * Usage:
 *   npx tsx scripts/migrate-fragile-images.ts --dry-run          # list, no writes
 *   npx tsx scripts/migrate-fragile-images.ts --limit=3          # smoke: upload 3, no catalog rewrite
 *   npx tsx scripts/migrate-fragile-images.ts                    # full: upload all + rewrite catalog
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CatalogFile } from "../src/lib/catalog-core";
import {
  applyHostedUrlsToCatalog,
  collectAssetTasks,
  createEmptyManifest,
  downloadAsset,
  type AssetMigrationManifest,
} from "../src/lib/assets/migration";
import {
  getAssetsBucketName,
  putRemoteObject,
  remoteObjectExists,
  writeTempAssetFile,
} from "../src/lib/assets/r2-cli";

const ROOT = process.cwd();
const CATALOG = join(ROOT, "data", "catalog.json");
const CONFIG = join(ROOT, "wrangler.production.jsonc");

// Hosts we consider STABLE and leave hotlinked (skip). Everything else external
// is "fragile" and gets rehosted.
const STABLE_HOST_MARKERS = ["propertyfinder.com", "amazonaws.com"];

function isFragileUrl(url: string): boolean {
  try {
    const host = new URL(url).host;
    return !STABLE_HOST_MARKERS.some((m) => host.includes(m));
  } catch {
    return false;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const limitFlag = args.find((a) => a.startsWith("--limit="));
  return {
    dryRun: args.includes("--dry-run"),
    limit: limitFlag ? Number(limitFlag.split("=")[1]) : undefined,
    // A smoke run (--limit) never rewrites the catalog; only a full run does.
    writeCatalog: !args.some((a) => a.startsWith("--limit=")) && !args.includes("--dry-run"),
  };
}

async function main() {
  const { dryRun, limit, writeCatalog } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as CatalogFile;

  const all = collectAssetTasks(catalog);
  let fragile = all.filter(
    (t) =>
      isFragileUrl(t.sourceUrl) &&
      !t.key.startsWith("developers/") && // leave developer logos alone
      !t.key.endsWith(".pdf"), // leave brochures alone
  );
  const totalFragile = fragile.length;
  if (limit && limit > 0) fragile = fragile.slice(0, limit);

  const hostCounts: Record<string, number> = {};
  for (const t of fragile) {
    try {
      const h = new URL(t.sourceUrl).host;
      hostCounts[h] = (hostCounts[h] ?? 0) + 1;
    } catch {
      /* ignore */
    }
  }
  console.log(
    `[fragile] ${fragile.length}/${totalFragile} fragile image tasks (of ${all.length} total). Hosts:`,
    hostCounts,
  );

  if (dryRun) {
    console.log("[fragile] dry-run — no uploads, no catalog change.");
    return;
  }

  const bucketName = getAssetsBucketName(CONFIG);
  console.log(`[fragile] target production bucket: ${bucketName}`);
  const scoped: AssetMigrationManifest = createEmptyManifest();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const task of fragile) {
    try {
      if (
        remoteObjectExists({
          bucketName,
          key: task.key,
          cwd: ROOT,
          wranglerConfigPath: CONFIG,
        })
      ) {
        scoped.uploaded[task.key] = {
          sourceUrl: task.sourceUrl,
          uploadedAt: new Date().toISOString(),
          bytes: 0,
        };
        skipped++;
        continue;
      }
      const { body, contentType } = await downloadAsset(task.sourceUrl);
      // Some fragile sources already return a broken/placeholder response (e.g.
      // a 255-byte "image"). Don't bless those as /cdn — skip so the catalog
      // keeps the external URL, leaving the broken-source signal visible.
      if (body.byteLength < 1024) {
        skipped++;
        console.warn(
          `[fragile] SKIP tiny/broken (${body.byteLength} B) ${task.key} <= ${task.sourceUrl}`,
        );
        continue;
      }
      const tmp = writeTempAssetFile(ROOT, task.key, body);
      putRemoteObject({
        bucketName,
        key: task.key,
        filePath: tmp,
        contentType: contentType || task.contentType,
        cwd: ROOT,
        wranglerConfigPath: CONFIG,
      });
      scoped.uploaded[task.key] = {
        sourceUrl: task.sourceUrl,
        uploadedAt: new Date().toISOString(),
        bytes: body.byteLength,
      };
      uploaded++;
      console.log(`[fragile] uploaded ${task.key} (${body.byteLength} B)`);
    } catch (err) {
      failed++;
      console.error(`[fragile] FAILED ${task.key}: ${(err as Error).message}`);
    }
  }

  console.log(
    `[fragile] uploaded=${uploaded} skipped-existing=${skipped} failed=${failed}`,
  );

  if (writeCatalog) {
    // Rewrite ONLY the rows whose source URL is in `scoped` — PF images untouched.
    const updated = applyHostedUrlsToCatalog(catalog, scoped);
    writeFileSync(CATALOG, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    console.log(
      `[fragile] catalog.json rewritten for ${Object.keys(scoped.uploaded).length} fragile assets (PF images untouched).`,
    );
  } else {
    console.log("[fragile] smoke run — catalog.json NOT modified.");
  }
}

main().catch((e) => {
  console.error("[fragile] fatal:", (e as Error).message);
  process.exit(1);
});
