import { getCatalogApi } from "@/lib/catalog";
import { getCommunities, communitySlugFor, type CommunitySummary } from "@/lib/communities";
import { getAreaStats } from "@/lib/dld-area-stats";

/**
 * Topical "location guide" pillar (SEO plan): community-ranking roundups
 * computed entirely from real DLD aggregates + the off-plan catalog — no
 * copywriting, no fabricated lifestyle claims. Each guide ranks communities on
 * one decision axis and links into their /communities pages, forming the
 * internal-linking backbone the plan calls for.
 */

export interface CommunityMetrics {
  slug: string;
  name: string;
  cityLabel: string;
  projectCount: number;
  unitCount: number;
  minPriceAed: number;
  /** Share of units that are villas/townhouses/penthouses, 0..1. */
  familyShare: number;
  grossYieldPct: number | null;
  medianPpsqft: number | null;
  medianPrice: number | null;
  saleSample: number;
  dldCovered: boolean;
}

const FAMILY_TYPES = new Set(["villa", "townhouse", "penthouse", "duplex"]);

let cache: CommunityMetrics[] | null = null;

/** One catalog pass → per-community metrics, merged with DLD stats. */
export async function getCommunityMetrics(): Promise<CommunityMetrics[]> {
  if (cache) return cache;
  const [communities, api] = await Promise.all([getCommunities(), getCatalogApi()]);

  const family = new Map<string, number>();
  const total = new Map<string, number>();
  for (const p of api.projects) {
    const slug = communitySlugFor(p.area);
    for (const u of p.units) {
      total.set(slug, (total.get(slug) ?? 0) + 1);
      if (FAMILY_TYPES.has(u.propertyType)) family.set(slug, (family.get(slug) ?? 0) + 1);
    }
  }

  cache = communities.map((c: CommunitySummary) => {
    const stats = getAreaStats(c.name);
    const tot = total.get(c.slug) ?? 0;
    return {
      slug: c.slug,
      name: c.name,
      cityLabel: c.cityLabel,
      projectCount: c.projectCount,
      unitCount: c.unitCount,
      minPriceAed: c.minPriceAed,
      familyShare: tot > 0 ? (family.get(c.slug) ?? 0) / tot : 0,
      grossYieldPct: stats?.grossYieldPct ?? null,
      medianPpsqft: stats?.medianPpsqft ?? null,
      medianPrice: stats?.medianPrice ?? null,
      saleSample: stats?.saleSample ?? 0,
      dldCovered: stats != null,
    };
  });
  return cache;
}

export interface RankedCommunity {
  metrics: CommunityMetrics;
  /** Pre-formatted headline metric for this guide (e.g. "6.9%"). */
  valueLabel: string;
  /** One-line, data-only rationale. */
  rationale: string;
}

export interface LocationGuide {
  slug: string;
  /** Nav/card label. */
  label: string;
  title: string;
  h1: string;
  intro: string;
  metricLabel: string;
  methodology: string;
  rank: (all: CommunityMetrics[]) => RankedCommunity[];
}

const MIN_PROJECTS = 3;
const MIN_SALES = 40;

const money = (n: number) =>
  `AED ${Math.round(n).toLocaleString("en-US")}`;

