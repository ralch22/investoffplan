/**
 * Pins the self-hosted-only brochure rule: a brochure counts as downloadable
 * ONLY when it is a /cdn-hosted asset. Raw PropertyFinder / third-party URLs
 * are never surfaced as a download (they leak a competitor link and bypass
 * lead capture) — the UI falls back to the WhatsApp brochure request instead.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hostedBrochureUrl,
  isDownloadablePdfUrl,
  resolveBrochureUrl,
  hasDownloadableBrochure,
} from "./brochure";
import type { Project } from "./types";

test("self-hosted /cdn brochures are downloadable", () => {
  assert.equal(isDownloadablePdfUrl("/cdn/projects/105-residences/brochure.pdf"), true);
  assert.equal(isDownloadablePdfUrl("/cdn/projects/x/brochure/9810d6b77690.pdf"), true);
});

test("raw PropertyFinder / third-party URLs are NOT downloadable", () => {
  assert.equal(
    isDownloadablePdfUrl(
      "https://new-projects-media.propertyfinder.com/project/abc/brochure/x=/original.pdf",
    ),
    false,
  );
  assert.equal(isDownloadablePdfUrl("https://www.emaar.com/en/our-communities/"), false);
  assert.equal(isDownloadablePdfUrl("http://example.com/b.pdf"), false);
});

test("empty / sentinel / missing values are not downloadable", () => {
  assert.equal(isDownloadablePdfUrl(undefined), false);
  assert.equal(isDownloadablePdfUrl(""), false);
  assert.equal(isDownloadablePdfUrl("#brochure-request"), false);
  // A /cdn asset that is NOT a brochure (e.g. an image) is not a brochure PDF.
  assert.equal(isDownloadablePdfUrl("/cdn/projects/x/hero/abc.jpg"), false);
});

test("hostedBrochureUrl returns the url only when self-hosted, else undefined", () => {
  assert.equal(
    hostedBrochureUrl("/cdn/projects/x/brochure.pdf"),
    "/cdn/projects/x/brochure.pdf",
  );
  assert.equal(
    hostedBrochureUrl("https://new-projects-media.propertyfinder.com/x/brochure.pdf"),
    undefined,
  );
  assert.equal(hostedBrochureUrl(undefined), undefined);
});

test("hasDownloadableBrochure follows the same hosted-only rule via resolveBrochureUrl", () => {
  const hosted = { brochureUrl: "/cdn/projects/x/brochure.pdf" } as Project;
  const pf = {
    brochureUrl: "https://new-projects-media.propertyfinder.com/x/brochure.pdf",
  } as Project;
  const masterFallback = {
    brochureUrl: undefined,
    masterPlanUrl: "/cdn/projects/x/masterplan/brochure.pdf",
  } as Project;
  assert.equal(hasDownloadableBrochure(hosted), true);
  assert.equal(hasDownloadableBrochure(pf), false);
  // resolveBrochureUrl falls back to masterPlanUrl; still hosted-gated.
  assert.equal(resolveBrochureUrl(masterFallback)?.startsWith("/cdn/"), true);
});
