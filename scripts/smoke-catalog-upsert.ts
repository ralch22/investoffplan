#!/usr/bin/env npx tsx
/**
 * Smoke test for scripts/upsert-catalog-to-d1.ts duplicate handling + idempotency.
 *
 * Spins up an in-memory D1 (Miniflare), applies the real migrations, then runs
 * `upsertCatalogFile` against a fixture that deliberately contains duplicate
 * project slugs and duplicate unit ids. It asserts that:
 *   1. Duplicates are skipped (never inserted twice).
 *   2. Re-running the upsert is idempotent — row counts and stats are unchanged.
 *   3. An upsert of changed data updates rows in place instead of inserting new ones.
 *
 * Run: npm run smoke:catalog-upsert   (or: npx tsx scripts/smoke-catalog-upsert.ts)
 * Exits non-zero on the first failed assertion.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/d1";
import { Miniflare } from "miniflare";
import type { CatalogFile } from "../src/lib/catalog-core";
import { upsertCatalogFile } from "../src/lib/db/catalog-upsert";
import * as schema from "../src/lib/db/schema";
import type { CatalogUnit, Project, UnitType } from "../src/lib/types";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle", "migrations");

function makeUnit(id: string, overrides: Partial<UnitType> = {}): UnitType {
  return {
    id,
    beds: 1,
    sqftMin: 500,
    sqftMax: 700,
    launchPriceAed: 1_000_000,
    launchPriceMaxAed: 1_200_000,
    propertyType: "apartment",
    ...overrides,
  };
}

function makeProject(
  id: string,
  slug: string,
  units: UnitType[],
  overrides: Partial<Project> = {},
): Project {
  return {
    id,
    slug,
    name: `Project ${slug}`,
    developer: "Emaar",
    developerInitials: "EM",
    city: "dubai",
    area: "Downtown",
    status: "off-plan",
    paymentPlan: "60/40",
    isPremium: false,
    unitCount: units.length,
    whatsapp: "+971500000000",
    units,
    ...overrides,
  };
}

function makeCatalogUnit(
  id: string,
  projectId: string,
  projectSlug: string,
): CatalogUnit {
  return {
    id,
    projectId,
    projectSlug,
    projectName: `Project ${projectSlug}`,
    developer: "Emaar",
    city: "dubai",
    citySlug: "dubai",
    area: "Downtown",
    locationFull: "Downtown, Dubai",
    propertyType: "apartment",
    beds: 1,
    sqftMin: 500,
    sqftMax: 700,
    launchPriceAed: 1_000_000,
    launchPriceMaxAed: 1_200_000,
    paymentPlan: "60/40",
    isPremium: false,
    projectUnitCount: 1,
    whatsapp: "+971500000000",
    status: "off-plan",
  };
}

/**
 * Fixture with intentional collisions:
 *  - project "p-1-twin" reuses slug "aaa" with a DIFFERENT id → disambiguated
 *    (kept as aaa-emaar / developer token), not dropped
 *  - project "p-1" appears twice with the SAME id → true duplicate, second skipped
 *  - project "p-2" contains unit "u-1" already seen under "p-1" (duplicate unit id → skipped)
 *  - catalog unit "cu-1" appears twice (duplicate catalog unit id → skipped)
 *  - catalog unit "cu-orphan" points at a non-existent project (filtered out, not counted)
 */
function buildFixture(): CatalogFile {
  const p1 = makeProject("p-1", "aaa", [makeUnit("u-1"), makeUnit("u-2")]);
  const p2 = makeProject("p-2", "bbb", [makeUnit("u-3"), makeUnit("u-1")]);
  // Different-id twin of p-1 (same scraped slug) — must be kept with a new slug.
  const p1Twin = makeProject("p-1-twin", "aaa", [makeUnit("u-9")], {
    developer: "Emaar",
  });
  // True same-id duplicate of p-1 — must be skipped.
  const p1SameId = makeProject("p-1", "aaa", [makeUnit("u-10")]);

  return {
    version: 2,
    unitCount: 3,
    projectCount: 3,
    scrapedAt: "2026-07-08T00:00:00.000Z",
    cityCounts: [{ slug: "dubai", label: "Dubai", count: 2 }],
    developerSerpLinks: [{ title: "Emaar", path: "/developers/emaar" }],
    devList: [{ id: "emaar", name: "Emaar", slug: "emaar" }],
    projects: [p1, p2, p1Twin, p1SameId],
    units: [
      makeCatalogUnit("cu-1", "p-1", "aaa"),
      makeCatalogUnit("cu-2", "p-1", "aaa"),
      makeCatalogUnit("cu-3", "p-2", "bbb"),
      makeCatalogUnit("cu-twin", "p-1-twin", "aaa"), // rewritten to disambiguated slug
      makeCatalogUnit("cu-1", "p-1", "aaa"), // duplicate catalog unit id
      makeCatalogUnit("cu-orphan", "p-does-not-exist", "zzz"), // orphaned → filtered
    ],
  };
}

async function applyMigrations(d1: D1Database) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await d1.prepare(statement).run();
    }
  }
}

async function countRows(d1: D1Database) {
  const tables = ["projects", "project_units", "catalog_units", "developers"];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const row = await d1
      .prepare(`SELECT COUNT(*) AS c FROM ${table}`)
      .first<{ c: number }>();
    out[table] = row?.c ?? -1;
  }
  return out;
}

