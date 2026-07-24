/**
 * Unit tests for the MCP worker's pure surface: arg clamps, filter mapping,
 * URL shape, and the honesty gates that ride in via dld-area-stats. No D1 —
 * the db-touching handlers stay thin precisely so this layer is testable.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PAGE_SIZE,
  resolveAreaStats,
  SITE,
  cardWithUrl,
  clampPageSize,
  mortgageInput,
  toSearchQuery,
} from "./tools";
import { getAreaStats } from "../lib/dld-area-stats";
import { calculateMortgage, MAX_TERM_YEARS, MIN_DOWN_PAYMENT_PCT } from "../lib/mortgage";
import type { Project } from "../lib/types";

test("clampPageSize: defaults, floors, and the hard ceiling", () => {
  assert.equal(clampPageSize(undefined), 8);
  assert.equal(clampPageSize("12"), 8);
  assert.equal(clampPageSize(3.9), 3);
  assert.equal(clampPageSize(0), 1);
  assert.equal(clampPageSize(999), MAX_PAGE_SIZE);
});

test("toSearchQuery: studio (beds 0) survives, absent filters widen to 'all'", () => {
  const q = toSearchQuery({ beds: 0, maxPriceAed: 1_500_000 });
  assert.equal(q.filters.beds, 0);
  assert.equal(q.filters.maxPrice, 1_500_000);
  assert.equal(q.filters.minPrice, null);
  assert.equal(q.filters.city, "all");
  assert.equal(q.filters.developer, "all");
  assert.equal(q.filters.handoverBy, "all");
  assert.equal(q.view, "project");
  assert.equal(toSearchQuery({}).page, 1);
  assert.equal(toSearchQuery({ page: 2.7 }).page, 2);
});

test("cardWithUrl emits only canonical PDP URLs", () => {
  const project = {
    slug: "marina-vista",
    name: "Marina Vista",
    developer: "Emaar",
    area: "Dubai Marina",
    city: "Dubai",
    units: [],
  } as unknown as Project;
  const card = cardWithUrl(project);
  assert.equal(card.url, `${SITE}/projects/marina-vista`);
});

test("mortgageInput clamps to UAE norms and never undercuts the 20% floor", () => {
  const low = mortgageInput({ priceAed: 1_000_000, downPaymentPct: 5, termYears: 40 });
  assert.equal(low.downPaymentPct, MIN_DOWN_PAYMENT_PCT);
  assert.equal(low.termYears, MAX_TERM_YEARS);
  assert.equal(low.includeFees, true);
  const result = calculateMortgage(low);
  assert.ok(result.monthlyPaymentAed > 0);
  assert.ok(result.cashToCloseAed > result.downPaymentAed, "fees included in cash to close");
});

test("market stats honesty gate: yields above 12% are withheld by the shared lib", () => {
  // Every area the static dataset exposes must satisfy the cap after
  // sanitisation — this is the same code path the MCP tool serves from.
  const jvc = getAreaStats("Jumeirah Village Circle");
  assert.ok(jvc, "JVC must resolve via the areaKey crosswalk");
  if (jvc?.grossYieldPct != null) assert.ok(jvc.grossYieldPct <= 12);
  assert.equal(getAreaStats("Definitely Not A Real Community"), null);
});

test("resolveAreaStats speaks agent: nicknames resolve via the site's own alias map", () => {
  const byNickname = resolveAreaStats("JVC");
  const byName = resolveAreaStats("Jumeirah Village Circle");
  assert.ok(byNickname, "JVC must resolve");
  assert.equal(byNickname?.areaLabel, byName?.areaLabel);
  assert.equal(resolveAreaStats("not-a-place-anywhere"), null);
});
