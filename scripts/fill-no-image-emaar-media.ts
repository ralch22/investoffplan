#!/usr/bin/env npx tsx
/**
 * Issue #183 — scoped media recovery for the 9 remaining no-image Emaar PDPs.
 *
 * Pattern (Wave Q/R):
 *   1. Scrape PF new-projects PDP `__NEXT_DATA__` gallery images for the target slugs
 *   2. Junk-filter URLs (`isJunkMediaUrl`)
 *   3. Upload ONLY those images to production R2 `investoffplan-assets`
 *   4. Rewrite ONLY those project (+ unit) rows in data/catalog.json to `/cdn/*`
 *   5. Emit a scoped SQL file for `wrangler d1 execute … --remote` (NOT
 *      `assets:apply-d1:production` / getPlatformProxy — known broken for prod D1)
 *
 * Hard rules:
 *   - Never mass-apply data/asset-migration.json
 *   - Never touch 113-residences
 *   - Diff limited to the 9 slugs (+ their units)
 *
 * Usage:
 *   npx tsx scripts/fill-no-image-emaar-media.ts --dry-run
 *   npx tsx scripts/fill-no-image-emaar-media.ts --skip-upload   # PF URLs only, no R2
 *   npx tsx scripts/fill-no-image-emaar-media.ts                # full: scrape → R2 → catalog + SQL
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CatalogFile } from "../src/lib/catalog-core";
import {
  applyHostedUrlsToCatalog,
  createEmptyManifest,
  downloadAsset,
  type AssetMigrationManifest,
  type AssetTask,
} from "../src/lib/assets/migration";
import {
  getAssetsBucketName,
  putRemoteObject,
  remoteObjectExists,
  writeTempAssetFile,
} from "../src/lib/assets/r2-cli";
import {
  cdnUrlForKey,
  projectGalleryKey,
  projectHeroKey,
} from "../src/lib/assets/keys";
import { isJunkMediaUrl } from "../src/lib/firecrawl";

const ROOT = process.cwd();
const CATALOG = join(ROOT, "data", "catalog.json");
const CONFIG = join(ROOT, "wrangler.production.jsonc");
const SQL_OUT = join(ROOT, "data", "fill-183-emaar-no-image.sql");
const REPORT_OUT = join(ROOT, "data", "fill-183-emaar-no-image-report.json");

/** Never touch — Claude Code owns this slug separately. */
const FORBIDDEN_SLUGS = new Set(["113-residences"]);

/**
 * The 9 remaining no-image Emaar projects (issue #183).
 * All have pfSlug under emaar-properties/*.
 */
const DEFAULT_SLUGS = [
  "address-residences-at-dubai-hills-estate",
  "avena-2",
  "creek-beach-lotus",
  "expo-golf-villas-6",
  "farm-grove-2",
  "hills-park",
  "orchid-at-creek-beach",
  "selvara-phase-3-by-emaar",
  "terra-woods",
] as const;

const MAX_GALLERY = 12;
const FETCH_DELAY_MS = 900;
const MIN_BYTES = 1024;
const UA =
  "InvestOffPlan-MediaRecovery/1.0 (+https://investoffplan.com; issue-183; catalog-mirror)";

