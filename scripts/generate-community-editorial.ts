#!/usr/bin/env npx tsx
/**
 * Grounded community-editorial generator (SEO-plan pillar 4, part B).
 * Writes data/community-editorial-generated.json — lifestyle/transport/schools/
 * who-it-suits editorial for the long-tail communities that lack a hand-crafted
 * entry in src/content/areas.ts. Uses the local `claude` CLI (-p, Max plan).
 *
 *   npx tsx scripts/generate-community-editorial.ts            # all missing (resumable)
 *   npx tsx scripts/generate-community-editorial.ts --limit 5
 *   npx tsx scripts/generate-community-editorial.ts --slug al-furjan
 *
 * VERIFIED-CLAIMS GUARDRAIL: the model may use ONLY the FACTS block (all from
 * real catalog + DLD data) plus broadly-known, stable geography. It is told not
 * to invent school/hospital/mall/metro names, developer names, or exact
 * commute times — and to return an empty array for any section it can't ground.
 * nearbyAreas is set deterministically from project coordinates, never by the model.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AREA_EDITORIALS, type AreaEditorial } from "../src/content/areas";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const DLD = join(process.cwd(), "data", "dld-area-stats.json");
const DLD_SRC = join(process.cwd(), "src", "lib", "dld.ts");
const OUT = join(process.cwd(), "data", "community-editorial-generated.json");
const MODEL = process.env.EDITORIAL_MODEL || "claude-haiku-4-5-20251001";

interface Unit { beds: number; sqftMin?: number; launchPriceAed?: number; propertyType?: string }
interface Project {
  slug: string; name: string; developer: string; city: string; area: string;
  handover?: string; coordinates?: { lat: number; lng: number }; units?: Unit[];
}

const CITY_LABEL: Record<string, string> = {
  Dubai: "Dubai", "Abu Dhabi": "Abu Dhabi", Sharjah: "Sharjah",
  "Ras Al Khaimah": "Ras Al Khaimah", Ajman: "Ajman",
  "Umm Al Quwain": "Umm Al Quwain", Fujairah: "Fujairah",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function firstSegment(area: string): string {
  return (area.split(",")[0] ?? area).trim();
}

// Rebuild the areaKey alias crosswalk from dld.ts so DLD stats match communities.
function loadAliases(): Record<string, string> {
  const src = readFileSync(DLD_SRC, "utf8");
  const m = src.match(/AREA_ALIASES[^=]*=\s*\{([\s\S]*?)\n\}/);
  const out: Record<string, string> = {};
  if (m) for (const mm of m[1].matchAll(/["']([^"']+)["']\s*:\s*["']([^"']+)["']/g)) out[mm[1]] = mm[2];
  return out;
}

interface Community {
  slug: string; name: string; city: string; cityLabel: string;
  projects: Project[]; lat: number; lng: number;
}

function haversine(a: Community, b: Community): number {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return dLat * dLat + dLng * dLng; // euclidean-on-degrees is fine for "nearest"
}

function factsFor(c: Community, aliases: Record<string, string>, dld: any, nearby: string[]): string {
  const units = c.projects.flatMap((p) => p.units ?? []);
  const prices = units.map((u) => u.launchPriceAed ?? 0).filter((v) => v > 0);
  const types = new Map<string, number>();
  for (const u of units) if (u.propertyType) types.set(u.propertyType, (types.get(u.propertyType) ?? 0) + 1);
  const typeMix = [...types.entries()].sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t} (${Math.round((n / units.length) * 100)}%)`).slice(0, 4);
  const devs = new Map<string, number>();
  for (const p of c.projects) devs.set(p.developer, (devs.get(p.developer) ?? 0) + 1);
  const topDevs = [...devs.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d).slice(0, 5);
  const years = [...new Set(c.projects.map((p) => p.handover?.match(/(\d{4})/)?.[1]).filter(Boolean))].sort();
  const key = (() => { const k = firstSegment(c.name).toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim(); return aliases[k] ?? k; })();
  const s = dld.areas[key];
  return [
    `Community: ${c.name}`,
    `Emirate/City: ${c.cityLabel}`,
    `Live off-plan projects on our portal: ${c.projects.length}`,
    `Total unit options: ${units.length}`,
    prices.length ? `Launch prices range from AED ${Math.min(...prices).toLocaleString("en-US")} to AED ${Math.max(...prices).toLocaleString("en-US")}` : "",
    typeMix.length ? `Property mix: ${typeMix.join(", ")}` : "",
    topDevs.length ? `Active developers here: ${topDevs.join(", ")}` : "",
    years.length ? `Handover years: ${years.join(", ")}` : "",
    s ? `DLD 2025 data — median sold price AED ${s.medianPrice ? Math.round(s.medianPrice).toLocaleString("en-US") : "n/a"}, median AED/sqft ${s.medianPpsqft ?? "n/a"}, gross rental yield ${s.grossYieldPct ?? "n/a"}%, ${s.saleSample} recorded sales` : "No DLD sold-price coverage for this community.",
    nearby.length ? `Geographically nearest communities (for context only): ${nearby.join(", ")}` : "",
  ].filter(Boolean).join("\n");
}

function buildPrompt(c: Community, facts: string): string {
  return `You are the content editor for invest off-plan, a UAE off-plan property intelligence platform. Voice: expert, factual, investor- and resident-focused, UK English, no hype ("luxurious lifestyle awaits" is banned).

Write original editorial for the community "${firstSegment(c.name)}" in ${c.cityLabel}, as STRICT JSON with this exact shape:
{"intro":["para","para"],"lifestyle":["para"],"transport":["para"],"schools":["para"],"whoItSuits":["para"],"faq":[{"q":"","a":""}]}

HARD RULES:
- Use ONLY the FACTS below plus broadly-known, STABLE geography of this community (its general location within ${c.cityLabel} and road orientation).
- Do NOT invent: specific school names, hospital/clinic names, mall or retail names, metro/tram station names, developer names not in FACTS, exact distances, exact commute minutes, or any price/number not in FACTS.
- Where you lack a specific fact, speak generally ("schooling is served by the wider district", "road links toward central ${c.cityLabel}") — or return an EMPTY ARRAY for that section. An empty section is far better than a guessed one.
- intro: 2 paragraphs, always present, grounded in the FACTS (inventory, price range, property mix, developers, handover, DLD data if present).
- lifestyle/transport/schools/whoItSuits: 1 paragraph each, or [] if you cannot ground it.
- faq: 2-3 Q&A grounded in FACTS. [] if none.
- Each paragraph 40-90 words. Output ONLY the JSON, no preamble, no code fences.

FACTS:
${facts}`;
}

function extractJson(raw: string): any | null {
  const cleaned = raw.replace(/```(json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

const BANNED = /luxurious lifestyle awaits|property\s*finder|bayut/i;

function numbersGrounded(obj: any, facts: string): boolean {
  const text = JSON.stringify(obj);
  const ctx = facts.replace(/,/g, "");
  const nums = (text.match(/\d[\d,]{3,}/g) ?? []).map((n) => n.replace(/,/g, ""));
  return nums.every((n) => ctx.includes(n));
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
}

function generateOne(c: Community, facts: string, nearby: string[]): AreaEditorial | null {
  const prompt = buildPrompt(c, facts);
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = execFileSync("claude", ["-p", prompt, "--model", MODEL], {
        encoding: "utf8", timeout: 180_000, maxBuffer: 4 * 1024 * 1024,
      });
    } catch (err) {
      console.warn(`[editorial] ${c.slug} CLI error: ${(err as Error).message.slice(0, 100)}`);
      continue;
    }
    const obj = extractJson(raw);
    if (!obj || !Array.isArray(obj.intro) || strArr(obj.intro).length === 0) {
      console.warn(`[editorial] ${c.slug} attempt ${attempt + 1}: bad/empty intro — retry`);
      continue;
    }
    const editorial: AreaEditorial = {
      slug: c.slug,
      name: firstSegment(c.name),
      intro: strArr(obj.intro),
      lifestyle: strArr(obj.lifestyle),
      transport: strArr(obj.transport),
      schools: strArr(obj.schools),
      nearbyAreas: nearby, // deterministic, never model-authored
      whoItSuits: strArr(obj.whoItSuits),
      faq: Array.isArray(obj.faq)
        ? obj.faq.filter((f: any) => f && typeof f.q === "string" && typeof f.a === "string").slice(0, 3)
        : [],
    };
    if (BANNED.test(JSON.stringify(editorial))) continue;
    if (!numbersGrounded(editorial, facts)) {
      console.warn(`[editorial] ${c.slug} attempt ${attempt + 1}: ungrounded number — retry`);
      continue;
    }
    return editorial;
  }
  return null;
}

function main() {
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : null;
  const slugIdx = process.argv.indexOf("--slug");
  const onlySlug = slugIdx >= 0 ? process.argv[slugIdx + 1] : null;

  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as { projects: Project[] };
  const dld = JSON.parse(readFileSync(DLD, "utf8"));
  const aliases = loadAliases();

  // Group projects into communities by first-segment slug.
  const map = new Map<string, Community>();
  for (const p of catalog.projects) {
    const name = firstSegment(p.area);
    const slug = slugify(name);
    let c = map.get(slug);
    if (!c) { c = { slug, name, city: p.city, cityLabel: CITY_LABEL[p.city] ?? p.city, projects: [], lat: 0, lng: 0 }; map.set(slug, c); }
    c.projects.push(p);
  }
  const communities = [...map.values()];
  // Centroids.
  for (const c of communities) {
    const pts = c.projects.map((p) => p.coordinates).filter((x): x is { lat: number; lng: number } => !!x);
    if (pts.length) { c.lat = pts.reduce((a, b) => a + b.lat, 0) / pts.length; c.lng = pts.reduce((a, b) => a + b.lng, 0) / pts.length; }
  }

  const handcrafted = new Set(AREA_EDITORIALS.map((e) => e.slug));
  const existing: AreaEditorial[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
  const doneSlugs = new Set([...handcrafted, ...existing.map((e) => e.slug)]);

  let targets = communities.filter((c) => !doneSlugs.has(c.slug));
  if (onlySlug) targets = communities.filter((c) => c.slug === onlySlug);
  // Bigger communities first (more traffic, better-known → safer grounding).
  targets.sort((a, b) => b.projects.length - a.projects.length);
  if (limit) targets = targets.slice(0, limit);

  console.log(`[editorial] ${targets.length} communities to generate (model ${MODEL}); ${doneSlugs.size} already covered`);

  const out = [...existing];
  let ok = 0, skipped = 0;
  for (const [i, c] of targets.entries()) {
    const nearby = communities
      .filter((o) => o.slug !== c.slug && o.lat !== 0 && o.city === c.city)
      .sort((x, y) => haversine(c, x) - haversine(c, y))
      .slice(0, 4)
      .map((o) => o.name);
    const facts = factsFor(c, aliases, dld, nearby);
    process.stdout.write(`  • ${c.slug} (${c.projects.length} proj) … `);
    const result = generateOne(c, facts, nearby);
    if (result) { out.push(result); ok++; console.log("ok"); } else { skipped++; console.log("skipped"); }
    if ((i + 1) % 3 === 0 || i === targets.length - 1) {
      writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
      console.log(`[editorial] ${i + 1}/${targets.length} — ok=${ok} skipped=${skipped}`);
    }
  }
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`[editorial] Done. ok=${ok} skipped=${skipped}`);
}

main();
