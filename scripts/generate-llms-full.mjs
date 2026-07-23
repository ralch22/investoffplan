/**
 * Generate public/llms-full.txt — the machine-readable companion to /llms.txt.
 *
 * Why static: LLM crawlers fetch llms-full.txt TODAY, while Accept:text/markdown
 * negotiation has near-zero real traffic — so the high-value markdown play is a
 * build-time file, not runtime negotiation. Runs in `prebuild` (same slot as
 * sync-catalog-public.mjs), so the file regenerates on every build and cannot
 * drift from the catalog.
 *
 * Data honesty (mirrors the site's own publication rules — see llms.txt
 * "Data provenance" and src/lib/dld-area-stats.ts):
 * - MIN_SAMPLE = 8: any statistic with fewer transactions is withheld.
 * - MAX_PLAUSIBLE_YIELD_PCT = 12 (mirrors src/lib/dld-area-stats.ts and
 *   scripts/sync-catalog-public.mjs): implausible yields are withheld, never
 *   clamped — a clamped number is an invented number.
 * - Aggregates only; month-level dates; no buyer/owner data exists upstream.
 * - No URL is emitted unless derived from a catalog slug (project pages) or a
 *   known static route — per-area deep links are deliberately absent because
 *   their slug scheme isn't derivable here, and a guessed URL is a fabricated
 *   claim.
 * - Deterministic output: "as of" dates come from the INPUT files (catalog
 *   scrapedAt, DLD sourcePeriod), never from the clock — a rebuild with the
 *   same inputs yields byte-identical output.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SITE = "https://investoffplan.com";
const MIN_SAMPLE = 8;
const MAX_PLAUSIBLE_YIELD_PCT = 12;

const catalog = JSON.parse(readFileSync(resolve(ROOT, "data/catalog.json"), "utf8"));
const dld = JSON.parse(readFileSync(resolve(ROOT, "data/dld-area-stats.json"), "utf8"));

const fmtAed = (n) => `AED ${Math.round(n).toLocaleString("en-US")}`;
// The catalog's source tag repeats per-merge segments ("a+b+b+b"); dedupe for print.
const sourceLabel = [...new Set(String(catalog.source).split("+"))].join(" + ");
// Some DLD labels arrive ALL-CAPS ("JUMEIRAH VILLAGE CIRCLE"); title-case those
// only — mixed-case labels are already correct and are left untouched.
const caseLabel = (l) =>
  l === l.toUpperCase() ? l.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : l;
const bedLabel = (b) => (String(b) === "0" ? "Studio" : `${b}BR`);

// ── Section 1 · DLD market data by area ─────────────────────────────────────
const areas = Object.values(dld.areas)
  .filter((a) => (a.saleSample ?? 0) >= MIN_SAMPLE)
  .sort((x, y) => (y.saleSample ?? 0) - (x.saleSample ?? 0));

const areaLines = [];
for (const a of areas) {
  areaLines.push(`### ${caseLabel(a.areaLabel)}`);
  areaLines.push(
    `- Median sold price: ${fmtAed(a.medianPrice)} · median AED/sqft: ${a.medianPpsqft.toLocaleString("en-US")} (n=${a.saleSample.toLocaleString("en-US")} sales)`,
  );
  if (typeof a.appreciationPct === "number") {
    areaLines.push(`- Price appreciation: ${a.appreciationPct > 0 ? "+" : ""}${a.appreciationPct}% year over year`);
  }
  // Yield: min rent sample AND the plausibility cap. Withheld, never clamped.
  if (
    typeof a.grossYieldPct === "number" &&
    (a.rentSample ?? 0) >= MIN_SAMPLE &&
    a.grossYieldPct > 0 &&
    a.grossYieldPct <= MAX_PLAUSIBLE_YIELD_PCT
  ) {
    areaLines.push(
      `- Gross rental yield: ${a.grossYieldPct}% (median Ejari rent ${fmtAed(a.medianAnnualRent)}/yr, n=${a.rentSample})`,
    );
  }
  const beds = Object.entries(a.beds ?? {})
    .filter(([, s]) => (s.n ?? 0) >= MIN_SAMPLE)
    .map(([b, s]) => `${bedLabel(b)} ${fmtAed(s.medianPrice)} (n=${s.n})`);
  if (beds.length) areaLines.push(`- Median by bedrooms: ${beds.join(" · ")}`);
  const trend = (a.monthlyTrend ?? []).filter((m) => (m.n ?? 0) >= MIN_SAMPLE);
  if (trend.length >= 2) {
    const first = trend[0];
    const last = trend[trend.length - 1];
    areaLines.push(
      `- AED/sqft trend: ${first.medianPpsqft.toLocaleString("en-US")} (${first.month}) → ${last.medianPpsqft.toLocaleString("en-US")} (${last.month})`,
    );
  }
  areaLines.push("");
}

// ── Section 2 · Off-plan catalog by community ───────────────────────────────
// Community = first segment of the PropertyFinder location ancestry ("Jumeirah
// Village Circle, District 13, 105 Residences" → "Jumeirah Village Circle").
const byCommunity = new Map();
for (const p of catalog.projects) {
  const community = (p.area ?? "").split(",")[0].trim() || "Other";
  const key = `${p.city ?? "UAE"} · ${community}`;
  if (!byCommunity.has(key)) byCommunity.set(key, []);
  byCommunity.get(key).push(p);
}

const projectLine = (p) => {
  const parts = [];
  const prices = (p.units ?? []).map((u) => u.launchPriceAed).filter((n) => n > 0);
  if (prices.length) parts.push(`from ${fmtAed(Math.min(...prices))}`);
  if (p.handover) parts.push(`handover ${p.handover}`);
  const beds = [...new Set((p.units ?? []).map((u) => u.beds).filter((b) => b != null))].sort((a, b) => a - b);
  if (beds.length) parts.push(beds.map(bedLabel).join("/"));
  if (p.paymentPlan) parts.push(`plan ${p.paymentPlan}`);
  return `- ${p.name} — ${p.developer}${parts.length ? " · " + parts.join(" · ") : ""} · ${SITE}/projects/${p.slug}`;
};

const communityLines = [];
for (const key of [...byCommunity.keys()].sort()) {
  const projects = byCommunity.get(key).sort((a, b) => a.name.localeCompare(b.name));
  communityLines.push(`### ${key} (${projects.length} project${projects.length === 1 ? "" : "s"})`);
  for (const p of projects) communityLines.push(projectLine(p));
  communityLines.push("");
}

// ── Assemble ────────────────────────────────────────────────────────────────
const developers = new Set(catalog.projects.map((p) => p.developer).filter(Boolean));
const out = `# invest off-plan — full data companion (llms-full.txt)

> Machine-readable companion to ${SITE}/llms.txt, for AI agents and LLM
> crawlers. Contains the full per-area Dubai market dataset (Dubai Land
> Department open data) and the complete off-plan project index with canonical
> URLs. Regenerated on every site build from the same data the site renders.

- Catalog: ${catalog.projects.length.toLocaleString("en-US")} off-plan projects · ${developers.size} developers (as of ${String(catalog.scrapedAt).slice(0, 10)}; source: ${sourceLabel})
- Market data: ${dld.source}, period ${dld.sourcePeriod}; ${areas.length} areas published
- Publication gates: minimum ${MIN_SAMPLE} transactions per published statistic; gross yields above ${MAX_PLAUSIBLE_YIELD_PCT}% are withheld as implausible, never clamped; aggregates only, no buyer/owner data.
- Site structure, brokerage credentials and contact: ${SITE}/llms.txt
- Interactive market pages: ${SITE}/sold-prices · ${SITE}/market-data

## Dubai residential market data by DLD area (${dld.sourcePeriod})

${areaLines.join("\n")}
## Off-plan project catalog by community

${communityLines.join("\n")}`;

writeFileSync(resolve(ROOT, "public/llms-full.txt"), out);

// ── Self-checks: refuse to publish a file that breaks its own stated rules ──
const fail = (msg) => {
  console.error(`[llms-full] FAIL: ${msg}`);
  process.exit(1);
};
if (areas.length < 50) fail(`only ${areas.length} areas cleared the sample gate — input looks wrong`);
if (catalog.projects.length < 1000) fail(`only ${catalog.projects.length} projects — input looks wrong`);
const yieldMatches = [...out.matchAll(/Gross rental yield: ([\d.]+)%/g)].map((m) => Number(m[1]));
if (yieldMatches.some((y) => y > MAX_PLAUSIBLE_YIELD_PCT)) fail("an implausible yield leaked through");
if (/\bNaN\b|undefined|null(?![a-z])/.test(out)) fail("NaN/undefined/null leaked into the output");
console.log(
  `[llms-full] wrote public/llms-full.txt — ${(out.length / 1024).toFixed(0)}KB, ${areas.length} areas, ${catalog.projects.length} projects, ${yieldMatches.length} yields published`,
);
