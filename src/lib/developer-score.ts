import { parsePaymentPlan } from "./investment-metrics";
import { communitySlugFor } from "./community-slug";

/**
 * Data-derived Developer PROFILE — NOT a quality / delivery / reliability rating.
 *
 * HONESTY CONTRACT (hard project rule — verified claims only):
 *   invest off-plan holds NO construction-quality, delivery-timeliness, or
 *   financial-stability data on any developer. Everything in this module is
 *   computed strictly from data we own or license:
 *     • the developer's OWN off-plan catalog (project count, communities,
 *       payment-plan strings, unit launch prices & sizes), and
 *     • official 2025 Dubai Land Department (DLD) area medians for the
 *       communities they build in (anonymized aggregates only).
 *   The four sub-metrics describe the SIZE and market POSITIONING of a catalog.
 *   None of them measure build quality or whether a project is delivered on
 *   time. The UI must disclaim this explicitly. Do not add a sub-metric that
 *   implies quality/reliability without a real, verifiable data source.
 *
 * The module is PURE (no I/O, no server-only imports): the DLD lookup is
 * injected by the caller so this file stays unit-testable and safe to import
 * anywhere. The server wrapper lives in catalog.ts (getDeveloperProfile).
 */

// ---------------------------------------------------------------------------
// Composite weights — transparent, documented, and echoed in the methodology
// disclosure. A larger composite reflects a bigger, broader, more premium-
// positioned catalog — it is NOT "better/higher quality". Rami signs off on
// the weights and tier wording (see docs/developer-profile-methodology.md).
// ---------------------------------------------------------------------------
export const PROFILE_WEIGHTS = {
  portfolioScale: 0.35,
  geographicReach: 0.25,
  buyerTerms: 0.25,
  marketPositioning: 0.15,
} as const;

export type SubMetricKey = keyof typeof PROFILE_WEIGHTS;

export type ProfileTier = "established" | "growing" | "boutique";
export type MarketPositioning = "premium" | "mid-market" | "value";

/** Composite thresholds → descriptive size tier (not a ranking of quality). */
export const TIER_THRESHOLDS = { established: 45, growing: 25 } as const;

/** Positioning bands on the dev-median ÷ DLD-area-median ratio. */
export const POSITIONING_BANDS = { premium: 1.15, value: 0.85 } as const;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Median of a numeric list (null when empty). Pure. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Pure scalar scorers (0–100). Each is independently table-testable.
// ---------------------------------------------------------------------------

/**
 * Portfolio scale — project count log-scaled against the catalog's largest
 * developer. Log scaling stops one mega-developer (Emaar, ~222 projects) from
 * flattening everyone else to ~0.
 */
export function portfolioScaleScore(
  projectCount: number,
  maxProjectCount: number,
): number {
  if (projectCount <= 0 || maxProjectCount <= 0) return 0;
  const score = (100 * Math.log(1 + projectCount)) / Math.log(1 + maxProjectCount);
  return Math.round(clamp(score, 0, 100));
}

/**
 * Geographic reach — distinct communities the developer builds in, log-scaled
 * against the widest-reaching developer in the catalog.
 */
export function geographicReachScore(
  communityCount: number,
  maxCommunityCount: number,
): number {
  if (communityCount <= 0 || maxCommunityCount <= 0) return 0;
  const score = (100 * Math.log(1 + communityCount)) / Math.log(1 + maxCommunityCount);
  return Math.round(clamp(score, 0, 100));
}

/**
 * Buyer-friendly terms — share of the developer's projects that offer a
 * post-handover payment plan. A plan qualifies when parsePaymentPlan yields a
 * 4-segment plan whose segments total a valid 95–105% and whose post-handover
 * (after) segment is > 0.
 */
export function isPostHandoverPlan(plan: string | undefined | null): boolean {
  if (!plan) return false;
  const parsed = parsePaymentPlan(plan);
  if (!parsed) return false;
  const total =
    parsed.downPaymentPct +
    parsed.duringPct +
    parsed.handoverPct +
    parsed.afterPct;
  if (total < 95 || total > 105) return false;
  return parsed.afterPct > 0;
}

export function buyerTermsScore(
  postHandoverProjects: number,
  totalProjects: number,
): number {
  if (totalProjects <= 0) return 0;
  return Math.round(clamp((100 * postHandoverProjects) / totalProjects, 0, 100));
}

/**
 * Market positioning — the developer's median unit AED/sqft relative to the
 * DLD area medians for the communities they build in. This is a POSITIONING
 * signal on a premium↔value spectrum, NOT a better/worse axis. ratio 1 = priced
 * in line with the areas they build in; > 1 = premium; < 1 = value.
 */
export function positioningRatio(
  devMedianPpsqft: number | null,
  marketMedianPpsqft: number | null,
): number | null {
  if (!devMedianPpsqft || !marketMedianPpsqft) return null;
  return devMedianPpsqft / marketMedianPpsqft;
}

export function positioningBand(ratio: number): MarketPositioning {
  if (ratio >= POSITIONING_BANDS.premium) return "premium";
  if (ratio <= POSITIONING_BANDS.value) return "value";
  return "mid-market";
}

/**
 * Positioning as a bounded 0–100 index centred on 50 (= priced at the area
 * median). ±100% of the area median maps to the 0 and 100 rails. Only used to
 * fold positioning into the composite; the UI shows the band label, not this.
 */
