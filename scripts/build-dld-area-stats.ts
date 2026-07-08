/**
 * Offline ETL: DLD open-data CSVs → data/dld-area-stats.json (anonymized
 * area-level aggregates only — median sold price, AED/sqft, 12-mo volume,
 * price trend, and gross rental yield). NEVER ingests owner/purchase-level PII.
 *
 * Node-only (fs/readline) — this is a build-time job, not request-time code.
 * The pure math + area crosswalk comes from src/lib/dld.ts (ported from the
 * BelowOP layer). Run: tsx scripts/build-dld-area-stats.ts "<BIG DATA dir>"
 */
import { createReadStream, existsSync, readdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import {
  areaKey,
  confidenceFor,
  grossYieldPct,
  mapRentRow,
  mapSaleRow,
  median,
  MIN_DLD_SAMPLE,
  parseCsvLine,
  saleStats,
  type DldRent,
  type DldSale,
} from "../src/lib/dld";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error('Usage: tsx scripts/build-dld-area-stats.ts "<BIG DATA dir>"');
  process.exit(1);
}

function monthlyFiles(sub: string): string[] {
  const p = join(dir, sub);
  if (!existsSync(p)) return [];
  return readdirSync(p)
    .filter((f) => f.toLowerCase().endsWith(".csv"))
    .sort()
    .map((f) => join(p, f));
}

async function streamRows(file: string, onRow: (r: Record<string, string>) => void) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let headers: string[] | null = null;
  for await (const raw of rl) {
    const line = headers === null ? raw.replace(/^﻿/, "") : raw;
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    if (headers === null) {
      headers = cells.map((h) => h.trim());
      continue;
    }
    const rec: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) rec[headers[i]] = cells[i] ?? "";
    onRow(rec);
  }
}

async function main() {
  const salesByArea = new Map<string, DldSale[]>();
  const rentsByArea = new Map<string, number[]>();

  const txFiles = monthlyFiles("TRANSACTIONS");
  const rentFiles = monthlyFiles("RENTS");
  console.log(`[dld] ${txFiles.length} transaction files, ${rentFiles.length} rent files`);

  for (const f of txFiles) {
    await streamRows(f, (rec) => {
      const sale = mapSaleRow(rec);
      if (!sale) return;
      const key = areaKey(sale.area);
      const arr = salesByArea.get(key);
      if (arr) arr.push(sale);
      else salesByArea.set(key, [sale]);
    });
  }
  for (const f of rentFiles) {
    await streamRows(f, (rec) => {
      const rent: DldRent | null = mapRentRow(rec);
      if (!rent) return;
      const key = areaKey(rent.area);
      const arr = rentsByArea.get(key);
      if (arr) arr.push(rent.annualRent);
      else rentsByArea.set(key, [rent.annualRent]);
    });
  }

  const areas: Record<string, unknown> = {};
  let kept = 0;
  for (const [key, sales] of salesByArea) {
    if (sales.length < MIN_DLD_SAMPLE) continue;
    const stats = saleStats(sales);
    const rents = rentsByArea.get(key) ?? [];
    const medianAnnualRent = median(rents);
    const gross = grossYieldPct(medianAnnualRent, stats.medianPrice);
    // human label: the most common raw area string in this cohort
    const labelCounts = new Map<string, number>();
    for (const s of sales) labelCounts.set(s.area, (labelCounts.get(s.area) ?? 0) + 1);
    const areaLabel = [...labelCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

    areas[key] = {
      areaLabel,
      saleSample: stats.sample,
      medianPrice: stats.medianPrice,
      medianPpsqft: stats.medianPpsqft == null ? null : Math.round(stats.medianPpsqft),
      appreciationPct: stats.appreciationPct == null ? null : Math.round(stats.appreciationPct * 10) / 10,
      monthlyTrend: stats.monthlyTrend.map((t) => ({
        month: t.month,
        medianPpsqft: Math.round(t.medianPpsqft),
        n: t.n,
      })),
      rentSample: rents.length,
      medianAnnualRent,
      grossYieldPct: gross == null ? null : Math.round(gross * 10) / 10,
      confidence: confidenceFor(stats.sample),
    };
    kept++;
  }

  const out = {
    source: "Dubai Land Department open data (2025)",
    sourcePeriod: "2025",
    areas,
  };
  const outPath = join(process.cwd(), "data", "dld-area-stats.json");
  writeFileSync(outPath, JSON.stringify(out, null, 0));
  console.log(`[dld] wrote ${kept} area rows (>= ${MIN_DLD_SAMPLE} sales) → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
