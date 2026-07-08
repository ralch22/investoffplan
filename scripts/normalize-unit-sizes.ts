#!/usr/bin/env npx tsx
/**
 * One-off repair: normalize mixed sqm/sqft unit sizes in data/catalog.json.
 * PF's unit payload mixes scales in the same field (PF renders both as
 * "sqft"); the scrapers now normalize at ingest — this fixes the catalog
 * already on disk without a full rescrape.
 *
 *   npx tsx scripts/normalize-unit-sizes.ts --dry-run
 *   npx tsx scripts/normalize-unit-sizes.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeUnitSize } from "./lib/pf-ingest-helpers";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const dryRun = process.argv.includes("--dry-run");

interface SizedUnit {
  beds: number;
  sqftMin: number;
  sqftMax?: number;
  launchPriceAed?: number;
}

const stats = {
  total: 0,
  converted: 0,
  suspect: 0,
  byBeds: new Map<number, { total: number; converted: number }>(),
  examples: [] as string[],
};

function apply(unit: SizedUnit, label: string) {
  stats.total += 1;
  const beds = stats.byBeds.get(unit.beds) ?? { total: 0, converted: 0 };
  beds.total += 1;
  const size = normalizeUnitSize({
    beds: unit.beds,
    sqftMin: unit.sqftMin,
    sqftMax: unit.sqftMax,
    priceAed: unit.launchPriceAed,
  });
  if (size.converted) {
    stats.converted += 1;
    beds.converted += 1;
    if (stats.examples.length < 8) {
      stats.examples.push(
        `${label}: beds=${unit.beds} ${unit.sqftMin}${unit.sqftMax ? `-${unit.sqftMax}` : ""} → ${size.sqftMin}${size.sqftMax ? `-${size.sqftMax}` : ""} sqft`,
      );
    }
    unit.sqftMin = size.sqftMin;
    unit.sqftMax = size.sqftMax;
  }
  if (size.suspect) stats.suspect += 1;
  stats.byBeds.set(unit.beds, beds);
}

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));

for (const project of catalog.projects ?? []) {
  for (const unit of project.units ?? []) apply(unit, project.slug);
}
for (const unit of catalog.units ?? []) apply(unit, unit.projectSlug);

console.log(
  `[normalize-sizes] ${stats.total} unit rows scanned, ${stats.converted} converted sqm→sqft, ${stats.suspect} still implausible (left as-is)`,
);
for (const [beds, b] of [...stats.byBeds.entries()].sort((a, c) => a[0] - c[0])) {
  console.log(`  beds=${beds}: ${b.converted}/${b.total} converted`);
}
console.log(stats.examples.map((e) => `  e.g. ${e}`).join("\n"));

if (dryRun) {
  console.log("[normalize-sizes] dry run — catalog.json not modified");
} else {
  writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`[normalize-sizes] wrote ${CATALOG}`);
}