interface PfImage {
  source?: string;
  type?: string;
  variants?: { medium?: string; large?: string; small?: string; thumbnail?: string };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const slugsFlag = args.find((a) => a.startsWith("--slugs="));
  const slugs = slugsFlag
    ? slugsFlag
        .split("=")[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [...DEFAULT_SLUGS];
  return {
    dryRun: args.includes("--dry-run"),
    skipUpload: args.includes("--skip-upload"),
    slugs,
  };
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** Prefer medium.webp (stable hero size); fall back to source/original. */
function pickImageUrl(img: PfImage): string | null {
  if (!img || img.type === "video") return null;
  const candidates = [
    img.variants?.medium,
    img.variants?.large,
    img.source,
    img.variants?.small,
  ].filter((u): u is string => typeof u === "string" && u.length > 0);

  for (const u of candidates) {
    if (u.includes("/gallery/video/") || u.endsWith(".mp4")) continue;
    if (isJunkMediaUrl(u)) continue;
    return u;
  }
  return null;
}

function dedupeGallery(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    // Collapse size variants of the same asset into one key.
    const key = u.replace(/\/(original|medium|large|small|thumbnail)\.[a-z0-9]+$/i, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(u);
    if (out.length >= MAX_GALLERY) break;
  }
  return out;
}

async function scrapePfGallery(pfSlug: string): Promise<string[]> {
  const url = `https://www.propertyfinder.ae/en/new-projects/${pfSlug}`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const html = await res.text();
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!m?.[1]) {
    throw new Error(`No __NEXT_DATA__ on ${url}`);
  }
  const detail = JSON.parse(m[1])?.props?.pageProps?.detailResult;
  if (!detail?.id) {
    throw new Error(`PF payload drift: detailResult.id missing on ${url}`);
  }
  const images = Array.isArray(detail.images) ? (detail.images as PfImage[]) : [];
  const urls = images.map(pickImageUrl).filter((u): u is string => Boolean(u));
  return dedupeGallery(urls);
}

async function main() {
  const { dryRun, skipUpload, slugs } = parseArgs();

  for (const s of slugs) {
    if (FORBIDDEN_SLUGS.has(s)) {
      throw new Error(`Refusing to touch forbidden slug: ${s}`);
    }
  }

  const targetSlugs = new Set(slugs);
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as CatalogFile;

  // Snapshot 113-residences before any mutation (must never change).
  const locked113 = catalog.projects.find((p) => p.slug === "113-residences");
  const locked113Image = locked113?.imageUrl;
  const locked113Gallery = JSON.stringify(locked113?.imageGallery ?? null);

  const projects = catalog.projects.filter((p) => targetSlugs.has(p.slug));
  if (projects.length !== slugs.length) {
    const found = new Set(projects.map((p) => p.slug));
    const missing = slugs.filter((s) => !found.has(s));
    throw new Error(`Catalog missing slugs: ${missing.join(", ")}`);
  }

  // Guard: never process 113-residences even if somehow listed.
  if (projects.some((p) => FORBIDDEN_SLUGS.has(p.slug))) {
    throw new Error("Forbidden slug present in target set");
  }

  console.log(
    `[fill-183] ${projects.length} targets. dryRun=${dryRun} skipUpload=${skipUpload}`,
  );

  type ScrapeResult = {
    slug: string;
    pfSlug: string;
    sourceUrls: string[];
    imageUrl?: string;
    imageGallery?: string[];
    error?: string;
  };
  const scraped: ScrapeResult[] = [];

  for (const project of projects) {
    const pfSlug = project.pfSlug;
    if (!pfSlug) {
      scraped.push({
        slug: project.slug,
        pfSlug: "",
        sourceUrls: [],
        error: "missing pfSlug",
      });
      continue;
    }
    try {
      const sourceUrls = await scrapePfGallery(pfSlug);
      if (sourceUrls.length === 0) {
        scraped.push({
          slug: project.slug,
          pfSlug,
          sourceUrls: [],
          error: "no gallery images on PF",
        });
      } else {
        scraped.push({
          slug: project.slug,
          pfSlug,
          sourceUrls,
          imageUrl: sourceUrls[0],
          imageGallery: sourceUrls,
        });
        console.log(
          `[fill-183] scraped ${project.slug}: ${sourceUrls.length} image(s)`,
        );
      }
    } catch (err) {
      scraped.push({
        slug: project.slug,
        pfSlug,
        sourceUrls: [],
        error: (err as Error).message,
      });
      console.error(
        `[fill-183] scrape failed ${project.slug}: ${(err as Error).message}`,
      );
    }
    await new Promise((r) => setTimeout(r, FETCH_DELAY_MS));
  }

  const ok = scraped.filter((s) => s.sourceUrls.length > 0);
  const failed = scraped.filter((s) => s.sourceUrls.length === 0);
  console.log(`[fill-183] scrape ok=${ok.length} failed=${failed.length}`);

  if (dryRun) {
    writeFileSync(
      REPORT_OUT,
      `${JSON.stringify({ dryRun: true, scraped }, null, 2)}\n`,
      "utf8",
    );
    console.log(`[fill-183] dry-run report → ${REPORT_OUT}`);
    for (const s of scraped) {
      console.log(
        `  ${s.slug}: ${s.sourceUrls.length} imgs${s.error ? ` ERR=${s.error}` : ""} hero=${s.imageUrl ?? "-"}`,
      );
    }
    return;
  }

  // Phase 1: write PF source URLs into catalog for the target rows only.
  const bySlug = new Map(scraped.map((s) => [s.slug, s]));
  for (const project of catalog.projects) {
    const s = bySlug.get(project.slug);
    if (!s?.imageUrl) continue;
    project.imageUrl = s.imageUrl;
    project.imageGallery = s.imageGallery;
  }
  for (const unit of catalog.units) {
    const s = bySlug.get(unit.projectSlug);
    if (!s?.imageUrl) continue;
    unit.imageUrl = s.imageUrl;
    unit.imageGallery = s.imageGallery;
  }

  let finalCatalog = catalog;
  const scoped: AssetMigrationManifest = createEmptyManifest();
  let uploaded = 0;
  let skipped = 0;
  let uploadFailed = 0;

  if (!skipUpload) {
    // Phase 2: upload ONLY target project heroes/galleries to production R2.
    // Build tasks from the just-written external URLs — do NOT use
    // data/asset-migration.json.
    const tasks: AssetTask[] = [];
    for (const s of ok) {
      if (!s.imageUrl || !s.imageGallery) continue;
      tasks.push({
        key: projectHeroKey(s.slug, s.imageUrl),
        sourceUrl: s.imageUrl,
        contentType: "image/webp",
        kind: "hero",
        projectSlug: s.slug,
      });
      s.imageGallery.forEach((url, index) => {
        tasks.push({
          key: projectGalleryKey(s.slug, index, url),
          sourceUrl: url,
          contentType: "image/webp",
          kind: "gallery",
          projectSlug: s.slug,
          galleryIndex: index,
        });
      });
    }

    // Dedupe by key (hero often equals gallery[0]).
    const seenKeys = new Set<string>();
    const uniqueTasks = tasks.filter((t) => {
      if (seenKeys.has(t.key)) return false;
      seenKeys.add(t.key);
      return true;
    });

    const bucketName = getAssetsBucketName(CONFIG);
    console.log(
      `[fill-183] uploading ${uniqueTasks.length} assets → ${bucketName}`,
    );

    for (const task of uniqueTasks) {
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
          console.log(`[fill-183] skip existing ${task.key}`);
          continue;
        }

        const { body, contentType } = await downloadAsset(task.sourceUrl);
        if (body.byteLength < MIN_BYTES) {
          uploadFailed++;
          console.warn(
            `[fill-183] SKIP tiny (${body.byteLength} B) ${task.key} <= ${task.sourceUrl}`,
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
        console.log(
          `[fill-183] uploaded ${task.key} (${body.byteLength} B)`,
        );
      } catch (err) {
        uploadFailed++;
        console.error(
          `[fill-183] upload FAILED ${task.key}: ${(err as Error).message}`,
        );
      }
    }

    console.log(
      `[fill-183] R2 uploaded=${uploaded} skipped-existing=${skipped} failed=${uploadFailed}`,
    );

    // Phase 3: rewrite ONLY rows whose source URL landed in scoped.uploaded
    // → /cdn/* via applyHostedUrlsToCatalog (manifest-scoped, not mass).
    finalCatalog = applyHostedUrlsToCatalog(catalog, scoped);

    // For any target that got a partial upload (hero missing but gallery ok),
    // ensure imageUrl is set to first hosted gallery if still external/empty.
    const hostedBySlug = new Map<string, string[]>();
    for (const [key, entry] of Object.entries(scoped.uploaded)) {
      const m = key.match(/^projects\/([^/]+)\/(?:hero|gallery\/\d+)/);
      if (!m) continue;
      const slug = m[1];
      const list = hostedBySlug.get(slug) ?? [];
      list.push(cdnUrlForKey(key));
      hostedBySlug.set(slug, list);
    }
    for (const project of finalCatalog.projects) {
      if (!targetSlugs.has(project.slug)) continue;
      if (project.imageUrl && project.imageUrl.startsWith("/cdn/")) continue;
      const hosted = hostedBySlug.get(project.slug);
      if (hosted?.[0]) {
        project.imageUrl = hosted[0];
        project.imageGallery = hosted;
      }
    }
    for (const unit of finalCatalog.units) {
      if (!targetSlugs.has(unit.projectSlug)) continue;
      const proj = finalCatalog.projects.find((p) => p.slug === unit.projectSlug);
      if (!proj?.imageUrl) continue;
      unit.imageUrl = proj.imageUrl;
      unit.imageGallery = proj.imageGallery;
    }
  }

  // Safety: never let 113-residences change.
  const final113 = finalCatalog.projects.find((p) => p.slug === "113-residences");
  if (
    locked113 &&
    final113 &&
    (final113.imageUrl !== locked113Image ||
      JSON.stringify(final113.imageGallery ?? null) !== locked113Gallery)
  ) {
    throw new Error("Safety abort: 113-residences media would change");
  }

  writeFileSync(CATALOG, `${JSON.stringify(finalCatalog, null, 2)}\n`, "utf8");
  console.log(`[fill-183] wrote ${CATALOG}`);

  // Phase 4: scoped SQL for wrangler d1 execute --remote
  const sqlLines: string[] = [
    "-- Issue #183: scoped media fill for 9 Emaar no-image PDPs",
    "-- Apply with:",
    "--   npx wrangler d1 execute investoffplan-catalog --remote \\",
    "--     --config=wrangler.production.jsonc \\",
    "--     --file=data/fill-183-emaar-no-image.sql",
    "-- DO NOT use assets:apply-d1:production (getPlatformProxy hits empty local D1).",
    "",
  ];

  let projectSql = 0;
  let unitSql = 0;
  for (const project of finalCatalog.projects) {
    if (!targetSlugs.has(project.slug)) continue;
    if (!project.imageUrl) continue;
    const galleryJson = JSON.stringify(project.imageGallery ?? [project.imageUrl]);
    sqlLines.push(
      `UPDATE projects SET image_url = ${sqlString(project.imageUrl)}, image_gallery = ${sqlString(galleryJson)} WHERE slug = ${sqlString(project.slug)};`,
    );
    projectSql++;
  }
  for (const unit of finalCatalog.units) {
    if (!targetSlugs.has(unit.projectSlug)) continue;
    if (!unit.imageUrl) continue;
    const galleryJson = JSON.stringify(unit.imageGallery ?? [unit.imageUrl]);
    sqlLines.push(
      `UPDATE catalog_units SET image_url = ${sqlString(unit.imageUrl)}, image_gallery = ${sqlString(galleryJson)} WHERE id = ${sqlString(unit.id)};`,
    );
    unitSql++;
  }
  sqlLines.push("");

  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(SQL_OUT, sqlLines.join("\n"), "utf8");
  console.log(
    `[fill-183] SQL → ${SQL_OUT} (projects=${projectSql}, units=${unitSql})`,
  );

  // Final report
  const report = {
    at: new Date().toISOString(),
    dryRun: false,
    skipUpload,
    uploaded,
    skipped,
    uploadFailed,
    scraped: scraped.map((s) => {
      const p = finalCatalog.projects.find((x) => x.slug === s.slug);
      return {
        slug: s.slug,
        pfSlug: s.pfSlug,
        sourceCount: s.sourceUrls.length,
        finalImageUrl: p?.imageUrl ?? null,
        finalGalleryLen: p?.imageGallery?.length ?? 0,
        error: s.error ?? null,
      };
    }),
  };
  writeFileSync(REPORT_OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[fill-183] report → ${REPORT_OUT}`);

  const stillEmpty = report.scraped.filter((r) => !r.finalImageUrl);
  if (stillEmpty.length) {
    console.error(
      `[fill-183] WARNING: still no imageUrl: ${stillEmpty.map((r) => r.slug).join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log("[fill-183] all targets have non-empty imageUrl ✓");
  }
}

main().catch((e) => {
  console.error("[fill-183] fatal:", (e as Error).message);
  process.exit(1);
});
