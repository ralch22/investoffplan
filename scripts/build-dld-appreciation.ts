/**
 * Offline ETL: DLD open-data CSVs → three anonymized build-time datasets:
 *
 *  1. data/dld-appreciation.json  — COHORT launch→resale appreciation per
 *     area (and per project, stored but not yet rendered). Cohort key =
 *     areaKey + normalized project + beds + 5-sqm size band; launch cohort =
 *     off-plan sales in the project's first 18 months of off-plan activity;
 *     resale cohort = ready sales in the same key ≥ 12 months after the
 *     cohort's median launch date. NOT a repeat-sales index — the honest
 *     label ships with every surface that renders it.
 *  2. data/dld-recent-sales.json  — per area, the 60 most recent anonymized
 *     transactions (month granularity only) for the /sold-prices pages.
 *  3. data/dld-monthly-volume.json — per-month transaction volume + off-plan
 *     share per area (Market Pulse: hottest community, off-plan momentum).
 *
 * Anonymization: month-level dates on published rows, no buyer/seller fields
 * ever read (PII tripwire in src/lib/dld.ts), aggregates gated by
 * MIN_DLD_SAMPLE. Run: tsx scripts/build-dld-appreciation.ts "<BIG DATA dir>"
 */
import { createReadStream, existsSync, readdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";
import {
  areaKey,
  confidenceFor,
  median,
  MIN_DLD_SAMPLE,
  parseCsvLine,
  mapSaleRow,
  type DldSale,
} from "../src/lib/dld";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error('Usage: tsx scripts/build-dld-appreciation.ts "<BIG DATA dir>"');
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

/** Normalized project identity for cohort joins (naming drift tolerance). */
function projectKey(name?: string | null): string | null {
  const k = (name ?? "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
  return k || null;
}

/** 5-sqm size band floor (e.g. 72.4 → 70). */
function sizeBand(sizeSqm: number): number {
  return Math.floor(sizeSqm / 5) * 5;
}

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

const SQM_TO_SQFT = 10.7639;

async function main() {
  const txFiles = monthlyFiles("TRANSACTIONS");
  console.log(`[dld-appreciation] ${txFiles.length} transaction files`);

  // cohortKey → { offplan: DldSale[], ready: DldSale[] }
  const cohorts = new Map<string, { area: string; project: string; offplan: DldSale[]; ready: DldSale[] }>();
  // areaKey → recent sales (kept bounded)
  const recentByArea = new Map<string, DldSale[]>();
  // areaKey → month → { n, offplan }
  const volume = new Map<string, Map<string, { n: number; offplan: number }>>();
  let total = 0;

  for (const f of txFiles) {
    await streamRows(f, (rec) => {
      const sale = mapSaleRow(rec);
      if (!sale) return;
      total++;
      const aKey = areaKey(sale.area);
      const pKey = projectKey(sale.project);

      // volume buckets
      const m = monthOf(sale.date);
      let areaVol = volume.get(aKey);
      if (!areaVol) volume.set(aKey, (areaVol = new Map()));
      const bucket = areaVol.get(m) ?? { n: 0, offplan: 0 };
      bucket.n++;
      if (sale.regType === "off-plan") bucket.offplan++;
      areaVol.set(m, bucket);

      // recent sales (cap at 400 per area pre-sort to bound memory)
      const arr = recentByArea.get(aKey);
      if (arr) {
        arr.push(sale);
        if (arr.length > 400) {
          arr.sort((x, y) => y.date.localeCompare(x.date));
          arr.length = 200;
        }
      } else {
        recentByArea.set(aKey, [sale]);
      }

      // appreciation cohorts need a project + beds + regType
      if (!pKey || sale.beds == null || !sale.regType) return;
      const cKey = `${aKey}|${pKey}|${sale.beds}|${sizeBand(sale.sizeSqm)}`;
      let c = cohorts.get(cKey);
      if (!c) cohorts.set(cKey, (c = { area: aKey, project: pKey, offplan: [], ready: [] }));
      (sale.regType === "off-plan" ? c.offplan : c.ready).push(sale);
    });
  }
  console.log(`[dld-appreciation] ${total.toLocaleString()} residential sales; ${cohorts.size.toLocaleString()} cohort keys`);

  // ---- cohort appreciation ---------------------------------------------
  // Pair rule: within a cohort key, launch = off-plan sales inside the first
  // 18 months of that key's off-plan activity; resale = ready sales dated
  // ≥ 12 months after the launch cohort's median month. A "matched pair" is
  // one cohort key satisfying both sides; appreciationPct = median resale
  // AED/sqft vs median launch AED/sqft for that key.
  type KeyResult = { area: string; project: string; launchPpsqft: number; resalePpsqft: number; nLaunch: number; nResale: number };
  const keyResults: KeyResult[] = [];

  for (const c of cohorts.values()) {
    if (c.offplan.length < 2 || c.ready.length < 2) continue;
    const launchMonths = c.offplan.map((s) => monthOf(s.date)).sort();
    const firstLaunch = launchMonths[0];
    const launchWindow = c.offplan.filter((s) => monthsBetween(firstLaunch, monthOf(s.date)) <= 18);
    if (launchWindow.length < 2) continue;
    const medianLaunchMonth = launchWindow.map((s) => monthOf(s.date)).sort()[Math.floor(launchWindow.length / 2)];
    const resales = c.ready.filter((s) => monthsBetween(medianLaunchMonth, monthOf(s.date)) >= 12);
    if (resales.length < 2) continue;

    const launchPpsqft = median(launchWindow.map((s) => s.amount / (s.sizeSqm * SQM_TO_SQFT)));
    const resalePpsqft = median(resales.map((s) => s.amount / (s.sizeSqm * SQM_TO_SQFT)));
    if (launchPpsqft == null || resalePpsqft == null || launchPpsqft <= 0) continue;
    keyResults.push({
      area: c.area,
      project: c.project,
      launchPpsqft,
      resalePpsqft,
      nLaunch: launchWindow.length,
      nResale: resales.length,
    });
  }
  console.log(`[dld-appreciation] ${keyResults.length} matched cohort keys`);

  function rollup(group: (r: KeyResult) => string) {
    const byGroup = new Map<string, KeyResult[]>();
    for (const r of keyResults) {
      const g = group(r);
      const arr = byGroup.get(g);
      if (arr) arr.push(r);
      else byGroup.set(g, [r]);
    }
    const out: Record<string, { appreciationPct: number; pairs: number; confidence: string }> = {};
    for (const [g, rows] of byGroup) {
      if (rows.length < MIN_DLD_SAMPLE) continue; // ≥8 matched keys per aggregate
      // volume-weighted mean of per-key appreciation
      let wSum = 0;
      let w = 0;
      for (const r of rows) {
        const pct = ((r.resalePpsqft - r.launchPpsqft) / r.launchPpsqft) * 100;
        const weight = Math.min(r.nLaunch, r.nResale);
        wSum += pct * weight;
        w += weight;
      }
      if (w === 0) continue;
      const pct = wSum / w;
      // plausibility clamp mirrors dld.ts trend cap (±300%)
      if (!Number.isFinite(pct) || Math.abs(pct) > 300) continue;
      out[g] = {
        appreciationPct: Math.round(pct * 10) / 10,
        pairs: rows.length,
        confidence: confidenceFor(rows.length),
      };
    }
    return out;
  }

  const communities = rollup((r) => r.area);
  const projects = rollup((r) => `${r.area}|${r.project}`);

  // ---- off-plan vs ready spread (single-year honest metric) --------------
  // With one year of data the launch→resale window can't close (needs
  // multi-year exports — roadmap item). What 2025 DOES support honestly:
  // the AED/sqft spread between off-plan and ready sales per area, both
  // cohorts sample-gated. Labeled as a market-pricing spread, NOT appreciation.
  const spreadByArea = new Map<string, { offplan: number[]; ready: number[] }>();
  for (const c of cohorts.values()) {
    let s = spreadByArea.get(c.area);
    if (!s) spreadByArea.set(c.area, (s = { offplan: [], ready: [] }));
    for (const x of c.offplan) s.offplan.push(x.amount / (x.sizeSqm * SQM_TO_SQFT));
    for (const x of c.ready) s.ready.push(x.amount / (x.sizeSqm * SQM_TO_SQFT));
  }
  const offplanVsReady: Record<
    string,
    { offplanPpsqft: number; readyPpsqft: number; spreadPct: number; nOffplan: number; nReady: number; confidence: string }
  > = {};
  for (const [aKeyName, s] of spreadByArea) {
    if (s.offplan.length < MIN_DLD_SAMPLE || s.ready.length < MIN_DLD_SAMPLE) continue;
    const op = median(s.offplan);
    const rd = median(s.ready);
    if (op == null || rd == null || rd <= 0) continue;
    const spreadPct = ((op - rd) / rd) * 100;
    if (!Number.isFinite(spreadPct) || Math.abs(spreadPct) > 300) continue;
    offplanVsReady[aKeyName] = {
      offplanPpsqft: Math.round(op),
      readyPpsqft: Math.round(rd),
      spreadPct: Math.round(spreadPct * 10) / 10,
      nOffplan: s.offplan.length,
      nReady: s.ready.length,
      confidence: confidenceFor(Math.min(s.offplan.length, s.ready.length)),
    };
  }

  // assert the gate: no aggregate below MIN_DLD_SAMPLE
  for (const [g, v] of Object.entries(communities)) {
    if (v.pairs < MIN_DLD_SAMPLE) throw new Error(`gate violation (community ${g}: ${v.pairs})`);
  }
  for (const [g, v] of Object.entries(projects)) {
    if (v.pairs < MIN_DLD_SAMPLE) throw new Error(`gate violation (project ${g}: ${v.pairs})`);
  }

  const appreciationOut = {
    meta: {
      builtAt: new Date().toISOString().slice(0, 10),
      source: "Dubai Land Department open data (2025)",
      method:
        "Cohort estimate: same project + bedrooms + 5-sqm size band; off-plan sales in the project's first 18 months vs ready sales ≥12 months after the launch cohort's median month; volume-weighted median AED/sqft delta; minimum 8 matched cohort keys per published aggregate. Not a repeat-sales index.",
      caveats: [
        "cohorts are not identical units (floor/view mix shift)",
        "PROJECT_EN naming drift can split cohorts",
        "phased launches can raise the launch-cohort price",
        "only projects with observed resales are counted (survivorship)",
      ],
      minSample: MIN_DLD_SAMPLE,
    },
    communities,
    projects,
    offplanVsReady,
  };
  writeFileSync(join(process.cwd(), "data", "dld-appreciation.json"), JSON.stringify(appreciationOut, null, 0));
  console.log(
    `[dld-appreciation] wrote ${Object.keys(communities).length} community launch→resale aggregates (needs multi-year data), ${Object.keys(projects).length} project aggregates, ${Object.keys(offplanVsReady).length} off-plan-vs-ready spreads`,
  );

  // ---- recent sales (60/area, month granularity) -------------------------
  const recentOut: Record<
    string,
    Array<{ month: string; project: string | null; beds: number | null; sizeBandSqm: number; price: number; aedPerSqft: number; regType: string | null }>
  > = {};
  let recentAreas = 0;
  for (const [aKey, sales] of recentByArea) {
    if (sales.length < MIN_DLD_SAMPLE) continue;
    sales.sort((x, y) => y.date.localeCompare(x.date));
    recentOut[aKey] = sales.slice(0, 60).map((s) => ({
      month: monthOf(s.date),
      project: s.project ?? null,
      beds: s.beds ?? null,
      sizeBandSqm: sizeBand(s.sizeSqm),
      price: Math.round(s.amount),
      aedPerSqft: Math.round(s.amount / (s.sizeSqm * SQM_TO_SQFT)),
      regType: s.regType ?? null,
    }));
    recentAreas++;
  }
  writeFileSync(
    join(process.cwd(), "data", "dld-recent-sales.json"),
    JSON.stringify({ meta: { builtAt: appreciationOut.meta.builtAt, source: appreciationOut.meta.source, rowsPerArea: 60 }, areas: recentOut }, null, 0),
  );
  console.log(`[dld-appreciation] wrote recent-sales for ${recentAreas} areas (≥${MIN_DLD_SAMPLE} txns)`);

  // ---- monthly volume (Market Pulse) -------------------------------------
  const volumeOut: Record<string, Record<string, { n: number; offplan: number }>> = {};
  for (const [aKey, months] of volume) {
    volumeOut[aKey] = Object.fromEntries([...months.entries()].sort());
  }
  writeFileSync(
    join(process.cwd(), "data", "dld-monthly-volume.json"),
    JSON.stringify({ meta: { builtAt: appreciationOut.meta.builtAt, source: appreciationOut.meta.source }, areas: volumeOut }, null, 0),
  );
  console.log(`[dld-appreciation] wrote monthly volume for ${volume.size} areas`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
