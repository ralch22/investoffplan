/**
 * Custody rules for data/catalog.json.
 *
 * Property Finder is the source of truth for pricing, media and availability —
 * and for nothing else. Unique descriptions, floor plans, master plans and FAQs
 * are produced by other scripts (or by hand), most of which do not run in the
 * weekly pipeline, so a scraper that rewrites the catalog wholesale silently
 * deletes them. The weekly workflow then commits that deletion to main and
 * upserts it to production D1, which makes it unrecoverable short of a revert.
 *
 * These helpers live apart from the scrapers so they can be tested without
 * launching a browser against PF. See scripts/lib/catalog-merge.test.ts.
 */
import { existsSync, readFileSync } from "node:fs";

/**
 * A scrape materially short of what PF says it holds means we were throttled or
 * cut off mid-pagination — not that Dubai lost hundreds of projects overnight.
 * PF's advertised total runs a little ahead of what it actually serves (1,667
 * claimed vs 1,642 served on 2026-07-13), so this is deliberately loose: it is
 * a catastrophe check, not a precision check.
 */
export const MIN_UNIT_COMPLETENESS = 0.9;

/** Projects do leave the catalog as they complete — but never in a landslide. */
export const MIN_PROJECT_RETENTION = 0.8;

/**
 * The same backstop for units, and the one that was missing: MIN_UNIT_COMPLETENESS
 * above compares the scrape to PF's *own advertised total*, which a healthy scrape
 * matches exactly — so it never looks at what the catalog already held. On
 * 2026-07-16 a complete, perfectly healthy run would have taken units from 5,534
 * to 1,813 with that guard reporting 100%.
 */
export const MIN_UNIT_RETENTION = 0.8;

/**
 * Enrichment no PF listing scrape can produce. Reported after every merge so
 * the carry-forward is visible in the run log rather than merely asserted in a
 * comment — if a future refactor breaks the merge, these counts crater and say
 * so on the way past, instead of the loss surfacing weeks later as missing
 * pages.
 */
export const ENRICHMENT_FIELDS = [
  "description",
  "descriptionUnique",
  "floorPlans",
  "masterPlanUrl",
  "brochureUrl",
  "pfFaqs",
  "amenities",
  "salesStartDate",
  "ownershipType",
] as const;

export type CatalogProject = Record<string, unknown> & { id: string };
export type CatalogUnit = Record<string, unknown> & { projectId: string };

/**
 * Read the catalog a scrape is about to merge onto.
 *
 * Returns null only when there is genuinely nothing there. "Couldn't read it"
 * and "it doesn't exist" must not have the same effect: an unreadable catalog
 * is a reason to stop and look, not a licence to replace it with a bare scrape.
 */
export function loadPreviousCatalog(
  path: string,
): { projects: CatalogProject[]; units: CatalogUnit[] } | null {
  if (!existsSync(path)) return null; // first ever run — nothing to preserve
  let prev: unknown;
  try {
    prev = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(
      `${path} exists but is not valid JSON — refusing to overwrite it: ${(e as Error).message}`,
    );
  }
  const projects = (prev as { projects?: unknown })?.projects;
  if (!Array.isArray(projects)) {
    throw new Error(`${path} has no projects[] — refusing to overwrite it`);
  }
  // Absent units[] is fine — a catalog can predate the field, and there is then
  // nothing to lose. Present-but-not-an-array is a shape we do not understand,
  // and reading it as "no units" would carry none forward and delete them all.
  const units = (prev as { units?: unknown })?.units;
  if (units !== undefined && !Array.isArray(units)) {
    throw new Error(`${path} has a units[] that is not an array — refusing to overwrite it`);
  }
  return {
    projects: projects as CatalogProject[],
    units: (units ?? []) as CatalogUnit[],
  };
}

/**
 * Carry the previous project forward, letting fresh scraped data win.
 *
 * Deliberately keep-by-default rather than an allowlist of fields to preserve:
 * `next` only ever holds what the scraper itself built, so anything else on
 * `prev` is by definition someone else's enrichment and survives — including
 * fields added to the catalog after this code was written. The failure mode
 * being defended against is content vanishing silently, so the default has to
 * be "keep"; the cost of guessing wrong in this direction is a stale field,
 * and in the other direction it is permanent data loss.
 *
 * A plain `{ ...prev, ...next }` would not do: an explicitly-undefined key on
 * `next` (a transiently missing imageGallery, say) would punch a hole through
 * good data. Only defined values overwrite.
 */
export function mergeProject(
  prev: CatalogProject | undefined,
  next: CatalogProject,
): CatalogProject {
  if (!prev) return next;
  const merged: CatalogProject = { ...prev };
  for (const [k, v] of Object.entries(next)) {
    if (v !== undefined) merged[k] = v;
  }
  return merged;
}

