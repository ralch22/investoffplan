import { getDevelopers, getProjectsByDeveloper } from "@/lib/catalog";
import type { DeveloperSummary } from "@/lib/types";
import { firstSegment } from "@/lib/community-slug";

/**
 * Developer-vs-developer comparisons (SEO-plan pillar). KPIs come from the
 * off-plan CATALOG ONLY — no DLD join: developer-name matching against DLD
 * projects is unsafe (see dld-data-layer notes), so sold-price aggregates
 * stay community-scoped and out of these pages.
 */

const TOP_DEVELOPERS = 20;
const MIN_PROJECTS = 3;
const SEP = "-vs-";

export interface DeveloperSide {
  slug: string;
  name: string;
  logoUrl?: string;
  projectCount: number;
  unitCount: number;
  fromPrice: number | null;
  avgPpsf: number | null;
  communities: string[];
  handoverYears: number[];
  premiumShare: number;
}

export interface DeveloperComparison {
  pairSlug: string;
  a: DeveloperSide;
  b: DeveloperSide;
}

async function comparableDevelopers(): Promise<DeveloperSummary[]> {
  const developers = await getDevelopers();
  return developers
    .filter((d) => d.projectCount >= MIN_PROJECTS)
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, TOP_DEVELOPERS);
}

function pairSlug(a: string, b: string): string {
  return [a, b].sort().join(SEP);
}

/** Static params — all unordered pairs of the top comparable developers. */
export async function getComparableDeveloperSlugs(): Promise<string[]> {
  const devs = await comparableDevelopers();
  const pairs: string[] = [];
  for (let i = 0; i < devs.length; i++) {
    for (let j = i + 1; j < devs.length; j++) {
      pairs.push(pairSlug(devs[i].slug, devs[j].slug));
    }
  }
  return pairs;
}

/**
 * Lightweight hub cards — only `limit` named pairs (no second getDevelopers
 * pass for name lookup on the compare hub).
 */
export async function getHubDeveloperPairs(
  limit = 6,
): Promise<{ pairSlug: string; a: string; b: string }[]> {
  const devs = await comparableDevelopers();
  const out: { pairSlug: string; a: string; b: string }[] = [];
  for (let i = 0; i < devs.length; i++) {
    for (let j = i + 1; j < devs.length; j++) {
      const [x, y] = [devs[i], devs[j]].sort((p, q) => p.slug.localeCompare(q.slug));
      out.push({ pairSlug: pairSlug(x.slug, y.slug), a: x.name, b: y.name });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

async function toSide(dev: DeveloperSummary): Promise<DeveloperSide> {
  const projects = await getProjectsByDeveloper(dev.slug);
  const prices: number[] = [];
  const ppsf: number[] = [];
  const communities = new Map<string, number>();
  const years = new Set<number>();
  let premium = 0;

  for (const p of projects) {
    if (p.isPremium) premium += 1;
    const c = firstSegment(p.area);
    communities.set(c, (communities.get(c) ?? 0) + 1);
    const yearMatch = p.handover?.match(/(\d{4})/);
    if (yearMatch) years.add(Number(yearMatch[1]));
    for (const u of p.units) {
      if (u.launchPriceAed > 0) prices.push(u.launchPriceAed);
      if (u.launchPriceAed > 0 && u.sqftMin > 0) ppsf.push(u.launchPriceAed / u.sqftMin);
    }
  }

  return {
    slug: dev.slug,
    name: dev.name,
    logoUrl: dev.logoUrl,
    projectCount: projects.length,
    unitCount: projects.reduce((n, p) => n + p.units.length, 0),
    fromPrice: prices.length ? Math.min(...prices) : null,
    avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, b) => a + b, 0) / ppsf.length) : null,
    communities: [...communities.entries()]
      .sort((x, y) => y[1] - x[1])
      .map(([name]) => name),
    handoverYears: [...years].sort((a, b) => a - b),
    premiumShare: projects.length ? premium / projects.length : 0,
  };
}

export async function buildDeveloperComparison(
  slug: string,
): Promise<DeveloperComparison | null> {
  const idx = slug.indexOf(SEP);
  if (idx < 0) return null;
  const slugA = slug.slice(0, idx);
  const slugB = slug.slice(idx + SEP.length);
  if (!slugA || !slugB || slugA === slugB) return null;

  const developers = await getDevelopers();
  const devA = developers.find((d) => d.slug === slugA);
  const devB = developers.find((d) => d.slug === slugB);
  if (!devA || !devB) return null;
  if (devA.projectCount < MIN_PROJECTS || devB.projectCount < MIN_PROJECTS) return null;

  const [a, b] = await Promise.all([toSide(devA), toSide(devB)]);
  return { pairSlug: pairSlug(slugA, slugB), a, b };
}

/** Data-driven FAQs for the developer pair (rendered + FAQPage JSON-LD). */
export function buildDeveloperFaqs(cmp: DeveloperComparison): Array<{ q: string; a: string }> {
  const { a, b } = cmp;
  const faqs: Array<{ q: string; a: string }> = [];
  const big = a.projectCount >= b.projectCount ? a : b;
  const small = big === a ? b : a;
  faqs.push({
    q: `Who has more off-plan projects, ${a.name} or ${b.name}?`,
    a: `${big.name} — ${big.projectCount} live off-plan projects with ${big.unitCount.toLocaleString()} unit options on this portal, vs ${small.projectCount} projects from ${small.name}.`,
  });
  if (a.fromPrice != null && b.fromPrice != null) {
    const cheap = a.fromPrice <= b.fromPrice ? a : b;
    const dear = cheap === a ? b : a;
    faqs.push({
      q: `Which developer has the lower entry price?`,
      a: `${cheap.name} — launches from AED ${Math.round(cheap.fromPrice!).toLocaleString()}, vs AED ${Math.round(dear.fromPrice!).toLocaleString()} for ${dear.name}.`,
    });
  }
  const wide = a.communities.length >= b.communities.length ? a : b;
  const narrow = wide === a ? b : a;
  faqs.push({
    q: `Which developer covers more communities?`,
    a: `${wide.name} builds across ${wide.communities.length} communities (led by ${wide.communities.slice(0, 3).join(", ")}), vs ${narrow.communities.length} for ${narrow.name}.`,
  });
  return faqs;
}
