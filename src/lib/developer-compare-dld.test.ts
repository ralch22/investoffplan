/**
 * Pins the DLD-boundary contract for developer pages: DLD numbers may reach a
 * developer surface ONLY via community keys — never by matching developer
 * names against DLD records (naming drift, JVs, and master-developer vs
 * builder make that join unsafe; see developer-compare.ts header). The lookup
 * is injected precisely so this test can observe every query the enrichment
 * makes.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { communityDldRows } from "./developer-compare-dld";

test("communityDldRows queries community keys and nothing else", () => {
  const queried: string[] = [];
  const lookup = (name: string) => {
    queried.push(name);
    return { medianPpsqft: 1500, saleSample: 40 };
  };

  const rows = communityDldRows(["Dubai Marina", "Business Bay"], lookup);

  // Every query is one of the passed community names — a developer name can
  // never sneak into the DLD lookup path.
  assert.deepEqual(queried, ["Dubai Marina", "Business Bay"]);
  assert.deepEqual(
    rows.map((r) => r.community),
    ["Dubai Marina", "Business Bay"],
  );
});

test("communityDldRows drops communities without usable stats", () => {
  const rows = communityDldRows(
    ["Covered", "NoStats", "NullPpsf", "ZeroPpsf"],
    (name) =>
      name === "Covered"
        ? { medianPpsqft: 1234.6, saleSample: 55 }
        : name === "NullPpsf"
          ? { medianPpsqft: null, saleSample: 10 }
          : name === "ZeroPpsf"
            ? { medianPpsqft: 0, saleSample: 10 }
            : null,
  );

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], { community: "Covered", medianPpsqft: 1235, saleSample: 55 });
});

test("communityDldRows respects the row limit but keeps scanning past misses", () => {
  const communities = ["m1", "hit1", "m2", "hit2", "hit3"];
  const rows = communityDldRows(
    communities,
    (name) => (name.startsWith("hit") ? { medianPpsqft: 1000, saleSample: 20 } : null),
    2,
  );
  assert.deepEqual(
    rows.map((r) => r.community),
    ["hit1", "hit2"],
  );
});