/**
 * Merge a fresh scrape onto the existing catalog.
 *
 * Keyed on id (PF's projectId), not slug: slug is derived from the scrape and
 * then rewritten by apply-slug-disambiguation-to-catalog.ts, so it is not
 * stable across runs. A slug-keyed merge would silently miss every
 * disambiguated project and drop exactly the enrichment it exists to save.
 *
 * Projects the scrape did not see are carried forward, not dropped.
 *
 * This used to drop them, on the stated grounds that "PF delists a project when
 * it completes" and that MIN_PROJECT_RETENTION bounded the fallout. Both halves
 * were wrong, and measuring rather than reasoning is what showed it: a full run
 * on 2026-07-16 saw 627 of the catalog's 1,746 projects. The other 1,178 are not
 * completed projects — they were contributed by scrape-pf-developer-portfolio.ts,
 * which the scheduled pipeline does not run at all (catalog-ingest-pipeline.ts
 * only runs it under --dev-slug/--all-devlist/--smoke, and the weekly workflow
 * passes none of them). data/catalog.json says so itself: source is
 * "propertyfinder-unit-view+developer-portfolio×4".
 *
 * So the drop was not a trickle of completions to be bounded — it was 67% of the
 * catalog, every Monday, with nothing to put it back. The guard did not bound it;
 * it turned it into a hard failure, which is the only reason the catalog still
 * exists. The unit view is one source among several, and no source may delete
 * rows it is not the producer of.
 *
 * How many projects that view happens to cover is not even stable: it was 642 on
 * 2026-07-15 and 627 a day later. Which projects PF lists on a given Monday is
 * not a statement about which projects exist.
 *
 * A project that has genuinely completed keeps its page: PF marks it sold_out
 * rather than unlisting it, and the scrape maps that to status "sold-out".
 * Retiring a project for real deletes an indexed URL, so it should be a
 * deliberate act — not a side effect of which view we happened to scrape.
 */
export function mergeCatalogProjects(
  previous: CatalogProject[],
  scraped: CatalogProject[],
): { projects: CatalogProject[]; matched: number; carried: number } {
  const prevById = new Map(previous.map((p) => [String(p.id), p]));
  const scrapedIds = new Set(scraped.map((p) => String(p.id)));
  const merged = scraped.map((p) => mergeProject(prevById.get(String(p.id)), p));
  const carried = previous.filter((p) => !scrapedIds.has(String(p.id)));

  return {
    // Sorted by name, as the scrape already sorted its own. Without it the
    // carried 1,178 pile up behind the scraped 627 and reshuffle whenever a
    // project moves between the two, which buries the week's real price changes
    // in a few thousand lines of noise — and that diff is the only human check
    // this pipeline gets before it upserts to production.
    projects: [...merged, ...carried].sort((a, b) =>
      String(a.name ?? "").localeCompare(String(b.name ?? "")),
    ),
    matched: scraped.filter((p) => prevById.has(String(p.id))).length,
    carried: carried.length,
  };
}

/**
 * The same rule for units, and the more dangerous half: catalog.units is rebuilt
 * from the scrape wholesale, so a full run on 2026-07-16 would have cut 5,534
 * units to 1,813 — a 67% deletion that MIN_UNIT_COMPLETENESS cannot see, because
 * it only ever compares the scrape to PF's advertised total.
 *
 * Fixing the projects union alone would have made this worse, not better: it
 * lifts projects to 1,805, MIN_PROJECT_RETENTION stops objecting, and the write
 * proceeds — taking 3,836 units with it.
 *
 * PF is authoritative for the projects it served, so their units are replaced
 * rather than merged and a genuinely sold-out unit does disappear. Units of
 * projects the scrape never mentioned are carried forward untouched.
 */
export function mergeCatalogUnits(
  previous: CatalogUnit[],
  scraped: CatalogUnit[],
): { units: CatalogUnit[]; carried: number } {
  const scrapedProjectIds = new Set(scraped.map((u) => String(u.projectId)));
  const carried = previous.filter((u) => !scrapedProjectIds.has(String(u.projectId)));
  return { units: [...scraped, ...carried], carried: carried.length };
}

/** `field=count` for each enrichment field still populated after a merge. */
export function enrichmentSummary(projects: CatalogProject[]): string {
  return ENRICHMENT_FIELDS.map((f) => {
    const n = projects.filter((p) => {
      const v = p[f];
      return v != null && !(Array.isArray(v) && v.length === 0);
    }).length;
    return `${f}=${n}`;
  }).join(" ");
}
