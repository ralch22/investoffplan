import {
  extractFacts,
  isFirecrawlConfigured,
  MAX_SCRAPES_PER_ENTITY,
  pickBrochureUrl,
  pickImages,
  pickVideoUrl,
  searchSources,
} from "./firecrawl";
import { sanitizeSummary, scrubFact } from "./enrichment-sanitize";
import type { Project } from "./types";

const PROSE_FACT_FIELDS = new Set([
  "overview",
  "lifestyle",
  "masterPlan",
  "location",
  "description",
  "bio",
  "summary",
  // Handled as dedicated top-level fields, never stored inside `facts`.
  "imageUrls",
  "brochureUrl",
  "videoUrl",
]);

const PER_ENTITY_BUDGET_MS = 40_000;

export interface ProjectEnrichment {
  slug: string;
  facts: Record<string, unknown>;
  summary: string | null;
  sources: string[];
  brochureUrl?: string;
  videoUrl?: string;
  /** Matterport / 360 / virtual-tour link discovered on official pages. */
  virtualTourUrl?: string;
  /** Extra gallery images discovered on official developer pages. */
  images?: string[];
  enrichedAt: string;
}

function projectFactSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      overview: { type: "string" },
      masterPlan: { type: "string" },
      amenities: { type: "array", items: { type: "string" } },
      handover: { type: "string" },
      location: { type: "string" },
      brochureUrl: { type: "string" },
      videoUrl: { type: "string" },
      imageUrls: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  };
}

function searchQuery(project: Project): string {
  return `${project.name} ${project.developer} ${project.area} UAE off-plan project brochure amenities handover`;
}

function extractPrompt(project: Project): string {
  return (
    `Extract only verifiable STRUCTURAL facts about the off-plan project "${project.name}" ` +
    `by ${project.developer} in ${project.area}. Include brochureUrl or videoUrl if found on official ` +
    `developer pages. Include imageUrls: absolute URLs of official render/gallery/exterior photos ` +
    `of the project (not logos, icons, or agent portraits). Do NOT include prices, contact details, ` +
    `agent names, or marketing copy.`
  );
}

function sanitizeFactsForStorage(
  facts: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(facts)) {
    if (PROSE_FACT_FIELDS.has(k)) continue;
    if (typeof v === "string") {
      const clean = scrubFact(v);
      if (clean) out[k] = clean;
    } else if (Array.isArray(v)) {
      const clean = v
        .map((x) => (typeof x === "string" ? scrubFact(x) : x))
        .filter((x) => x != null && x !== "");
      if (clean.length) out[k] = clean;
    } else if (v != null) {
      out[k] = v;
    }
  }
  return out;
}

function mergeFacts(
  extracted: Record<string, unknown>,
  grounding: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...extracted };
  for (const [k, gv] of Object.entries(grounding)) {
    const ev = out[k];
    if (Array.isArray(gv) && Array.isArray(ev)) {
      out[k] = Array.from(
        new Set(
          [...ev, ...gv].map((x) =>
            typeof x === "string" ? x : JSON.stringify(x),
          ),
        ),
      );
    } else {
      out[k] = gv;
    }
  }
  return out;
}

function synthesizeFromFacts(
  project: Project,
  merged: Record<string, unknown>,
): string | null {
  const parts: string[] = [];
  parts.push(
    `${project.name} is an off-plan development by ${project.developer} in ${project.area}.`,
  );

  const handover =
    (typeof merged.handover === "string" && merged.handover) ||
    project.handover;
  if (handover) parts.push(`Handover is scheduled for ${handover}.`);

  const amenities = Array.isArray(merged.amenities)
    ? merged.amenities.filter((a): a is string => typeof a === "string")
    : [];
  if (amenities.length > 0) {
    const list = amenities.slice(0, 6).join(", ");
    parts.push(`Key amenities include ${list}.`);
  }

  if (project.paymentPlan) {
    parts.push(`The payment plan is ${project.paymentPlan}.`);
  }

  return sanitizeSummary(parts.join(" "));
}

export async function enrichProject(
  project: Project,
): Promise<ProjectEnrichment | null> {
  const grounding: Record<string, unknown> = {
    developer: project.developer,
    area: project.area,
    handover: project.handover,
    paymentPlan: project.paymentPlan,
    status: project.status,
  };

  let extracted: Record<string, unknown> = {};
  let sources: string[] = [];
  let foundSources: Awaited<ReturnType<typeof searchSources>> = null;

  if (isFirecrawlConfigured()) {
    const deadline = Date.now() + PER_ENTITY_BUDGET_MS;
    foundSources = await searchSources(
      searchQuery(project),
      MAX_SCRAPES_PER_ENTITY,
    );
    if (foundSources?.length) {
      const urls = foundSources.map((s) => s.url);
      const res = await extractFacts(
        urls,
        projectFactSchema(),
        extractPrompt(project),
        { deadline },
      );
      sources = res.scraped;
      if (res.facts) extracted = res.facts;
    }
  } else {
    return null;
  }

  const merged = mergeFacts(extracted, grounding);
  const facts = sanitizeFactsForStorage(merged);
  const summary = synthesizeFromFacts(project, merged);
  const brochureUrl = pickBrochureUrl(foundSources ?? [], extracted);
  const videoUrl = pickVideoUrl(foundSources ?? [], extracted);
  const images = pickImages(extracted);

  const hasContent =
    summary ||
    Object.keys(facts).length > 0 ||
    brochureUrl ||
    videoUrl ||
    images.length > 0;
  if (!hasContent) return null;

  return {
    slug: project.slug,
    facts,
    summary,
    sources,
    brochureUrl,
    videoUrl,
    ...(images.length > 0 ? { images } : {}),
    enrichedAt: new Date().toISOString(),
  };
}