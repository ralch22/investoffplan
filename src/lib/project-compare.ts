import { getCatalogApi, getProjectBySlug, slugify } from "@/lib/catalog";
import { getAreaStats } from "@/lib/dld-area-stats";
import type { Project } from "@/lib/types";

const TOP_AREAS = 12;
const PROJECTS_PER_AREA = 4;
const SEP = "-vs-";

/** Community key = first breadcrumb segment (project.area is "Community, District, Project"). */
function communitySlug(area: string): string {
  return slugify(area.split(",")[0]);
}

export interface ProjectSide {
  slug: string;
  name: string;
  developer: string;
  area: string;
  imageUrl?: string;
  handover?: string;
  paymentPlan: string;
  unitCount: number;
  fromPrice: number | null;
  ppsqft: number | null;
  bedsRange: string;
  goldenVisa: boolean;
  areaYield: number | null;
}

export interface ProjectComparison {
  pairSlug: string;
  a: ProjectSide;
  b: ProjectSide;
}

function rankProject(a: Project, b: Project): number {
  if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
  const ar = a.featuredRank ?? 999;
  const br = b.featuredRank ?? 999;
  if (ar !== br) return ar - br;
  return b.unitCount - a.unitCount;
}

function bedsRange(project: Project): string {
  const beds = project.units.map((u) => u.beds).filter((b) => Number.isFinite(b));
  if (beds.length === 0) return "—";
  const min = Math.min(...beds);
  const max = Math.max(...beds);
  const label = (n: number) => (n === 0 ? "Studio" : `${n} bed`);
  return min === max ? label(min) : `${label(min)}–${max} bed`;
}

function toSide(project: Project): ProjectSide {
  const prices = project.units.map((u) => u.launchPriceAed).filter((p) => p > 0);
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const first = project.units.find((u) => u.launchPriceAed > 0 && u.sqftMin > 0);
  const ppsqft = first ? Math.round(first.launchPriceAed / first.sqftMin) : null;
  return {
    slug: project.slug,
    name: project.name,
    developer: project.developer,
    area: project.area.split(",")[0],
    imageUrl: project.imageUrl,
    handover: project.handover,
    paymentPlan: project.paymentPlan,
    unitCount: project.unitCount,
    fromPrice,
    ppsqft,
    bedsRange: bedsRange(project),
    goldenVisa: project.units.some((u) => u.launchPriceAed >= 2_000_000),
    areaYield: getAreaStats(project.area)?.grossYieldPct ?? null,
  };
}

/** Group top projects per top communities (shared by slug list + hub cards). */
async function topProjectsByCommunity(): Promise<Project[][]> {
  const api = await getCatalogApi();
  const byArea = new Map<string, Project[]>();
  for (const p of api.projects) {
    const k = communitySlug(p.area);
    const arr = byArea.get(k);
    if (arr) arr.push(p);
    else byArea.set(k, [p]);
  }
  return [...byArea.values()]
    .sort((a, b) => b.length - a.length)
    .slice(0, TOP_AREAS)
    .map((projs) => [...projs].sort(rankProject).slice(0, PROJECTS_PER_AREA));
}

/** Intra-area pairs among the top projects of the top areas — meaningful head-to-heads. */
export async function getComparableProjectSlugs(): Promise<string[]> {
  const areas = await topProjectsByCommunity();
  const pairs = new Set<string>();
  for (const top of areas) {
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        pairs.add([top[i].slug, top[j].slug].sort().join(SEP));
      }
    }
  }
  return [...pairs];
}

/**
 * Lightweight hub cards — only `limit` named pairs, one catalog pass.
 * Avoids the compare hub loading full pair lists + a second catalog for names
 * (that path was CF 1102 / 503 on /compare under Worker CPU limits).
 */
export async function getHubProjectPairs(
  limit = 6,
): Promise<{ pairSlug: string; a: string; b: string }[]> {
  const areas = await topProjectsByCommunity();
  const out: { pairSlug: string; a: string; b: string }[] = [];
  for (const top of areas) {
    for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        const [x, y] = [top[i], top[j]].sort((p, q) => p.slug.localeCompare(q.slug));
        out.push({ pairSlug: `${x.slug}${SEP}${y.slug}`, a: x.name, b: y.name });
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

/** Other projects in the same area to offer as comparisons on a PDP. */
export async function getProjectComparisonLinks(
  project: Project,
  limit = 3,
): Promise<{ pairSlug: string; otherName: string }[]> {
  const api = await getCatalogApi();
  const areaKey = communitySlug(project.area);
  return api.projects
    .filter((p) => p.slug !== project.slug && communitySlug(p.area) === areaKey)
    .sort(rankProject)
    .slice(0, limit)
    .map((other) => ({
      pairSlug: [project.slug, other.slug].sort().join(SEP),
      otherName: other.name,
    }));
}

export async function buildProjectComparison(slug: string): Promise<ProjectComparison | null> {
  const idx = slug.indexOf(SEP);
  if (idx < 0) return null;
  const slugA = slug.slice(0, idx);
  const slugB = slug.slice(idx + SEP.length);
  if (!slugA || !slugB || slugA === slugB) return null;

  const [projA, projB] = await Promise.all([getProjectBySlug(slugA), getProjectBySlug(slugB)]);
  if (!projA || !projB) return null;

  return {
    pairSlug: [slugA, slugB].sort().join(SEP),
    a: toSide(projA),
    b: toSide(projB),
  };
}
