/**
 * Pins the mirroring contract — the properties that make weekly re-mirroring
 * cheap and prevent silent re-rot.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  externalAssetUrls,
  isExternalAsset,
  isPermanentAssetFailure,
  mirrorKey,
  projectMirrorTargets,
} from "./mirror-plan";

const PF = "https://new-projects-media.propertyfinder.com/a/b/photo.webp";

test("only absolute URLs count as external — our own paths are not", () => {
  assert.equal(isExternalAsset(PF), true);
  assert.equal(isExternalAsset("http://x.test/a.jpg"), true);
  // Ours: already mirrored or static. Treating these as external would make the
  // mirror stage re-upload the whole catalog every single week.
  assert.equal(isExternalAsset("/cdn/projects/x/gallery/000.webp"), false);
  assert.equal(isExternalAsset("/images/marina-heights.jpg"), false);
  assert.equal(isExternalAsset("/brand/logo.svg"), false);
  assert.equal(isExternalAsset(undefined), false);
});

test("the same source URL always maps to the same key", () => {
  // This is what makes the weekly run a no-op: PF re-serves the same URL, the
  // exists-check hits, nothing re-downloads.
  assert.equal(mirrorKey("gallery", "x", PF), mirrorKey("gallery", "x", PF));
});

test("a gallery reorder does not change any key", () => {
  // The flaw in index-based keys (projects/<slug>/gallery/000.webp): reordering
  // silently re-uploads every image under shifted names.
  const a = "https://h.test/1.jpg";
  const b = "https://h.test/2.jpg";
  const before = projectMirrorTargets({ slug: "x", imageGallery: [a, b] });
  const after = projectMirrorTargets({ slug: "x", imageGallery: [b, a] });
  assert.deepEqual(
    before.map((t) => t.key).sort(),
    after.map((t) => t.key).sort(),
  );
});

test("distinct sources never collide; extension is preserved", () => {
  const k1 = mirrorKey("gallery", "x", "https://h.test/1.jpg");
  const k2 = mirrorKey("gallery", "x", "https://h.test/2.jpg");
  assert.notEqual(k1, k2);
  assert.ok(k1.endsWith(".jpg"));
  assert.ok(mirrorKey("gallery", "x", "https://h.test/a.webp").endsWith(".webp"));
  assert.ok(mirrorKey("brochure", "x", "https://h.test/a").endsWith(".pdf"), "brochure default");
});

test("developer logos dedupe globally, not per project", () => {
  // 1,221 project rows share ~200 logo URLs — slug-scoped keys would store the
  // same logo once per project.
  const logo = "https://h.test/emaar.png";
  assert.equal(mirrorKey("logo", "project-a", logo), mirrorKey("logo", "project-b", logo));
  assert.ok(mirrorKey("logo", "project-a", logo).startsWith("developers/logos/"));
});

test("only an explicit gone-status is permanent — everything else retries", () => {
  // The bug this pins: the first backfill treated every exception as death and
  // discarded 1,128 of 3,500 HEALTHY assets (they all mirrored on retry). A
  // transient socket error must never delete a real image.
  assert.equal(isPermanentAssetFailure("HTTP 404 for https://h.test/a.jpg"), true);
  assert.equal(isPermanentAssetFailure("HTTP 410 for https://h.test/a.jpg"), true);

  assert.equal(isPermanentAssetFailure("fetch failed"), false);
  assert.equal(isPermanentAssetFailure("HTTP 429 for https://h.test/a.jpg"), false);
  assert.equal(isPermanentAssetFailure("HTTP 503 for https://h.test/a.jpg"), false);
  assert.equal(isPermanentAssetFailure("terminated"), false);
  assert.equal(isPermanentAssetFailure("ECONNRESET"), false);
  // 404 must match as a status, not as a coincidence inside a URL.
  assert.equal(isPermanentAssetFailure("fetch failed for https://h.test/404/a.jpg"), false);
});

test("every hotlinkable field is collected, none missed", () => {
  const targets = projectMirrorTargets({
    slug: "x",
    imageUrl: "https://h.test/hero.jpg",
    imageGallery: ["https://h.test/g1.jpg", "/cdn/already/ours.webp"],
    floorPlans: [{ imageUrl: "https://h.test/fp.jpg" }, { imageUrl: "/cdn/fp2.webp" }],
    masterPlanUrl: "https://h.test/mp.jpg",
    brochureUrl: "https://h.test/b.pdf",
    developerLogo: "https://h.test/logo.png",
  });
  assert.deepEqual(
    targets.map((t) => t.kind).sort(),
    ["brochure", "floorplan", "gallery", "hero", "logo", "masterplan"],
  );
  // Already-ours URLs are skipped in every field, including nested floorPlans.
  assert.equal(externalAssetUrls({ slug: "x", imageGallery: ["/cdn/a.webp"] }).length, 0);
});
