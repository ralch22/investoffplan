/**
 * Pins the classifier and retry behavior guarding the weekly D1 upsert.
 * The 502-as-HTML fixture is verbatim from ingest run 29470437050 — the
 * failure this module exists to survive.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isTransientD1Error, withTransientRetry } from "./d1-transient";

function nested502(): Error {
  // Drizzle wraps the D1 error, which wraps the raw fetch error — the
  // transient marker only appears in the innermost causes.
  const inner = new Error(
    "Failed to parse body as JSON, got: <html>\n<head><title>502 Bad Gateway</title></head>",
  );
  const d1 = new Error("D1_ERROR: Failed to parse body as JSON, got: <html>", {
    cause: inner,
  });
  return new Error('Failed query: insert into "projects" …', { cause: d1 });
}

test("isTransientD1Error finds the 502 buried in the cause chain", () => {
  assert.equal(isTransientD1Error(nested502()), true);
});

test("isTransientD1Error treats SQL-level failures as permanent", () => {
  // Retrying a schema bug would turn one loud failure into five slow ones.
  assert.equal(
    isTransientD1Error(new Error("D1_ERROR: no such table: catalog_meta: SQLITE_ERROR")),
    false,
  );
  assert.equal(
    isTransientD1Error(new Error("D1_TYPE_ERROR: Type 'object' not supported")),
    false,
  );
  assert.equal(
    isTransientD1Error(new Error("UNIQUE constraint failed: projects.id")),
    false,
  );
});

test("isTransientD1Error catches plain network failures", () => {
  assert.equal(isTransientD1Error(new Error("fetch failed")), true);
  assert.equal(isTransientD1Error(new TypeError("Network connection lost.")), true);
});

test("withTransientRetry retries transient failures then succeeds", async () => {
  let calls = 0;
  const result = await withTransientRetry(
    "test",
    async () => {
      calls++;
      if (calls < 3) throw nested502();
      return "ok";
    },
    { baseDelayMs: 1 },
  );
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("withTransientRetry rethrows permanent errors without retrying", async () => {
  let calls = 0;
  await assert.rejects(
    withTransientRetry(
      "test",
      async () => {
        calls++;
        throw new Error("no such table: catalog_meta");
      },
      { baseDelayMs: 1 },
    ),
    /no such table/,
  );
  assert.equal(calls, 1);
});

test("withTransientRetry gives up after the attempt budget", async () => {
  let calls = 0;
  await assert.rejects(
    withTransientRetry(
      "test",
      async () => {
        calls++;
        throw nested502();
      },
      { attempts: 3, baseDelayMs: 1 },
    ),
    /Failed query/,
  );
  assert.equal(calls, 3);
});
