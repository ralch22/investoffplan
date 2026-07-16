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
  mergeCatalogUnits,
  mergeProject,
  enrichmentSummary,
  type CatalogProject,
  type CatalogUnit,
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

test("mergeCatalogProjects carries forward projects the scrape never saw", () => {
  // This used to assert the opposite, on the theory that an absent project is a
  // completed one. Measured on 2026-07-16: a full 77-page run saw 627 of the
  // catalog's 1,746 projects. The missing 1,178 came from
  // scrape-pf-developer-portfolio.ts, which the scheduled pipeline never runs —
  // so dropping them deleted 67% of the catalog every Monday with nothing to put
  // it back. The unit view is one source; it does not get to delete another's rows.
  const previous: CatalogProject[] = [
    { id: "p1", name: "Alpha" },
    { id: "from-dev-portfolio", name: "Beta", masterPlanUrl: "https://cdn/m.jpg" },
  ];
  const scraped: CatalogProject[] = [{ id: "p1", name: "Alpha" }];

  const { projects, carried } = mergeCatalogProjects(previous, scraped);

  assert.equal(carried, 1);
  assert.deepEqual(
    projects.map((p) => p.id),
    ["p1", "from-dev-portfolio"],
  );
  assert.equal(
    projects[1].masterPlanUrl,
    "https://cdn/m.jpg",
    "a carried project keeps its enrichment intact",
  );
});

test("mergeCatalogProjects sorts the union by name", () => {
  // Carried projects must not simply pile up behind scraped ones: the weekly
  // committed catalog.json diff is the only human check before production D1,
  // and a reshuffling tail buries the week's real price changes.
  const previous: CatalogProject[] = [
    { id: "z", name: "Zephyr Tower" },
    { id: "a", name: "Acacia Villas" },
  ];
  const scraped: CatalogProject[] = [{ id: "m", name: "Marina Vista" }];

  const { projects } = mergeCatalogProjects(previous, scraped);

  assert.deepEqual(
    projects.map((p) => p.name),
    ["Acacia Villas", "Marina Vista", "Zephyr Tower"],
  );
});

test("mergeCatalogUnits keeps units of projects the scrape never mentioned", () => {
  // The dangerous half: catalog.units is rebuilt from the scrape wholesale, so
  // on 2026-07-16 a complete run would have cut 5,534 units to 1,813 — and
  // MIN_UNIT_COMPLETENESS reports 100% throughout, because it only compares the
  // scrape to PF's own advertised total.
  const previous: CatalogUnit[] = [
    { id: "u1", projectId: "p1", launchPriceAed: 1_000_000 },
    { id: "u2", projectId: "from-dev-portfolio", launchPriceAed: 2_000_000 },
  ];
  const scraped: CatalogUnit[] = [
    { id: "u1", projectId: "p1", launchPriceAed: 1_100_000 },
  ];

  const { units, carried } = mergeCatalogUnits(previous, scraped);

  assert.equal(carried, 1);
  assert.deepEqual(
    units.map((u) => u.id),
    ["u1", "u2"],
  );
  assert.equal(units[0].launchPriceAed, 1_100_000, "PF's fresh price wins");
});

test("mergeCatalogUnits lets a scraped project lose a unit", () => {
  // PF is authoritative for what it served: its units are replaced, not merged,
  // so a unit that genuinely sold out disappears. Carrying these forward would
  // make sold-out inventory immortal.
  const previous: CatalogUnit[] = [
    { id: "u1", projectId: "p1" },
    { id: "u2", projectId: "p1" },
  ];
  const scraped: CatalogUnit[] = [{ id: "u1", projectId: "p1" }];

  const { units, carried } = mergeCatalogUnits(previous, scraped);

  assert.equal(carried, 0);
  assert.deepEqual(
    units.map((u) => u.id),
    ["u1"],
  );
});