export const LOCATION_GUIDES: LocationGuide[] = [
  {
    slug: "best-communities-for-families",
    label: "Best for families",
    title: "Best Communities for Families in Dubai (Off-Plan)",
    h1: "Best communities for families",
    intro:
      "Family buyers want space, not just a balcony. These Dubai communities have the highest share of villas, townhouses and larger homes across their live off-plan launches — ranked from our catalog, so the list reflects what you can actually buy today.",
    metricLabel: "Family-home stock",
    methodology:
      "Ranked by the share of a community's off-plan unit options that are villas, townhouses, penthouses or duplexes, among communities with at least 3 live projects.",
    rank: (all) =>
      all
        // Title promises Dubai — don't rank Abu Dhabi/Sharjah communities here.
        .filter((c) => c.cityLabel === "Dubai" && c.projectCount >= MIN_PROJECTS && c.familyShare > 0)
        .sort((a, b) => b.familyShare - a.familyShare)
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: `${Math.round(c.familyShare * 100)}%`,
          rationale: `${Math.round(c.familyShare * 100)}% of ${c.unitCount.toLocaleString()} unit options are villas or townhouses · ${c.projectCount} live projects`,
        })),
  },
  {
    slug: "highest-rental-yield-communities",
    label: "Highest yields",
    title: "Highest Rental-Yield Communities in Dubai (2025 DLD Data)",
    h1: "Highest rental-yield communities",
    intro:
      "Gross rental yield is the clearest income signal for an investor. These communities post the strongest yields on real Dubai Land Department 2025 transactions — median annual rent divided by median sold price, not asking prices.",
    metricLabel: "Gross yield",
    methodology:
      "Ranked by gross rental yield (median annual rent ÷ median sold price) from Dubai Land Department 2025 data, among communities with at least 40 recorded sales.",
    rank: (all) =>
      all
        .filter((c) => c.grossYieldPct != null && c.saleSample >= MIN_SALES)
        .sort((a, b) => (b.grossYieldPct ?? 0) - (a.grossYieldPct ?? 0))
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: `${c.grossYieldPct}%`,
          rationale: `${c.grossYieldPct}% gross yield · median sold ${c.medianPrice ? money(c.medianPrice) : "—"} · ${c.saleSample.toLocaleString()} sales in 2025`,
        })),
  },
  {
    slug: "most-affordable-communities",
    label: "Most affordable",
    title: "Most Affordable Communities to Buy Off-Plan in Dubai",
    h1: "Most affordable communities to buy off-plan",
    intro:
      "Entry price is where most plans start. These communities have the lowest off-plan launch prices in our catalog — a practical shortlist if you're buying your first unit or keeping the ticket under budget.",
    metricLabel: "Launch price from",
    methodology:
      "Ranked by the lowest off-plan launch price in each community, among communities with at least 3 live projects.",
    rank: (all) =>
      all
        // Title promises Dubai — don't rank Abu Dhabi/Sharjah communities here.
        .filter((c) => c.cityLabel === "Dubai" && c.projectCount >= MIN_PROJECTS && c.minPriceAed > 0)
        .sort((a, b) => a.minPriceAed - b.minPriceAed)
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: money(c.minPriceAed),
          rationale: `Launches from ${money(c.minPriceAed)} · ${c.projectCount} projects · ${c.unitCount.toLocaleString()} unit options`,
        })),
  },
  {
    slug: "best-value-communities",
    label: "Best value / sqft",
    title: "Best-Value Communities by Price Per Sqft (Dubai)",
    h1: "Best value on price per sqft",
    intro:
      "Two homes at the same price can offer very different space. These communities have the lowest median sold price per square foot on 2025 DLD data — where your dirham buys the most built area.",
    metricLabel: "Median sold AED/sqft",
    methodology:
      "Ranked by the lowest median sold price per sqft from Dubai Land Department 2025 data, among communities with at least 40 recorded sales.",
    rank: (all) =>
      all
        .filter((c) => c.medianPpsqft != null && c.saleSample >= MIN_SALES)
        .sort((a, b) => (a.medianPpsqft ?? 0) - (b.medianPpsqft ?? 0))
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: `AED ${c.medianPpsqft!.toLocaleString()}`,
          rationale: `AED ${c.medianPpsqft!.toLocaleString()}/sqft median sold · ${c.saleSample.toLocaleString()} sales in 2025`,
        })),
  },
  {
    slug: "most-liquid-communities",
    label: "Most liquid",
    title: "Most Liquid Communities for Resale in Dubai (2025)",
    h1: "Most liquid communities for resale",
    intro:
      "Liquidity is how easily you can exit at market price. These communities recorded the most sales in 2025 — the deepest resale markets in Dubai, where buyers are plentiful when you decide to sell.",
    metricLabel: "2025 sales",
    methodology:
      "Ranked by the number of recorded sales in Dubai Land Department 2025 data — a practical proxy for resale liquidity.",
    rank: (all) =>
      all
        .filter((c) => c.saleSample >= MIN_SALES)
        .sort((a, b) => b.saleSample - a.saleSample)
        .slice(0, 12)
        .map((c) => ({
          metrics: c,
          valueLabel: c.saleSample.toLocaleString(),
          rationale: `${c.saleSample.toLocaleString()} sales in 2025${c.grossYieldPct != null ? ` · ${c.grossYieldPct}% gross yield` : ""}`,
        })),
  },
];

export function getLocationGuide(slug: string): LocationGuide | undefined {
  return LOCATION_GUIDES.find((g) => g.slug === slug);
}

export async function buildGuideRanking(slug: string): Promise<{
  guide: LocationGuide;
  ranked: RankedCommunity[];
} | null> {
  const guide = getLocationGuide(slug);
  if (!guide) return null;
  const all = await getCommunityMetrics();
  const ranked = guide.rank(all);
  if (ranked.length === 0) return null;
  return { guide, ranked };
}
