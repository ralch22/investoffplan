/**
 * THE RATCHET. Fails CI if any committed catalog/enrichment asset is hotlinked
 * from a third party instead of mirrored onto our own R2/CDN.
 *
 * This is the guard the codebase lacked. Before it: 17,927 assets hotlinked
 * (floor plans and master plans with ZERO mirrors), the enrichment store was
 * ~26% dead, and /projects/al-haseen-residence-6 rendered a black gallery — all
 * introduced silently, because nothing ever asserted where an asset lives.
 *
 * The store only changes when a human runs a scraper and commits the result, so
 * a PR-time check catches re-rot at the exact moment it would enter — no
 * scheduled job can do that (nothing schedules the enrichment writers at all).
 *
 * If this fails: run `npx tsx scripts/mirror-assets.ts` and commit the result.
 * Do not add hosts to an allowlist — "reliable host" is the assumption that
 * produced the outage.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { externalAssetUrls, isExternalAsset } from "./mirror-plan";

const ROOT = process.cwd();

function loadJson<T>(rel: string): T | null {
  const path = join(ROOT, rel);
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null;
}

function summarise(urls: string[]): string {
  const hosts: Record<string, number> = {};
  for (const u of urls) {
    try {
      const h = new URL(u).host;
      hosts[h] = (hosts[h] ?? 0) + 1;
    } catch {
      hosts["(unparseable)"] = (hosts["(unparseable)"] ?? 0) + 1;
    }
  }
  const top = Object.entries(hosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([h, n]) => `${h}:${n}`)
    .join(", ");
  return `${urls.length} hotlinked asset(s). Top hosts: ${top}. ` +
    `Fix: npx tsx scripts/mirror-assets.ts`;
}

test("catalog hotlinks no third-party assets", () => {
  const catalog = loadJson<{ projects: Array<{ slug: string }> }>("data/catalog.json");
  if (!catalog) return; // catalog is gitignored in some checkouts; nothing to assert
  const offenders = catalog.projects.flatMap((p) => externalAssetUrls(p));
  assert.equal(offenders.length, 0, summarise(offenders));
});

test("enrichment store hotlinks no third-party images", () => {
  const store = loadJson<{ projects: Record<string, { images?: string[] }> }>(
    "data/project-enrichments.json",
  );
  if (!store) return;
  const offenders = Object.values(store.projects).flatMap((e) =>
    (e.images ?? []).filter(isExternalAsset),
  );
  assert.equal(offenders.length, 0, summarise(offenders));
});