test("mergeCatalogProjects gives a re-scraped project the fresh lastSeenAt", () => {
  // The stamp is scraper-produced (set on every row the run observed), so on a
  // re-scraped project the fresh value must overwrite last week's — that
  // overwrite IS the observation being recorded.
  const previous: CatalogProject[] = [
    { id: "p1", name: "Alpha", lastSeenAt: "2026-07-20T04:00:00.000Z" },
  ];
  const scraped: CatalogProject[] = [
    { id: "p1", name: "Alpha", lastSeenAt: "2026-07-27T04:00:00.000Z" },
  ];

  const { projects } = mergeCatalogProjects(previous, scraped);

  assert.equal(projects[0].lastSeenAt, "2026-07-27T04:00:00.000Z");
});

test("mergeCatalogProjects keeps a carried project's stamp — or its absence", () => {
  // A carried row keeps whatever observation history it has. Crucially an
  // unstamped row must STAY unstamped: absent means "never seen since tracking
  // began", and backfilling it would erase the one distinction (seen-then-lost
  // vs never-covered) this field exists to make.
  const previous: CatalogProject[] = [
    { id: "p1", name: "Alpha" },
    { id: "seen-once", name: "Beta", lastSeenAt: "2026-07-20T04:00:00.000Z" },
    { id: "from-dev-portfolio", name: "Gamma" },
  ];
  const scraped: CatalogProject[] = [
    { id: "p1", name: "Alpha", lastSeenAt: "2026-07-27T04:00:00.000Z" },
  ];

  const { projects } = mergeCatalogProjects(previous, scraped);
  const byId = new Map(projects.map((p) => [p.id, p]));

  assert.equal(byId.get("seen-once")?.lastSeenAt, "2026-07-20T04:00:00.000Z");
  assert.equal(byId.get("from-dev-portfolio")?.lastSeenAt, undefined);
});

test("mergeCatalogUnits stamps a scraped project's replaced units, keeps carried stamps", () => {
  // Unit freshness is keyed on projectId: a scraped project's units are
  // replaced as a set (all fresh stamps), everything else rides through with
  // its history — stamped or not — intact.
  const previous: CatalogUnit[] = [
    { id: "u1", projectId: "p1", lastSeenAt: "2026-07-20T04:00:00.000Z" },
    { id: "u2", projectId: "seen-once", lastSeenAt: "2026-07-20T04:00:00.000Z" },
    { id: "u3", projectId: "from-dev-portfolio" },
  ];
  const scraped: CatalogUnit[] = [
    { id: "u1", projectId: "p1", lastSeenAt: "2026-07-27T04:00:00.000Z" },
  ];

  const { units } = mergeCatalogUnits(previous, scraped);
  const byId = new Map(units.map((u) => [u.id, u]));

  assert.equal(byId.get("u1")?.lastSeenAt, "2026-07-27T04:00:00.000Z");
  assert.equal(byId.get("u2")?.lastSeenAt, "2026-07-20T04:00:00.000Z");
  assert.equal(byId.get("u3")?.lastSeenAt, undefined);
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
    writeFileSync(
      path,
      JSON.stringify({
        version: 2,
        projects: [{ id: "p1" }],
        units: [{ id: "u1", projectId: "p1" }],
      }),
    );
    const prev = loadPreviousCatalog(path);
    assert.deepEqual(prev?.projects, [{ id: "p1" }]);
    assert.deepEqual(prev?.units, [{ id: "u1", projectId: "p1" }]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPreviousCatalog treats absent units[] as none, not as an error", () => {
  // A catalog can predate the field; there is then nothing to carry forward.
  const dir = tmp();
  const path = join(dir, "catalog.json");
  try {
    writeFileSync(path, JSON.stringify({ version: 2, projects: [{ id: "p1" }] }));
    assert.deepEqual(loadPreviousCatalog(path)?.units, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("loadPreviousCatalog refuses a units[] that is not an array", () => {
  // Reading an unfamiliar shape as "no units" would carry none forward and
  // delete every one of them — the same trade as the projects[] check above.
  const dir = tmp();
  const path = join(dir, "catalog.json");
  try {
    writeFileSync(path, JSON.stringify({ version: 2, projects: [{ id: "p1" }], units: {} }));
    assert.throws(() => loadPreviousCatalog(path), /units\[\] that is not an array/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