export function positioningScore(ratio: number): number {
  return Math.round(clamp(50 + (ratio - 1) * 100, 0, 100));
}

/**
 * Weighted-average composite over whatever sub-metrics are available. When
 * market positioning has no DLD coverage it is DROPPED and the remaining
 * weights are renormalized — we never fabricate a positioning value.
 */
export function compositeScore(
  scores: Partial<Record<SubMetricKey, number>>,
): number {
  let weighted = 0;
  let weight = 0;
  for (const key of Object.keys(PROFILE_WEIGHTS) as SubMetricKey[]) {
    const value = scores[key];
    if (value == null) continue;
    weighted += value * PROFILE_WEIGHTS[key];
    weight += PROFILE_WEIGHTS[key];
  }
  if (weight === 0) return 0;
  return Math.round(weighted / weight);
}

export function profileTier(composite: number): ProfileTier {
  if (composite >= TIER_THRESHOLDS.established) return "established";
  if (composite >= TIER_THRESHOLDS.growing) return "growing";
  return "boutique";
}

// ---------------------------------------------------------------------------
// Orchestrator — derives the raw inputs from a developer's projects and builds
// the full profile. The DLD median lookup is injected (pure).
// ---------------------------------------------------------------------------

export interface ProfileProject {
  area: string;
  paymentPlan?: string;
  units: Array<{ launchPriceAed: number; sqftMin: number }>;
}

export interface ComputeProfileInput {
  projects: ProfileProject[];
  /** Catalog-wide maxima, used to normalize the scale & reach sub-metrics. */
  maxProjectCount: number;
  maxCommunityCount: number;
  /**
   * Resolve the DLD 2025 median AED/sqft for a catalog area (or null when the
   * area has no DLD coverage). Injected so this module imports no data files.
   */
  areaMedianPpsqft: (area: string) => number | null;
}

export interface SubMetric {
  key: SubMetricKey;
  score: number;
}

export interface DeveloperProfile {
  composite: number;
  tier: ProfileTier;
  subMetrics: {
    portfolioScale: { score: number; projectCount: number };
    geographicReach: { score: number; communityCount: number };
    buyerTerms: {
      score: number;
      postHandoverProjects: number;
      totalProjects: number;
    };
    /** null when no community the developer builds in has DLD coverage. */
    marketPositioning:
      | { score: number; band: MarketPositioning; ratio: number }
      | null;
  };
  /** Raw, auditable inputs echoed for the methodology disclosure. */
  inputs: {
    projectCount: number;
    communityCount: number;
    postHandoverProjects: number;
    devMedianPpsqft: number | null;
    marketMedianPpsqft: number | null;
    areasWithDldData: number;
  };
  weights: typeof PROFILE_WEIGHTS;
}

export function computeDeveloperProfile(
  input: ComputeProfileInput,
): DeveloperProfile {
  const { projects, maxProjectCount, maxCommunityCount, areaMedianPpsqft } = input;

  const projectCount = projects.length;

  const communitySlugs = new Set<string>();
  const unitPpsqft: number[] = [];
  const areaMedians: number[] = [];
  let postHandoverProjects = 0;

  for (const project of projects) {
    if (project.area) communitySlugs.add(communitySlugFor(project.area));
    if (isPostHandoverPlan(project.paymentPlan)) postHandoverProjects += 1;
    for (const unit of project.units) {
      if (unit.launchPriceAed > 0 && unit.sqftMin > 0) {
        unitPpsqft.push(unit.launchPriceAed / unit.sqftMin);
      }
    }
    const areaMedian = areaMedianPpsqft(project.area);
    if (areaMedian && areaMedian > 0) areaMedians.push(areaMedian);
  }

  const communityCount = communitySlugs.size;
  const devMedianPpsqft = median(unitPpsqft);
  const marketMedianPpsqft = median(areaMedians);

  const scaleScore = portfolioScaleScore(projectCount, maxProjectCount);
  const reachScore = geographicReachScore(communityCount, maxCommunityCount);
  const termsScore = buyerTermsScore(postHandoverProjects, projectCount);

  const ratio = positioningRatio(devMedianPpsqft, marketMedianPpsqft);
  const marketPositioning =
    ratio != null
      ? {
          score: positioningScore(ratio),
          band: positioningBand(ratio),
          ratio,
        }
      : null;

  const composite = compositeScore({
    portfolioScale: scaleScore,
    geographicReach: reachScore,
    buyerTerms: termsScore,
    marketPositioning: marketPositioning?.score,
  });

  return {
    composite,
    tier: profileTier(composite),
    subMetrics: {
      portfolioScale: { score: scaleScore, projectCount },
      geographicReach: { score: reachScore, communityCount },
      buyerTerms: {
        score: termsScore,
        postHandoverProjects,
        totalProjects: projectCount,
      },
      marketPositioning,
    },
    inputs: {
      projectCount,
      communityCount,
      postHandoverProjects,
      devMedianPpsqft: devMedianPpsqft != null ? Math.round(devMedianPpsqft) : null,
      marketMedianPpsqft:
        marketMedianPpsqft != null ? Math.round(marketMedianPpsqft) : null,
      areasWithDldData: areaMedians.length,
    },
    weights: PROFILE_WEIGHTS,
  };
}
