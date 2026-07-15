/**
 * The catalog holds ~1,500 master plans, ~700 unique descriptions and ~600
 * floor-plan sets that no scraper reproduces. These tests pin the behaviour
 * that keeps them alive across a weekly PF ingest.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadPreviousCatalog,
  mergeCatalogProjects,
  mergeProject,
  enrichmentSummary,
  type CatalogProject,
} from "./catalog-merge";

const tmp = () => mkdtempSync(join(tmpdir(), "catalog-merge-"));

test("mergeProject carries enrichment the scraper cannot produce", () => {
  const prev: CatalogProject = {
    id: "p1",
    name: "Old Name",
    masterPlanUrl: "https://cdn/master.jpg",
    descriptionUnique: "<p>Hand-written prose.</p>",
    floorPlans: [{ beds: 2, url: "https://cdn/fp.pdf" }],
    pfFaqs: [{ q: "Handover?", a: "Q4 2027" }],
  };
  const next: CatalogProject = { id: "p1", name: "New Name", status: "off-plan" };

  const merged = mergeProject(prev, next);

  assert.equal(merged.masterPlanUrl, "https://cdn/master.jpg");
  assert.equal(merged.descriptionUnique, "<p>Hand-written prose.</p>");
  assert.deepEqual(merged.floorPlans, [{ beds: 2, url: "https://cdn/fp.pdf" }]);
  assert.deepEqual(merged.pfFaqs, [{ q: "Handover?", a: "Q4 2027" }]);
  // …while fresh PF data still wins, which is the point of the weekly refresh.
  assert.equal(merged.name, "New Name");
  assert.equal(merged.status, "off-plan");
});

test("mergeProject does not let an explicit undefined punch through good data", () => {
  // The bug a plain { ...prev, ...next } would introduce: PF omitting a field
  // on one run must not delete the value we already hold.
  const prev: CatalogProject = { id: "p1", imageGallery: ["a.jpg", "b.jpg"] };
  const next: CatalogProject = { id: "p1", imageGallery: undefined };

  assert.deepEqual(mergeProject(prev, next).imageGallery, ["a.jpg", "b.jpg"]);
});

test("mergeProject keeps a field the scraper has never heard of", () => {
  // Keep-by-default is the whole design: a field added to the catalog after
  // this code was written must survive without anyone remembering to list it.
  const prev: CatalogProject = { id: "p1", someFutureEnrichment: "keep me" };

  assert.equal(mergeProject(prev, { id: "p1" }).someFutureEnrichment, "keep me");
});

test("mergeProject passes a genuinely new project through untouched", () => {
  const next: CatalogProject = { id: "new", name: "Fresh Launch" };

  assert.deepEqual(mergeProject(undefined, next), next);
});

test("mergeCatalogProjects matches on id even when the slug has changed", () => {
  // apply-slug-disambiguation-to-catalog.ts rewrites slugs after every scrape,
  // so a slug-keyed merge would miss every disambiguated project and drop the
  // exact enrichment this exists to save.
  const previous: CatalogProject[] = [
    { id: "p1", slug: "the-cove-2", masterPlanUrl: "https://cdn/master.jpg" },
  ];
  const scraped: CatalogProject[] = [{ id: "p1", slug: "the-cove" }];

  const { projects, matched } = mergeCatalogProjects(previous, scraped);

  assert.equal(matched, 1);
  assert.equal(projects[0].masterPlanUrl, "https://cdn/master.jpg");
  assert.equal(projects[0].slug, "the-cove", "the fresh slug should still win");
});

test("mergeCatalogProjects reports new projects as unmatched", () => {
  const previous: CatalogProject[] = [{ id: "p1", masterPlanUrl: "m.jpg" }];
  const scraped: CatalogProject[] = [{ id: "p1" }, { id: "p2" }];

  const { projects, matched } = mergeCatalogProjects(previous, scraped);

  assert.equal(matched, 1);
  assert.equal(projects.length, 2);
  assert.equal(projects[1].masterPlanUrl, undefined);
});

test("mergeCatalogProjects drops projects PF no longer lists", () => {
  // Long-standing behaviour — PF delists a project when it completes.
  // MIN_PROJECT_RETENTION in the caller is what stops this becoming a cliff.
  const previous: CatalogProject[] = [{ id: "p1" }, { id: "gone" }];
  const scraped: CatalogProject[] = [{ id: "p1" }];

  const { projects } = mergeCatalogProjects(previous, scraped);

  assert.deepEqual(
    projects.map((p) => p.id),
    ["p1"],
  );
});

test("mergeCatalogProjects preserves enrichment across a realistic scrape", () => {
  const previous: CatalogProject[] = Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`,
    masterPlanUrl: i < 90 ? `https://cdn/${i}.jpg` : undefined,
    descriptionUnique: i < 40 ? `<p>Unique ${i}</p>` : undefined,
  }));
  // PF returns everything, plus fresh prices, and knows nothing of enrichment.
  const scraped: CatalogProject[] = Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`,
    units: [{ launchPriceAed: 1_000_000 + i }],
  }));

  const { projects } = mergeCatalogProjects(previous, scraped);

  assert.match(enrichmentSummary(projects), /masterPlanUrl=90/);
  assert.match(enrichmentSummary(projects), /descriptionUnique=40/);
});

test("enrichmentSummary does not count empty arrays as present", () => {
  // scrape-pf-floorplans.ts writes [] for a project it checked and found none —
  // a real answer, but not content. Counting it would overstate coverage.
  const projects: CatalogProject[] = [
    { id: "p1", floorPlans: [{ beds: 1 }] },
    { id: "p2", floorPlans: [] },
    { id: "p3" },
  ];

  assert.match(enrichmentSummary(projects), /floorPlans=1/);
});

test("loadPreviousCatalog returns null only when there is nothing there", () => {
  const dir = tmp();
  try {
    assert.equal(loadPreviousCatalog(join(dir, "nope.json")), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPreviousCatalog refuses to treat an unreadable catalog as absent", () => {
  // The dangerous case: swallowing a parse error would return null, the merge
  // would find nothing to preserve, and the scrape would overwrite a catalog
  // that was merely truncated mid-write.
  const dir = tmp();
  const path = join(dir, "catalog.json");
  try {
    writeFileSync(path, '{"projects":[{"id":"p1"');
    assert.throws(() => loadPreviousCatalog(path), /not valid JSON/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPreviousCatalog refuses a file with no projects[]", () => {
  const dir = tmp();
  const path = join(dir, "catalog.json");
  try {
    writeFileSync(path, '{"version":2}');
    assert.throws(() => loadPreviousCatalog(path), /no projects\[\]/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPreviousCatalog reads a real catalog", () => {
  const dir = tmp();
  const path = join(dir, "catalog.json");
  try {
    writeFileSync(path, JSON.stringify({ version: 2, projects: [{ id: "p1" }] }));
    assert.deepEqual(loadPreviousCatalog(path)?.projects, [{ id: "p1" }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
