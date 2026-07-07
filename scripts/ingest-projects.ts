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
  const limitIdx = argv.indexOf("--limit");
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1]
      ? Number(argv[limitIdx + 1])
      : PROJECTS.length;
  const slugIdx = argv.indexOf("--slug");
  const slug = slugIdx >= 0 ? argv[slugIdx + 1] : undefined;
  return { dryRun, limit, slug };
}

async function main() {
  const { dryRun, limit, slug } = parseArgs(process.argv.slice(2));

  if (!isFirecrawlConfigured()) {
    console.log(
      "[ingest] Firecrawl not configured (no FIRECRAWL_API_KEY) — pipeline dormant.",
    );
    process.exit(0);
  }

  const targets = slug
    ? PROJECTS.filter((p) => p.slug === slug)
    : PROJECTS.slice(0, limit);

  if (targets.length === 0) {
    console.error("[ingest] No matching projects.");
    process.exit(1);
  }

  console.log(
    `[ingest] ${dryRun ? "DRY RUN" : "WRITE"} — ${targets.length} project(s)`,
  );

  const store = loadEnrichments();
  let ok = 0;
  let skipped = 0;

  for (const project of targets) {
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
        `${result.sources.length} scrape(s)`,
      ]
        .filter(Boolean)
        .join(", "),
    );

    if (!dryRun) {
      store.projects[result.slug] = result;
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