#!/usr/bin/env npx tsx
/**
 * Unique-content engine: rewrite verbatim PF project descriptions into
 * IOP-voice originals so PDPs stop duplicating Property Finder's canonical
 * content. Uses the local `claude` CLI (-p print mode, Max plan — no API key).
 *
 *   npx tsx scripts/rewrite-descriptions.ts --limit 100        # premium-first
 *   npx tsx scripts/rewrite-descriptions.ts --slug 105-residences
 *   npx tsx scripts/rewrite-descriptions.ts                    # full long tail (resumable)
 *
 * Guardrails: the model may only use facts present in the source description
 * + catalog row. Output is sanitized and numerically fact-checked — any number
 * in the rewrite that does not appear in the source context is rejected and
 * the project is retried once, then skipped (logged).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeProjectHtml, htmlToPlainText } from "../src/lib/sanitize-html";

const CATALOG = join(process.cwd(), "data", "catalog.json");
const MODEL = process.env.REWRITE_MODEL || "claude-haiku-4-5-20251001";

interface Project {
  slug: string;
  name: string;
  developer: string;
  city: string;
  area: string;
  handover?: string;
  paymentPlan?: string;
  isPremium?: boolean;
  featuredRank?: number;
  amenities?: string[];
  description?: string;
  descriptionUnique?: string;
  units?: Array<{ beds: number; sqftMin?: number; launchPriceAed?: number }>;
}

function parseArgs() {
  const limitIdx = process.argv.indexOf("--limit");
  const slugIdx = process.argv.indexOf("--slug");
  return {
    limit: limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : null,
    slug: slugIdx >= 0 ? process.argv[slugIdx + 1] : null,
    force: process.argv.includes("--force"),
  };
}

function factsFor(p: Project): string {
  const prices = (p.units ?? []).map((u) => u.launchPriceAed ?? 0).filter((v) => v > 0);
  const beds = [...new Set((p.units ?? []).map((u) => u.beds))].sort((a, b) => a - b);
  return [
    `Project: ${p.name}`,
    `Developer: ${p.developer}`,
    `Location: ${p.area}, ${p.city}`,
    p.handover ? `Handover: ${p.handover}` : "",
    p.paymentPlan ? `Payment plan: ${p.paymentPlan}` : "",
    beds.length ? `Bedrooms available: ${beds.join(", ")}` : "",
    prices.length ? `Launch prices from AED ${Math.min(...prices).toLocaleString("en-US")}` : "",
    p.amenities?.length ? `Amenities: ${p.amenities.slice(0, 20).join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildPrompt(p: Project, source: string): string {
  return `You are the content editor for invest off-plan, a UAE off-plan property intelligence platform (expert, factual, investor-focused, UK English, no hype words like "luxurious lifestyle awaits").

Rewrite the following project description as an ORIGINAL text. Hard rules:
- Use ONLY facts present in SOURCE or FACTS below. Do not invent numbers, distances, brand names, completion claims, or amenities.
- 150-250 words. Structure: an opening paragraph, then 1-2 <h3> sections (e.g. residences/amenities, location/investment angle) with a paragraph each. Allowed tags ONLY: <p>, <h3>, <strong>, <ul>, <li>.
- Never mention Property Finder or any portal. Never copy sentences verbatim from SOURCE.
- Output ONLY the HTML, no preamble, no code fences.

FACTS:
${factsFor(p)}

SOURCE:
${source.slice(0, 5000)}`;
}

/** Every standalone number >= 100 in the rewrite must exist in the context. */
function numbersGrounded(output: string, context: string): boolean {
  const nums = (htmlToPlainText(output).match(/\d[\d,]{2,}/g) ?? [])
    .map((n) => n.replace(/,/g, ""))
    .filter((n) => Number(n) >= 100);
  const ctx = context.replace(/,/g, "");
  return nums.every((n) => ctx.includes(n));
}

function rewriteOne(p: Project): string | null {
  const source = htmlToPlainText(p.description ?? "");
  if (source.length < 80) return null;
  const prompt = buildPrompt(p, source);
  const context = `${source} ${factsFor(p)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: string;
    try {
      raw = execFileSync("claude", ["-p", prompt, "--model", MODEL], {
        encoding: "utf8",
        timeout: 180_000,
        maxBuffer: 4 * 1024 * 1024,
      });
    } catch (err) {
      console.warn(`[rewrite] ${p.slug} CLI error: ${(err as Error).message.slice(0, 120)}`);
      continue;
    }
    const cleaned = sanitizeProjectHtml(raw.replace(/```(html)?/g, "").trim());
    const words = htmlToPlainText(cleaned).split(/\s+/).length;
    if (words < 100 || words > 350) {
      console.warn(`[rewrite] ${p.slug} attempt ${attempt + 1}: ${words} words — retry`);
      continue;
    }
    if (!numbersGrounded(cleaned, context)) {
      console.warn(`[rewrite] ${p.slug} attempt ${attempt + 1}: ungrounded number — retry`);
      continue;
    }
    if (/property\s*finder/i.test(cleaned)) continue;
    return cleaned;
  }
  return null;
}

async function main() {
  const { limit, slug, force } = parseArgs();
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8")) as { projects: Project[] };

  let targets = catalog.projects.filter(
    (p) => p.description && (force || !p.descriptionUnique),
  );
  if (slug) targets = targets.filter((p) => p.slug === slug);
  // Premium + featured first, then by unit count proxy (more units = more traffic).
  targets.sort(
    (a, b) =>
      Number(b.isPremium ?? false) - Number(a.isPremium ?? false) ||
      (a.featuredRank ?? 999) - (b.featuredRank ?? 999) ||
      (b.units?.length ?? 0) - (a.units?.length ?? 0),
  );
  if (limit) targets = targets.slice(0, limit);

  const done = catalog.projects.filter((p) => p.descriptionUnique).length;
  console.log(`[rewrite] ${targets.length} to rewrite (model ${MODEL}); ${done} already done`);

  let ok = 0;
  let skipped = 0;
  for (const [i, p] of targets.entries()) {
    const result = rewriteOne(p);
    if (result) {
      p.descriptionUnique = result;
      ok++;
    } else {
      skipped++;
    }
    if ((i + 1) % 5 === 0 || i === targets.length - 1) {
      writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
      console.log(`[rewrite] ${i + 1}/${targets.length} — ok=${ok} skipped=${skipped}`);
    }
  }
  writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`[rewrite] Done. ok=${ok} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