async function main() {
  const mf = new Miniflare({
    modules: true,
    script: "export default {};",
    d1Databases: { DB: ":memory:" },
  });

  try {
    const d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
    await applyMigrations(d1);
    const db = drizzle(d1, { schema });

    const fixture = buildFixture();

    // --- First upsert: twins kept (disambiguated), true same-id dups skipped ---
    const stats1 = await upsertCatalogFile(db, d1, fixture);
    assert.equal(
      stats1.projects,
      3,
      "expected 3 projects (p-1, p-2, p-1-twin; same-id p-1 duplicate dropped)",
    );
    assert.equal(
      stats1.skippedDuplicateSlugs,
      1,
      "expected 1 skipped same-id duplicate (not the different-id twin)",
    );
    // p-1 units u-1,u-2 + p-2 unit u-3 (u-1 dup skipped) + p-1-twin unit u-9
    assert.equal(stats1.projectUnits, 4, "expected 4 project units (u-1 dup skipped)");
    assert.equal(
      stats1.catalogUnits,
      4,
      "expected 4 catalog units (cu-1..3 + cu-twin; cu-1 dup skipped, orphan filtered)",
    );
    assert.equal(
      stats1.skippedDuplicateUnitIds,
      2,
      "expected 2 skipped duplicate unit ids (u-1 + cu-1)",
    );

    // Twin must land under a distinct slug, not the winner's bare slug.
    const twinRow = await d1
      .prepare(`SELECT slug FROM projects WHERE id = ?`)
      .bind("p-1-twin")
      .first<{ slug: string }>();
    assert.ok(twinRow, "p-1-twin must be inserted");
    assert.notEqual(twinRow.slug, "aaa", "twin must not keep the colliding slug");
    assert.match(
      twinRow.slug,
      /^aaa-/,
      `twin slug should be disambiguated (got ${twinRow.slug})`,
    );
    const twinUnit = await d1
      .prepare(`SELECT project_slug FROM catalog_units WHERE id = ?`)
      .bind("cu-twin")
      .first<{ project_slug: string }>();
    assert.equal(
      twinUnit?.project_slug,
      twinRow.slug,
      "catalog unit project_slug must follow disambiguated project slug",
    );

    const counts1 = await countRows(d1);
    assert.equal(counts1.projects, 3, "db should hold 3 project rows (winner + twin + p-2)");
    assert.equal(counts1.project_units, 4, "db should hold 4 project_unit rows");
    assert.equal(counts1.catalog_units, 4, "db should hold 4 catalog_unit rows");

    // --- Second upsert of identical data: must be idempotent ---
    const stats2 = await upsertCatalogFile(db, d1, fixture);
    assert.deepEqual(stats2, stats1, "re-running the upsert must yield identical stats");

    const counts2 = await countRows(d1);
    assert.deepEqual(
      counts2,
      counts1,
      "re-running the upsert must not create or drop any rows",
    );

    // --- Third upsert with a changed field: must update in place, not insert ---
    const changed = buildFixture();
    changed.projects[0].name = "Project aaa (renamed)";
    const stats3 = await upsertCatalogFile(db, d1, changed);
    assert.deepEqual(stats3, stats1, "changed-data upsert keeps identical stats");

    const counts3 = await countRows(d1);
    assert.deepEqual(counts3, counts1, "changed-data upsert must not add rows");

    const renamed = await d1
      .prepare("SELECT name FROM projects WHERE id = ?")
      .bind("p-1")
      .first<{ name: string }>();
    assert.equal(
      renamed?.name,
      "Project aaa (renamed)",
      "upsert must update the changed field in place",
    );

    // --- first_seen_at: stamped on insert, must SURVIVE later upserts ---
    const firstSeen1 = await d1
      .prepare("SELECT first_seen_at AS fsa, updated_at AS ua FROM projects WHERE id = ?")
      .bind("p-1")
      .first<{ fsa: string | null; ua: string }>();
    assert.equal(
      firstSeen1?.fsa,
      fixture.scrapedAt,
      "insert must stamp first_seen_at with the ingest run date",
    );

    const laterRun = buildFixture();
    laterRun.scrapedAt = "2026-07-15T00:00:00.000Z";
    await upsertCatalogFile(db, d1, laterRun);

    const firstSeen2 = await d1
      .prepare("SELECT first_seen_at AS fsa, updated_at AS ua FROM projects WHERE id = ?")
      .bind("p-1")
      .first<{ fsa: string | null; ua: string }>();
    assert.equal(
      firstSeen2?.fsa,
      fixture.scrapedAt,
      "re-upsert must NOT clobber first_seen_at (insert-only column)",
    );
    assert.equal(
      firstSeen2?.ua,
      laterRun.scrapedAt,
      "re-upsert must still advance updated_at",
    );

    console.log(
      "[smoke:catalog-upsert] PASS — twins disambiguated, same-id dups skipped, upsert idempotent, updates applied in place, first_seen_at survives",
    );
  } finally {
    await mf.dispose();
  }
}

main().catch((error) => {
  console.error("[smoke:catalog-upsert] FAIL:", error);
  process.exit(1);
});
