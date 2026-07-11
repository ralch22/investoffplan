// Pure, client-safe suggest index built from a CatalogApi — no server imports.
// Powers smart-search entity matching + autocomplete (UI lands separately).
import type { CatalogApi } from "@/lib/catalog-core";
import { communitySlugFor, firstSegment } from "@/lib/community-slug";
import { slugify } from "@/lib/slugify";

export interface SuggestProject {
  name: string;
  slug: string;
  area: string;
  city: string;
  minPriceAed: number | null;
  /** normText(name) — precomputed for matching. */
  norm: string;
}

export interface SuggestCommunity {
  name: string;
  slug: string;
  city: string;
  projectCount: number;
  norm: string;
}

export interface SuggestDeveloper {
  name: string;
  slug: string;
  projectCount: number;
  norm: string;
}

export interface SuggestIndex {
  projects: SuggestProject[];
  communities: SuggestCommunity[];
  developers: SuggestDeveloper[];
}

/**
 * Matching normal form: lowercase, unicode-decomposed, combining marks
 * stripped (Latin diacritics + Arabic tashkeel/hamza carriers), whitespace
 * collapsed. "Éla" → "ela", "إعمار" → "اعمار".
 */
export function normText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u0655\u0670]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Build the suggest index from an already-loaded CatalogApi (pure). */
export function buildSuggestIndex(api: CatalogApi): SuggestIndex {
  const projects: SuggestProject[] = api.projects.map((p) => {
    const unitMin = p.units.length
      ? Math.min(...p.units.map((u) => u.launchPriceAed))
      : null;
    return {
      name: p.name,
      slug: p.slug,
      area: p.area,
      city: p.city,
      minPriceAed: p.minPriceAed ?? unitMin,
      norm: normText(p.name),
    };
  });

  // Community = slugified FIRST breadcrumb segment of project.area (same rule
  // as src/lib/communities.ts, via the pure community-slug helpers).
  const communityMap = new Map<string, SuggestCommunity>();
  for (const p of api.projects) {
    const slug = communitySlugFor(p.area);
    if (!slug) continue;
    const existing = communityMap.get(slug);
    if (existing) {
      existing.projectCount += 1;
      continue;
    }
    const name = firstSegment(p.area);
    communityMap.set(slug, {
      name,
      slug,
      city: p.city,
      projectCount: 1,
      norm: normText(name),
    });
  }

  const devCounts = new Map<string, number>();
  for (const p of api.projects) {
    const slug = slugify(p.developer);
    devCounts.set(slug, (devCounts.get(slug) ?? 0) + 1);
  }
  let developers: SuggestDeveloper[] = api.getDevList().map((d) => ({
    name: d.name,
    slug: d.slug,
    projectCount: d.numProjectsOnline ?? devCounts.get(d.slug) ?? 0,
    norm: normText(d.name),
  }));
  if (developers.length === 0) {
    // No devList on this catalog slice — derive from project developer names.
    const bySlug = new Map<string, SuggestDeveloper>();
    for (const p of api.projects) {
      const slug = slugify(p.developer);
      const existing = bySlug.get(slug);
      if (existing) existing.projectCount += 1;
      else
        bySlug.set(slug, {
          name: p.developer,
          slug,
          projectCount: 1,
          norm: normText(p.developer),
        });
    }
    developers = [...bySlug.values()];
  }

  return {
    projects,
    communities: [...communityMap.values()].sort(
      (a, b) => b.projectCount - a.projectCount,
    ),
    developers: developers.sort((a, b) => b.projectCount - a.projectCount),
  };
}
