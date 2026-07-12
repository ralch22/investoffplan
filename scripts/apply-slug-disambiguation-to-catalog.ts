/**
 * Permanently apply resolveProjectSlugs() to data/catalog.json so the seed
 * source matches D1 / runtime (twin projects keep distinct, reachable slugs).
 *
 * Why this exists:
 * - PF scrape writes bare colliding slugs (arthouse / emerge / nobu twins).
 * - Seed + upsert disambiguate in-memory before writing D1, so prod D1 is
 *   correct, but data/catalog.json + public/data/* slices still carry the
 *   pre-recovery collision until this script rewrites them.
 * - Full `db:seed:remote` is destructive (wipes enrichments). Prefer this
 *   rewrite + optional `db:upsert:*` instead.
 *
 * Safe: does not touch D1. Idempotent: re-running after renames is a no-op.
 *
 * Usage:
 *   npx tsx scripts/apply-slug-disambiguation-to-catalog.ts
 *   npx tsx scripts/apply-slug-disambiguation-to-catalog.ts --dry-run
 *   npm run catalog:disambiguate-slugs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  resolveProjectSlugs,
  type CatalogFile,
} from "../src/lib/catalog-core";

const ROOT = process.cwd();
const CATALOG_PATH = join(ROOT, "data", "catalog.json");

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const raw = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as CatalogFile;

  const { kept, slugByProjectId } = resolveProjectSlugs(raw.projects);

  const projectChanges: Array<{ id: string; from: string; to: string }> = [];
  for (const project of raw.projects) {
    const finalSlug = slugByProjectId.get(project.id);
    if (finalSlug && finalSlug !== project.slug) {
      projectChanges.push({
        id: project.id,
        from: project.slug,
        to: finalSlug,
      });
    }
  }

  let unitChanges = 0;
  const units = raw.units.map((unit) => {
    const finalSlug = slugByProjectId.get(unit.projectId) ?? unit.projectSlug;
    if (finalSlug !== unit.projectSlug) {
      unitChanges += 1;
      return { ...unit, projectSlug: finalSlug };
    }
    return unit;
  });

  // Sanity: no remaining duplicate project slugs in the kept set.
  const slugCounts = new Map<string, number>();
  for (const project of kept) {
    slugCounts.set(project.slug, (slugCounts.get(project.slug) ?? 0) + 1);
  }
  const remainingDups = [...slugCounts.entries()].filter(([, n]) => n > 1);
  if (remainingDups.length > 0) {
    throw new Error(
      `[catalog:disambiguate] still have duplicate slugs after resolve: ${remainingDups
        .map(([s, n]) => `${s}×${n}`)
        .join(", ")}`,
    );
  }

  if (projectChanges.length === 0 && unitChanges === 0) {
    console.log(
      "[catalog:disambiguate] already clean — no project/unit slug rewrites needed",
    );
    return;
  }

  console.log(
    `[catalog:disambiguate] ${projectChanges.length} project slug(s), ${unitChanges} unit projectSlug(s)`,
  );
  for (const change of projectChanges) {
    console.log(
      `  ${change.from} → ${change.to} (${change.id.slice(0, 8)}…)`,
    );
  }

  if (dryRun) {
    console.log("[catalog:disambiguate] dry-run — not writing catalog.json");
    return;
  }

  const next: CatalogFile = {
    ...raw,
    projects: kept,
    units,
    // Counts stay the same (twins kept, only slugs change).
    projectCount: kept.length,
    unitCount: units.length,
  };

  writeFileSync(CATALOG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`[catalog:disambiguate] wrote ${CATALOG_PATH}`);
}

main();
