#!/usr/bin/env npx tsx
/**
 * Phase 2 ingest — discover brochure/video URLs and structured facts via Firecrawl.
 *
 *   FIRECRAWL_API_KEY=... npm run ingest:dry -- --limit 2
 *   FIRECRAWL_API_KEY=... npm run ingest -- --limit 12
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Project } from "../src/lib/types";

const PROJECTS = (
  JSON.parse(readFileSync(join(process.cwd(), "data/catalog.json"), "utf8")) as {
    projects: Project[];
  }
).projects;
import { enrichProject } from "../src/lib/enrichment";
import { isFirecrawlConfigured } from "../src/lib/firecrawl";
import { loadEnrichments, saveEnrichments } from "../src/lib/enrichment-storage";

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const premiumOnly = argv.includes("--premium");
  const skipExisting = argv.includes("--skip-existing");
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1]
      ? Number(argv[limitIdx + 1])
      : PROJECTS.length;
  const slugIdx = argv.indexOf("--slug");
  const slug = slugIdx >= 0 ? argv[slugIdx + 1] : undefined;
  const maxIdx = argv.indexOf("--max");
  const max =
    maxIdx >= 0 && argv[maxIdx + 1] ? Number(argv[maxIdx + 1]) : undefined;
  // Target only projects with no catalog hero image (media backfill).
  const imageLess = argv.includes("--image-less");
  return { dryRun, limit, slug, premiumOnly, skipExisting, max, imageLess };
}

async function main() {
  const { dryRun, limit, slug, premiumOnly, skipExisting, max, imageLess } = parseArgs(
    process.argv.slice(2),
  );

  if (!isFirecrawlConfigured()) {
    console.log(
      "[ingest] Firecrawl not configured (no FIRECRAWL_API_KEY) — pipeline dormant.",
    );
    process.exit(0);
  }

  const store = loadEnrichments();

  let pool = premiumOnly ? PROJECTS.filter((p) => p.isPremium) : PROJECTS;
  if (imageLess) pool = pool.filter((p) => !p.imageUrl);
  // `limit` defines the universe (e.g. top-100 premium); `--skip-existing` then
  // removes already-enriched slugs so a killed run resumes without drifting past it.
  const universe = slug
    ? PROJECTS.filter((p) => p.slug === slug)
    : pool.slice(0, limit);
  const remaining = universe.filter(
    (p) => !skipExisting || !store.projects[p.slug],
  );
  // `--max` caps a single invocation so foreground batches finish inside the run window.
  const targets = max != null ? remaining.slice(0, max) : remaining;

  if (targets.length === 0) {
    console.error("[ingest] No matching projects.");
    process.exit(1);
  }

  console.log(
    `[ingest] ${dryRun ? "DRY RUN" : "WRITE"} — ${targets.length} project(s)` +
      `${premiumOnly ? " (premium)" : ""}`,
  );

  let ok = 0;
  let skipped = 0;
  let first = true;

  for (const project of targets) {
    // Gentle pacing between entities keeps the hobby-tier rate limiter happy.
    if (!first) await new Promise((r) => setTimeout(r, 500));
    first = false;
    process.stdout.write(`  • ${project.slug} … `);
    const result = await enrichProject(project);
    if (!result) {
      console.log("no enrichment");
      skipped++;
      continue;
    }

    ok++;
    console.log(
      [
        result.summary ? "summary" : null,
        result.brochureUrl ? "brochure" : null,
        result.videoUrl ? "video" : null,
        result.images?.length ? `${result.images.length} image(s)` : null,
        `${result.sources.length} scrape(s)`,
      ]
        .filter(Boolean)
        .join(", "),
    );

    if (!dryRun) {
      store.projects[result.slug] = result;
      // Persist incrementally so a long premium run survives a timeout/crash.
      if (ok % 5 === 0) saveEnrichments(store);
    }
  }

  if (!dryRun && ok > 0) {
    saveEnrichments(store);
    console.log(`[ingest] Wrote ${ok} enrichment(s) → data/project-enrichments.json`);
  } else if (dryRun) {
    console.log(`[ingest] Dry run complete — ${ok} would write, ${skipped} skipped`);
  }
}

main().catch((e) => {
  console.error("[ingest] fatal:", (e as Error).message);
  process.exit(1);
});