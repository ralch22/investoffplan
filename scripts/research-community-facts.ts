#!/usr/bin/env npx tsx
/**
 * Grounded community research (SEO-plan pillar 4, depth pass). For each
 * community, Firecrawl-searches real area-guide sources (Bayut guides,
 * developer community pages, etc. — PF/social are excluded by searchSources)
 * and extracts VERIFIABLE lifestyle facts (schools, transport, amenities,
 * healthcare, character) into data/community-research.json. That grounded fact
 * set then lets generate-community-editorial.ts write named specifics
 * (school/road/mall names) that come from a real page, not the model.
 *
 *   FIRECRAWL_API_KEY=... npx tsx scripts/research-community-facts.ts          # all missing (resumable)
 *   FIRECRAWL_API_KEY=... npx tsx scripts/research-community-facts.ts --limit 5
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  extractFacts,
  isFirecrawlConfigured,
  MAX_SCRAPES_PER_ENTITY,
  searchSources,
} from "../src/lib/firecrawl";
import { AREA_EDITORIALS } from "../src/content/areas";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const OUT = join(process.cwd(), "data", "community-research.json");
const PER_ENTITY_BUDGET_MS = 40_000;

interface Project { area: string; city: string }
interface Community { slug: string; name: string; cityLabel: string; count: number }

const CITY_LABEL: Record<string, string> = {
  Dubai: "Dubai", "Abu Dhabi": "Abu Dhabi", Sharjah: "Sharjah",
  "Ras Al Khaimah": "Ras Al Khaimah", Ajman: "Ajman",
  "Umm Al Quwain": "Umm Al Quwain", Fujairah: "Fujairah",
};

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const firstSegment = (a: string) => (a.split(",")[0] ?? a).trim();

function lifestyleSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      schools: { type: "array", items: { type: "string" } },
      transport: { type: "array", items: { type: "string" } },
      amenities: { type: "array", items: { type: "string" } },
      healthcare: { type: "array", items: { type: "string" } },
      lifestyle: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  };
}

function extractPrompt(c: Community): string {
  return (
    `Extract only VERIFIABLE facts stated on these pages about living in the ` +
    `"${c.name}" community in ${c.cityLabel}, UAE:\n` +
    `- schools: names of schools/nurseries in or serving the community\n` +
    `- transport: named roads, metro/tram stations, and commute references\n` +
    `- amenities: named malls, supermarkets, parks, beaches, mosques, leisure/retail\n` +
    `- healthcare: named clinics or hospitals in or near the community\n` +
    `- lifestyle: short factual statements about the community's character and who lives there\n` +
    `Only include items actually named on the pages. Do NOT invent names. Do NOT include prices, ` +
    `agent details, or marketing slogans. Return short strings.`
  );
}

interface Research { slug: string; facts: Record<string, string[]>; sources: string[] }

function toStrArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 1).slice(0, 12)
    : [];
}

async function researchOne(c: Community): Promise<Research | null> {
  const deadline = Date.now() + PER_ENTITY_BUDGET_MS;
  const query = `${c.name} ${c.cityLabel} community area guide schools transport amenities lifestyle`;
  const sources = await searchSources(query, MAX_SCRAPES_PER_ENTITY);
  if (!sources?.length) return null;
  const res = await extractFacts(sources.map((s) => s.url), lifestyleSchema(), extractPrompt(c), { deadline });
  if (!res.facts) return null;
  const facts: Record<string, string[]> = {};
  for (const k of ["schools", "transport", "amenities", "healthcare", "lifestyle"]) {
    const arr = toStrArray(res.facts[k]);
    if (arr.length) facts[k] = arr;
  }
  if (Object.keys(facts).length === 0) return null;
  return { slug: c.slug, facts, sources: res.scraped };
}

async function main() {
  if (!isFirecrawlConfigured()) {
    console.error("[research] No FIRECRAWL_API_KEY — aborting.");
    process.exit(1);
  }
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : null;
  const slugIdx = process.argv.indexOf("--slug");
  const onlySlug = slugIdx >= 0 ? process.argv[slugIdx + 1] : null;

  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as { projects: Project[] };
  const map = new Map<string, Community>();
  for (const p of catalog.projects) {
    const name = firstSegment(p.area);
    const slug = slugify(name);
    const c = map.get(slug);
    if (c) c.count++;
    else map.set(slug, { slug, name, cityLabel: CITY_LABEL[p.city] ?? p.city, count: 1 });
  }

  const handcrafted = new Set(AREA_EDITORIALS.map((e) => e.slug));
  const existing: Research[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
  const done = new Set(existing.map((e) => e.slug));

  let targets = [...map.values()].filter((c) => !handcrafted.has(c.slug) && !done.has(c.slug));
  if (onlySlug) targets = [...map.values()].filter((c) => c.slug === onlySlug);
  targets.sort((a, b) => b.count - a.count); // bigger communities first (better sources)
  if (limit) targets = targets.slice(0, limit);

  console.log(`[research] ${targets.length} communities to research; ${done.size} already done`);
  const out = [...existing];
  let ok = 0, skipped = 0;
  for (const [i, c] of targets.entries()) {
    process.stdout.write(`  • ${c.slug} … `);
    let r: Research | null = null;
    try { r = await researchOne(c); } catch (e) { console.warn((e as Error).message.slice(0, 80)); }
    if (r) { out.push(r); ok++; console.log(`ok (${Object.values(r.facts).flat().length} facts)`); }
    else { skipped++; console.log("no facts"); }
    if ((i + 1) % 3 === 0 || i === targets.length - 1) {
      writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
      console.log(`[research] ${i + 1}/${targets.length} — ok=${ok} skipped=${skipped}`);
    }
  }
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`[research] Done. ok=${ok} skipped=${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
