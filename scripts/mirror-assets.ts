#!/usr/bin/env npx tsx
/**
 * Mirror every hotlinked asset onto our own R2/CDN, then rewrite the catalog +
 * enrichment store to point at /cdn. Runs as an ingest pipeline stage.
 *
 * WHY IT IS A STAGE, NOT A ONE-OFF: scrape-pf-catalog rebuilds imageUrl/
 * imageGallery from PropertyFinder every week, and mergeProject takes fresh
 * defined values — so a /cdn URL written once is overwritten by a PF hotlink on
 * the next run. Mirroring has to happen after the scrapers and before
 * sync-catalog-public + upsert-catalog-to-d1, every ingest, or it silently
 * reverts. Keys are content-addressed (see mirror-plan.ts), so a re-scraped
 * image hits the exists-check and costs one HEAD — the weekly run only
 * transfers genuinely new assets.
 *
 * WHAT IT PROTECTS: measured 2026-07-17 the catalog hotlinked 17,927 assets
 * (floor plans and master plans had ZERO mirrors) almost entirely from
 * PropertyFinder — reliable when probed, but the party whose listings we
 * scrape. One hotlink rule and the imagery is gone with no fallback. Once
 * mirrored, an upstream going dark stops mattering: we hold the bytes.
 *
 * Dead/placeholder sources are DROPPED rather than kept as broken frames —
 * consistent with the dead-video drop (#421) and the enrichment rehost (#38).
 *
 * Usage:
 *   npx tsx scripts/mirror-assets.ts --dry-run            # counts by kind/host, no I/O
 *   npx tsx scripts/mirror-assets.ts --limit=20           # smoke: mirror 20, no rewrite
 *   npx tsx scripts/mirror-assets.ts                      # full: mirror all + rewrite
 *   npx tsx scripts/mirror-assets.ts --concurrency=12
 *
 * Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (already ingest secrets).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { downloadAsset } from "../src/lib/assets/migration";
import { getAssetsBucketName } from "../src/lib/assets/r2-cli";
import { r2ObjectExists, r2PutObject } from "../src/lib/assets/r2-rest";
import { cdnUrlForKey } from "../src/lib/assets/keys";
import {
  isExternalAsset,
  isPermanentAssetFailure,
  mirrorKey,
  projectMirrorTargets,
  type AssetKind,
} from "../src/lib/assets/mirror-plan";

const ROOT = process.cwd();
const CATALOG = join(ROOT, "data", "catalog.json");
const ENRICH = join(ROOT, "data", "project-enrichments.json");
const CONFIG = join(ROOT, "wrangler.production.jsonc");

// Below this a response is an error page or placeholder, not an asset. Blessing
// one as /cdn would make a broken image permanent and ours.
const MIN_BYTES = 1024;

interface Task {
  kind: AssetKind;
  sourceUrl: string;
  key: string;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const num = (flag: string) => {
    const f = args.find((a) => a.startsWith(`${flag}=`));
    return f ? Number(f.split("=")[1]) : undefined;
  };
  const limit = num("--limit");
  return {
    dryRun: args.includes("--dry-run"),
    limit,
    concurrency: num("--concurrency") ?? 10,
    write: limit === undefined && !args.includes("--dry-run"),
  };
}

/** Map of sourceUrl -> /cdn URL, or null when the source is dead (drop it). */
// Keyed by task.key (not sourceUrl): sister projects share source URLs but
// own distinct per-slug keys; URL-keyed resolution let one slug's key win
// and cross-pointed the other store (al-haseen-residence-6 -> residences-5).
type Resolution = Map<string, string | null>;

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const { dryRun, limit, concurrency, write } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as {
    projects: Array<Record<string, unknown> & { slug: string }>;
  };
  const enrichStore = existsSync(ENRICH)
    ? (JSON.parse(readFileSync(ENRICH, "utf8")) as {
        updatedAt: string;
        projects: Record<string, { images?: string[] }>;
      })
    : null;

  // Dedupe by key: the same source URL appears across projects (developer
  // logos especially) and must be fetched once.
  const tasks = new Map<string, Task>();
  for (const project of catalog.projects) {
    for (const t of projectMirrorTargets(project)) tasks.set(t.key, t);
  }
  if (enrichStore) {
    for (const [slug, entry] of Object.entries(enrichStore.projects)) {
      for (const url of entry.images ?? []) {
        if (!isExternalAsset(url)) continue;
        const key = mirrorKey("enrichment", slug, url);
        tasks.set(key, { kind: "enrichment", sourceUrl: url, key });
      }
    }
  }

  const all = [...tasks.values()];
  const byKind: Record<string, number> = {};
  for (const t of all) byKind[t.kind] = (byKind[t.kind] ?? 0) + 1;
  console.log(`[mirror] ${all.length} external assets to mirror`, byKind);

  if (dryRun) {
    console.log("[mirror] dry-run — no downloads, no uploads, no rewrite.");
    return;
  }

  const bucket = getAssetsBucketName(CONFIG);
  const todo = limit && limit > 0 ? all.slice(0, limit) : all;
  console.log(`[mirror] bucket=${bucket} tasks=${todo.length} concurrency=${concurrency}`);

  const resolution: Resolution = new Map();
  let mirrored = 0;
  let existing = 0;
  let dropped = 0;
  let retried = 0;
  let done = 0;
  const dropReasons: Record<string, number> = {};

  /**
   * One task, with retries. Only an explicit 404/410 drops an asset; every
   * other failure gets ATTEMPTS tries with backoff.
   *
   * The first backfill attempt lacked this and discarded 1,128 of 3,500 healthy
   * assets: sustained concurrency produces intermittent socket errors, and
   * treating those as death silently deletes real images. Verified after the
   * fact — the exact assets it dropped mirrored 60/60 on a plain retry, PF
   * served 200/200 under identical sustained load, and R2 took 40/40 concurrent
   * PUTs. Nothing was wrong except the error handling. Same lesson as the D1
   * transient retry (#419).
   */
  const attemptTask = async (task: Task): Promise<void> => {
    const ATTEMPTS = 4;
    let lastMessage = "unknown";
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        if (await r2ObjectExists(bucket, task.key)) {
          resolution.set(task.key, cdnUrlForKey(task.key));
          existing++;
          return;
        }
        const { body, contentType } = await downloadAsset(task.sourceUrl);
        if (body.byteLength < MIN_BYTES) {
          // A real answer, just not an asset: a placeholder/error page. Blessing
          // it as /cdn would make a broken image permanently ours.
          resolution.set(task.key, null);
          dropped++;
          dropReasons[`placeholder(<${MIN_BYTES}B)`] =
            (dropReasons[`placeholder(<${MIN_BYTES}B)`] ?? 0) + 1;
          return;
        }
        await r2PutObject(bucket, task.key, body, contentType);
        resolution.set(task.key, cdnUrlForKey(task.key));
        mirrored++;
        return;
      } catch (error) {
        lastMessage = (error as Error).message ?? String(error);
        if (isPermanentAssetFailure(lastMessage)) break; // genuinely gone
        if (attempt < ATTEMPTS) {
          retried++;
          await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
        }
      }
    }
    resolution.set(task.key, null);
    dropped++;
    const reason = isPermanentAssetFailure(lastMessage)
      ? lastMessage.replace(/ for .*/, "") // "HTTP 404"
      : `transient-exhausted: ${lastMessage.slice(0, 40)}`;
    dropReasons[reason] = (dropReasons[reason] ?? 0) + 1;
  };

  await mapWithConcurrency(todo, concurrency, async (task) => {
    await attemptTask(task);
    done++;
    if (done % 250 === 0) {
      console.log(
        `[mirror] ${done}/${todo.length} — mirrored=${mirrored} existing=${existing} dropped=${dropped} retried=${retried}`,
      );
    }
  });

  console.log(
    `[mirror] Done. mirrored=${mirrored} existing=${existing} dropped=${dropped} retried=${retried}`,
  );
  // Never let a drop be invisible: this breakdown is how a wrong drop rate gets
  // caught before it deletes the catalog.
  if (dropped > 0) console.log("[mirror] drop reasons:", dropReasons);

  if (!write) {
    console.log("[mirror] smoke/dry run — no rewrite.");
    return;
  }

  // Rewrite: resolved -> /cdn, dead -> removed. Only touches URLs we resolved,
  // so anything skipped by --limit keeps its current value.
  // Contextual rewrite: recompute this project's own keys so every store
  // entry points at its own slug's namespace even when sister projects share
  // identical source URLs.
  const makeRewriter = (urlToKey: Map<string, string>) =>
    (url: unknown): string | null | undefined => {
      if (!isExternalAsset(url)) return url as string;
      const key = urlToKey.get(url as string);
      if (!key || !resolution.has(key)) return url as string;
      return resolution.get(key)!;
    };

  for (const project of catalog.projects) {
    const urlToKey = new Map<string, string>();
    for (const t of projectMirrorTargets(project)) urlToKey.set(t.sourceUrl, t.key);
    const rewriteUrl = makeRewriter(urlToKey);
    const hero = rewriteUrl(project.imageUrl);
    if (hero === null) delete project.imageUrl;
    else if (hero !== undefined) project.imageUrl = hero;

    const mp = rewriteUrl(project.masterPlanUrl);
    if (mp === null) delete project.masterPlanUrl;
    else if (mp !== undefined) project.masterPlanUrl = mp;

    const br = rewriteUrl(project.brochureUrl);
    if (br === null) delete project.brochureUrl;
    else if (br !== undefined) project.brochureUrl = br;

    const logo = rewriteUrl(project.developerLogo);
    if (logo === null) delete project.developerLogo;
    else if (logo !== undefined) project.developerLogo = logo;

    if (Array.isArray(project.imageGallery)) {
      project.imageGallery = (project.imageGallery as unknown[])
        .map(rewriteUrl)
        .filter((u): u is string => typeof u === "string");
    }
    if (Array.isArray(project.floorPlans)) {
      project.floorPlans = (project.floorPlans as Array<{ imageUrl?: unknown }>)
        .map((fp) => {
          const next = rewriteUrl(fp?.imageUrl);
          if (next === null) return null;
          return next === undefined ? fp : { ...fp, imageUrl: next };
        })
        .filter((fp): fp is { imageUrl?: unknown } => fp !== null);
    }
  }
  writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`[mirror] rewrote ${CATALOG}`);

  if (enrichStore) {
    for (const [slug, entry] of Object.entries(enrichStore.projects)) {
      if (!Array.isArray(entry.images)) continue;
      const urlToKey = new Map<string, string>();
      for (const url of entry.images) {
        if (isExternalAsset(url)) urlToKey.set(url, mirrorKey("enrichment", slug, url));
      }
      const rewriteEnrichUrl = makeRewriter(urlToKey);
      entry.images = entry.images
        .map(rewriteEnrichUrl)
        .filter((u): u is string => typeof u === "string");
    }
    enrichStore.updatedAt = new Date().toISOString();
    writeFileSync(ENRICH, `${JSON.stringify(enrichStore, null, 2)}\n`, "utf8");
    console.log(`[mirror] rewrote ${ENRICH}`);
  }
}

main().catch((error) => {
  console.error("[mirror] Failed:", error);
  process.exit(1);
});
