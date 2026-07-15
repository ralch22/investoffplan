/**
 * The shapes here are not invented — they mirror what live PF returned on
 * 2026-07-15 for pages 75, 76 and 77 of the unit view. The distinction they
 * pin (absent key vs empty array) is the difference between "the results ran
 * out, keep what we have" and "throw away the whole scrape at the last page".
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePagePayload } from "./pf-page-payload";

/** A page as PF serves it: __NEXT_DATA__ with props.pageProps inside. */
const payload = (pageProps: Record<string, unknown>) =>
  JSON.stringify({ props: { pageProps } });

const listing = (id: string) => ({ id, projectId: `proj-${id}` });

const meta = (total: number, pages: number) => ({
  searchResult: { meta: { count: { total }, pagination: { total: pages } } },
});

test("parses a full page of the unit view", () => {
  const units = Array.from({ length: 24 }, (_, i) => listing(`u${i}`));
  const res = parsePagePayload(
    payload({ unitLevelListings: units, ...meta(1813, 76) }),
  );

  assert.equal(res.units?.length, 24);
  assert.equal(res.total, 1813);
  assert.equal(res.totalPages, 76);
});

test("parses the short final page rather than treating it as suspicious", () => {
  // Page 76 of 76: 75*24 + 13 === 1813. A short page is the normal way a
  // paginated list ends, not a signal that anything went wrong.
  const res = parsePagePayload(
    payload({
      unitLevelListings: Array.from({ length: 13 }, (_, i) => listing(`u${i}`)),
      ...meta(1813, 76),
    }),
  );

  assert.equal(res.units?.length, 13);
});

test("an absent unitLevelListings key parses to null, not an empty list", () => {
  // This is PF's page-77 answer: no key, and the project view's own totals,
  // despite view=unit_types still being in the URL. Reporting [] here would
  // tell the caller "the unit view had no results", which is a different and
  // much more alarming claim than "this page does not exist".
  const res = parsePagePayload(payload({ ...meta(2889, 121) }));

  assert.equal(res.units, null);
  assert.equal(res.total, 2889);
  assert.equal(res.totalPages, 121);
});

test("an empty unitLevelListings array stays an empty array", () => {
  // PF answering the unit view with zero results is a real answer and must stay
  // distinguishable from PF not answering the unit view at all.
  const res = parsePagePayload(
    payload({ unitLevelListings: [], ...meta(1813, 76) }),
  );

  assert.deepEqual(res.units, []);
  assert.notEqual(res.units, null);
});

test("a non-array unitLevelListings is treated as absent", () => {
  assert.equal(parsePagePayload(payload({ unitLevelListings: null })).units, null);
  assert.equal(parsePagePayload(payload({ unitLevelListings: {} })).units, null);
});

test("survives a page with no pageProps at all", () => {
  // Deep out-of-range pages drop the metadata too. Fetching one is a caller
  // bug, but it must surface as "no units", not a TypeError mid-scrape.
  const res = parsePagePayload(JSON.stringify({ props: {} }));

  assert.equal(res.units, null);
  assert.equal(res.total, 0);
  assert.equal(res.totalPages, 1);
});

test("falls back to the page's own length when PF omits the count", () => {
  const res = parsePagePayload(payload({ unitLevelListings: [listing("a")] }));

  assert.equal(res.total, 1);
});

test("maps developer SERP links and defaults devList", () => {
  const res = parsePagePayload(
    payload({
      unitLevelListings: [listing("a")],
      seoData: {
        developerSerpPages: {
          links: [{ title: "Emaar", path: "/emaar", extra: "dropped" }],
        },
      },
    }),
  );

  assert.deepEqual(res.developerSerpLinks, [{ title: "Emaar", path: "/emaar" }]);
  assert.deepEqual(res.devList, []);
});

test("throws on a payload that is not JSON", () => {
  assert.throws(() => parsePagePayload("<!doctype html>"));
});
