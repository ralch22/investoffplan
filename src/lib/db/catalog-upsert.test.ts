/**
 * Pins the SQL semantics of the batched project upsert — the properties that
 * keep production data alive across a weekly ingest:
 *
 *  1. first_seen_at is INSERT-ONLY (never in the DO UPDATE set): it is what
 *     "new launch this week" alerts key off, and the 2026-07-12 seed cohort
 *     must age out naturally rather than be re-stamped every Monday.
 *  2. Enrichment columns other pipelines own survive a null from the scrape
 *     via COALESCE(excluded.col, col) — the in-statement replacement for the
 *     old SELECT-then-merge (which cost 2 round-trips per project and gave
 *     run 29470437050 a 17-minute window to catch a fatal 502).
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { drizzle } from "drizzle-orm/d1";
import { buildProjectUpsertSql } from "./catalog-upsert";
import * as schema from "./schema";
import type { Project } from "@/lib/types";

// SQL generation never touches the driver, so a null binding is fine here.
const db = drizzle(null as unknown as D1Database, { schema });

const project: Project = {
  id: "p-test",
  slug: "test-towers",
  name: "Test Towers",
  developer: "Emaar",
  developerInitials: "ET",
  city: "dubai",
  area: "Downtown",
  status: "off-plan",
  paymentPlan: "80/20",
  isPremium: true,
  unitCount: 3,
  whatsapp: "+971585276222",
  units: [],
  // Scrape has nothing for these — production values must survive.
  description: undefined,
  brochureUrl: undefined,
};

test("project upsert keeps first_seen_at out of the update set", () => {
  const { sql } = buildProjectUpsertSql(db, project, "2026-07-20T04:00:00.000Z");
  const updateClause = sql.slice(sql.indexOf("do update set"));

  assert.match(sql, /"first_seen_at"\) values/, "inserted for brand-new rows");
  assert.doesNotMatch(
    updateClause,
    /first_seen_at/,
    "existing rows keep their original first_seen_at",
  );
});

test("project upsert preserves owned enrichment when the scrape sends null", () => {
  const { sql } = buildProjectUpsertSql(db, project, "2026-07-20T04:00:00.000Z");
  const updateClause = sql.slice(sql.indexOf("do update set"));

  for (const col of [
    "brochure_url",
    "description",
    "amenities",
    "master_plan_url",
    "video_url",
    "image_gallery",
  ]) {
    assert.ok(
      updateClause.includes(`coalesce(excluded."${col}", "projects"."${col}")`),
      `${col} must coalesce to the existing value`,
    );
  }
  // …while scrape-owned fields take the fresh value unconditionally.
  assert.match(updateClause, /"name" = excluded\."name"/);
  assert.doesNotMatch(updateClause, /coalesce\(excluded\."name"/);
});

test("project upsert binds one param per insert column and no more", () => {
  const { sql, params } = buildProjectUpsertSql(db, project, "2026-07-20T04:00:00.000Z");
  const insertCols = sql.slice(0, sql.indexOf(") values")).split(",").length;

  assert.equal(params.length, insertCols, "update set adds zero binds (all excluded.*)");
  assert.ok(params.length <= 100, "must stay under D1's 100-bind cap");
  assert.equal(params[0], "p-test");
});
