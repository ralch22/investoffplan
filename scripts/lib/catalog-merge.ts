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

/**
 * Read the catalog a scrape is about to merge onto.
 *
 * Returns null only when there is genuinely nothing there. "Couldn't read it"
 * and "it doesn't exist" must not have the same effect: an unreadable catalog
 * is a reason to stop and look, not a licence to replace it with a bare scrape.
 */
export function loadPreviousCatalog(path: string): { projects: CatalogProject[] } | null {
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
  return { projects: projects as CatalogProject[] };
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
 * Projects absent from the scrape are dropped, which is the long-standing
 * behaviour: PF delists a project when it completes. MIN_PROJECT_RETENTION is
 * what bounds that from becoming a cliff.
 */
export function mergeCatalogProjects(
  previous: CatalogProject[],
  scraped: CatalogProject[],
): { projects: CatalogProject[]; matched: number } {
  const prevById = new Map(previous.map((p) => [String(p.id), p]));
  const projects = scraped.map((p) => mergeProject(prevById.get(String(p.id)), p));
  const matched = scraped.filter((p) => prevById.has(String(p.id))).length;
  return { projects, matched };
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
