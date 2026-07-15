/**
 * These pin the two things that broke the weekly alert dispatch in production:
 * a `WHERE id IN (...)` lookup that outgrew D1's bound-parameter ceiling, and a
 * "new this week" window that a bulk insert filled with the entire catalog.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  D1_ID_BATCH,
  MAX_NEW_LAUNCHES_PER_RUN,
  chunkIds,
  isImplausibleLaunchWave,
} from "./dispatch-limits";

test("no batch can exceed D1's 100 bound-parameter ceiling", () => {
  // The actual invariant. D1's documented limit is 100 per statement; the
  // margin below it is headroom for a SET clause's own parameters.
  assert.ok(D1_ID_BATCH <= 100, `D1_ID_BATCH must be <= 100, got ${D1_ID_BATCH}`);

  // 1,745 is what production bound on 2026-07-13, the run that returned 500.
  const ids = Array.from({ length: 1745 }, (_, i) => `p${i}`);
  for (const batch of chunkIds(ids)) {
    assert.ok(batch.length <= 100, `batch of ${batch.length} would be rejected by D1`);
  }
});

test("chunkIds covers every id exactly once, in order", () => {
  // A lookup that silently dropped ids would turn a 500 into missing alerts,
  // which is worse: nothing goes red.
  const ids = Array.from({ length: 1745 }, (_, i) => `p${i}`);

  assert.deepEqual(chunkIds(ids).flat(), ids);
});

test("chunkIds handles the boundaries around a full batch", () => {
  const ids = Array.from({ length: D1_ID_BATCH }, (_, i) => i);

  assert.equal(chunkIds(ids).length, 1, "exactly one full batch stays one batch");
  assert.equal(chunkIds([...ids, 999]).length, 2, "one over spills into a second");
  assert.deepEqual(chunkIds([...ids, 999])[1], [999]);
});

test("chunkIds on an empty list produces no queries at all", () => {
  // Not a curiosity: an empty IN () is a SQL syntax error, so the caller must
  // get zero batches rather than one empty one.
  assert.deepEqual(chunkIds([]), []);
});

test("chunkIds rejects a batch size that would loop forever", () => {
  assert.throws(() => chunkIds(["a"], 0), RangeError);
});

test("a whole-catalog first_seen_at stamp is not a launch wave", () => {
  // Production's exact state: every project seeded at one instant, so all 1,745
  // fall inside the 7-day window. Emailing this would announce the entire
  // catalog as new.
  assert.equal(isImplausibleLaunchWave(1745), true);
});

test("a real week of launches still alerts", () => {
  // 59 is the busiest week measured, and it was a multi-week backlog flushed
  // after the ingest had been broken — a genuine week is smaller still. The
  // guard has to stay clear of it or it suppresses the product.
  assert.equal(isImplausibleLaunchWave(59), false);
  assert.equal(isImplausibleLaunchWave(0), false);
  assert.equal(isImplausibleLaunchWave(MAX_NEW_LAUNCHES_PER_RUN), false);
  assert.equal(isImplausibleLaunchWave(MAX_NEW_LAUNCHES_PER_RUN + 1), true);
});

test("the guard leaves real headroom over the busiest week on record", () => {
  assert.ok(
    MAX_NEW_LAUNCHES_PER_RUN >= 59 * 3,
    "shrinking this below 3x the busiest observed week starts suppressing real alerts",
  );
});
