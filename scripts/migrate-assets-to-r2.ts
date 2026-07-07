/// <reference path="../cloudflare-env.d.ts" />

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPlatformProxy } from "wrangler";
import type { CatalogFile } from "../src/lib/catalog-core";
import {
  applyHostedUrlsToCatalog,
  collectAssetTasks,
  createEmptyManifest,
  downloadAsset,
  type AssetMigrationManifest,
  type AssetTask,
  uploadToR2,
} from "../src/lib/assets/migration";
import {
  getAssetsBucketName,
  putRemoteObject,
  remoteObjectExists,
  writeTempAssetFile,
} from "../src/lib/assets/r2-cli";

const ROOT = process.cwd();
const CATALOG_PATH = join(ROOT, "data", "catalog.json");
const MANIFEST_PATH = join(ROOT, "data", "asset-migration.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const configFlag = args.find((arg) => arg.startsWith("--config="));
  const wranglerConfig = configFlag
    ? join(ROOT, configFlag.split("=")[1])
    : join(ROOT, "wrangler.jsonc");
  return {
    remote: args.includes("--remote"),
    dryRun: args.includes("--dry-run"),
    resume: args.includes("--resume"),
    force: args.includes("--force"),
    updateCatalog: !args.includes("--skip-catalog"),
    limit: (() => {
      const flag = args.find((arg) => arg.startsWith("--limit="));
      return flag ? Number(flag.split("=")[1]) : undefined;
    })(),
    concurrency: (() => {
      const flag = args.find((arg) => arg.startsWith("--concurrency="));
      if (flag) return Math.max(1, Number(flag.split("=")[1]));
      return args.includes("--remote") ? 3 : 6;
    })(),
    wranglerConfig,
  };
}

function loadManifest(): AssetMigrationManifest {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as AssetMigrationManifest;
  } catch {
    return createEmptyManifest();
  }
}

function saveManifest(manifest: AssetMigrationManifest) {
  manifest.updatedAt = new Date().toISOString();
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function processTaskLocal(
  bucket: R2Bucket,
  task: AssetTask,
  manifest: AssetMigrationManifest,
  dryRun: boolean,
  force: boolean,
) {
  if (!force && manifest.uploaded[task.key]) return;

  if (dryRun) {
    console.log(`[assets] dry-run upload ${task.key} <= ${task.sourceUrl}`);
    return;
  }

  try {
    const existing = await bucket.head(task.key);
    if (existing) {
      manifest.uploaded[task.key] = {
        sourceUrl: task.sourceUrl,
        uploadedAt: new Date().toISOString(),
        bytes: existing.size,
      };
      delete manifest.failed[task.key];
      console.log(`[assets] skip existing ${task.key}`);
      return;
    }

    const { body, contentType } = await downloadAsset(task.sourceUrl);
    await uploadToR2(bucket, task, body, contentType || task.contentType);
    manifest.uploaded[task.key] = {
      sourceUrl: task.sourceUrl,
      uploadedAt: new Date().toISOString(),
      bytes: body.byteLength,
    };
    delete manifest.failed[task.key];
    console.log(`[assets] uploaded ${task.key} (${body.byteLength} bytes)`);
  } catch (error) {
    recordFailure(manifest, task, error);
  }
}

async function processTaskRemote(
  bucketName: string,
  task: AssetTask,
  manifest: AssetMigrationManifest,
  dryRun: boolean,
  wranglerConfigPath: string,
  force: boolean,
) {
  if (!force && manifest.uploaded[task.key]) return;

  if (dryRun) {
    console.log(`[assets] dry-run upload ${task.key} <= ${task.sourceUrl}`);
    return;
  }

  const inManifest = !!manifest.uploaded[task.key];
  if (inManifest && !force) {
    return;
  }

  try {
    if (remoteObjectExists({ bucketName, key: task.key, cwd: ROOT, wranglerConfigPath })) {
      if (!inManifest) {
        manifest.uploaded[task.key] = {
          sourceUrl: task.sourceUrl,
          uploadedAt: new Date().toISOString(),
          bytes: 0,
        };
        delete manifest.failed[task.key];
      }
      console.log(`[assets] skip existing in target ${task.key}`);
      return;
    }

    const { body, contentType } = await downloadAsset(task.sourceUrl);
    const tempFile = writeTempAssetFile(ROOT, task.key, body);
    putRemoteObject({
      bucketName,
      key: task.key,
      filePath: tempFile,
      contentType: contentType || task.contentType,
      cwd: ROOT,
      wranglerConfigPath,
    });

    manifest.uploaded[task.key] = {
      sourceUrl: task.sourceUrl,
      uploadedAt: new Date().toISOString(),
      bytes: body.byteLength,
    };
    delete manifest.failed[task.key];
    console.log(`[assets] uploaded ${task.key} (${body.byteLength} bytes)`);
  } catch (error) {
    recordFailure(manifest, task, error);
  }
}

function recordFailure(
  manifest: AssetMigrationManifest,
  task: AssetTask,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : String(error);
  const previous = manifest.failed[task.key];
  manifest.failed[task.key] = {
    sourceUrl: task.sourceUrl,
    error: message,
    attempts: (previous?.attempts ?? 0) + 1,
  };
  console.error(`[assets] failed ${task.key}: ${message}`);
}

async function main() {
  const { remote, dryRun, resume, force, updateCatalog, limit, concurrency, wranglerConfig } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as CatalogFile;
  const manifest = loadManifest();

  const allTasks = collectAssetTasks(catalog);
  let pending = allTasks;

  if (resume && !force) {
    pending = pending.filter((task) => !manifest.uploaded[task.key]);
  }

  if (limit && limit > 0) {
    pending = pending.slice(0, limit);
  }

  console.log(
    `[assets] ${remote ? "remote" : "local"} — ${pending.length}/${allTasks.length} tasks` +
      `${dryRun ? " (dry-run)" : ""}`,
  );

  if (!pending.length) {
    console.log("[assets] Nothing to migrate.");
    return;
  }

  let processed = 0;

  if (remote) {
    const bucketName = getAssetsBucketName(wranglerConfig);
    await runPool(pending, concurrency, async (task) => {
      await processTaskRemote(bucketName, task, manifest, dryRun, wranglerConfig, force);
      processed += 1;
      if (!dryRun && processed % 10 === 0) saveManifest(manifest);
    });
  } else {
    const { env, dispose } = await getPlatformProxy({
      configPath: wranglerConfig,
      remoteBindings: false,
    });

    const bucket = env.ASSETS_R2_BUCKET as R2Bucket | undefined;
    if (!bucket) {
      throw new Error(`ASSETS_R2_BUCKET binding is missing from ${wranglerConfig}`);
    }

    await runPool(pending, concurrency, async (task) => {
      await processTaskLocal(bucket, task, manifest, dryRun, force);
      processed += 1;
      if (!dryRun && processed % 25 === 0) saveManifest(manifest);
    });

    await dispose();
  }

  if (!dryRun) {
    saveManifest(manifest);
  }

  if (updateCatalog && !dryRun) {
    const updated = applyHostedUrlsToCatalog(catalog, manifest);
    writeFileSync(CATALOG_PATH, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    console.log("[assets] Updated data/catalog.json with /cdn URLs");
  }

  const uploaded = Object.keys(manifest.uploaded).length;
  const failed = Object.keys(manifest.failed).length;
  console.log(`[assets] Done — uploaded=${uploaded} failed=${failed}`);
}

main().catch((error) => {
  console.error("[assets] Migration failed:", error);
  process.exit(1);
});