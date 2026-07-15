/**
 * Limits for the saved-search alert dispatch.
 *
 * Both of these exist because of a fault that reached production and then sat
 * invisible until the weekly cron went red. They live here, apart from the
 * route, so they can be tested without a D1 binding or a live worker.
 */

/**
 * Batch size for `WHERE id IN (...)` lookups.
 *
 * D1 rejects any statement carrying more than 100 bound parameters. The
 * dispatch route reads units with one bound parameter per project id, so an
 * unchunked lookup throws the moment the new-launch window holds more than 100
 * projects. It did: the 2026-07-13 run bound 1,745 of them and D1 answered
 *
 *   Failed query: select ... from "project_units"
 *   where "project_units"."project_id" in (?, ?, ? ...)
 *
 * which Next.js turned into a bare 500 with an empty body, failing the whole
 * weekly workflow with nothing in it to say why.
 *
 * 90 rather than 100 because a statement's SET clause binds its own parameters
 * next to the id list, and a few more round trips cost nothing next to learning
 * this again from a red cron.
 */
export const D1_ID_BATCH = 90;

/** Split ids into batches D1 will accept. */
export function chunkIds<T>(ids: readonly T[], size: number = D1_ID_BATCH): T[][] {
  if (size < 1) throw new RangeError(`batch size must be >= 1, got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/**
 * More projects than this claiming to be first seen inside the one-week window
 * is a data event, not a launch event.
 *
 * `projects.first_seen_at` is stamped on insert, so a bulk load stamps its
 * entire cohort at one instant: all 1,745 rows in production carry
 * first_seen_at = 2026-07-12T03:55:13.159Z, the moment the table was seeded.
 * For the week after any such load, "first seen in the last 7 days" means "the
 * whole catalog".
 *
 * The busiest genuine week measured is 59 new projects, and even that was a
 * backlog flushed after the ingest had been broken for weeks rather than one
 * week's launches. 200 keeps better than 3x headroom over that while still
 * catching a whole-catalog stamp by an order of magnitude.
 *
 * Deliberately a digest suppressor and not an error: the run still succeeds and
 * still reports what it saw. A crash here would fail a workflow over data that
 * is merely surprising. The failure actually worth preventing is quieter —
 * telling subscribers that projects they have been browsing for months just
 * launched, which is wrong in a way no recipient can tell is a bug.
 */
export const MAX_NEW_LAUNCHES_PER_RUN = 200;

export function isImplausibleLaunchWave(newProjectCount: number): boolean {
  return newProjectCount > MAX_NEW_LAUNCHES_PER_RUN;
}
