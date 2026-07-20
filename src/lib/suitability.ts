/**
 * Suitability engine v1 — rule-based "who is this project for" scoring.
 *
 * PURE module: every signal is computed from data already in the repo —
 * catalog fields (units, amenities, property types, payment plan, handover)
 * and the anonymized DLD area aggregates passed in by the caller. No LLM, no
 * invented facts: each emitted reason carries the datum that produced it, so
 * every rendered claim is traceable (grounding invariant).
 *
 * Confidence floors (degraded data refuses to conclude):
 * - an audience score is emitted ONLY when its required base data exists and
 *   at least MIN_SIGNALS of its signals fired;
 * - investor additionally requires DLD area stats at high/medium confidence —
 *   without market data we do not call something an "investor pick".
 */

import type { DldAreaStats } from "@/lib/dld-area-stats";
import type { Project, UnitType } from "@/lib/types";
import {
  handoverMonths,
  hasPaymentPlan,
  parsePaymentPlan,
  pricePerSqft,
} from "@/lib/investment-metrics";

export type SuitabilityAudience = "family" | "investor" | "lifestyle";

export interface SuitabilityReason {
  /** Dictionary key under pdp.suitability.reasons.* — never free text. */
  key: string;
  /** Optional pre-formatted value interpolated into the reason copy. */
  value?: string;
}

export interface SuitabilityScore {
  audience: SuitabilityAudience;
  /** 0–100, banded for display (fit tiers) — not precision theater. */
  score: number;
  tier: "strong" | "good";
  reasons: SuitabilityReason[];
}

const MIN_SIGNALS = 3;
const STRONG_TIER = 70;
/** Emit an audience only when it clears this floor. */
const MIN_SCORE = 55;

const FAMILY_AMENITIES =
  /school|nursery|kids|children|play|park|garden|family|daycare|clubhouse/i;
const LIFESTYLE_AMENITIES =
  /beach|marina|spa|concierge|infinity|rooftop|lounge|yacht|golf|padel|cinema/i;
const FAMILY_TYPES = /villa|townhouse|duplex/i;

interface Signal {
  weight: number;
  reason: SuitabilityReason;
}

function bedsShare(units: UnitType[], predicate: (beds: number) => boolean): number {
  if (units.length === 0) return 0;
  return units.filter((u) => predicate(u.beds)).length / units.length;
}

function minProjectPpsqft(units: UnitType[]): number | null {
  const values = units
    .map((u) => pricePerSqft(u.launchPriceAed, u.sqftMin))
    .filter((v): v is number => v != null);
  return values.length ? Math.min(...values) : null;
}

function toScore(signals: Signal[], maxWeight: number): number {
  const total = signals.reduce((sum, s) => sum + s.weight, 0);
  return Math.round(Math.min(1, total / maxWeight) * 100);
}

function build(
  audience: SuitabilityAudience,
  signals: Signal[],
  maxWeight: number,
): SuitabilityScore | null {
  if (signals.length < MIN_SIGNALS) return null;
  const score = toScore(signals, maxWeight);
  if (score < MIN_SCORE) return null;
  const reasons = [...signals]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((s) => s.reason);
  return {
    audience,
    score,
    tier: score >= STRONG_TIER ? "strong" : "good",
    reasons,
  };
}

/**
 * Compute suitability scores for a project. `areaStats` comes from
 * getAreaStats() on the server (dld-area-stats.json is server-only) — pass
 * null when unavailable and the investor audience simply will not emit.
 */
export function suitabilityScores(
  project: Project,
  areaStats: DldAreaStats | null,
): SuitabilityScore[] {
  const units = project.units ?? [];
  const amenities = (project.amenities ?? []).join(" · ");
  const out: SuitabilityScore[] = [];

  // ── Family ────────────────────────────────────────────────────────────
  if (units.length > 0) {
    const signals: Signal[] = [];
    const familyBeds = bedsShare(units, (b) => b >= 2);
    if (familyBeds >= 0.5) {
      signals.push({
        weight: 30,
        reason: { key: "familyBedsMix", value: `${Math.round(familyBeds * 100)}%` },
      });
    }
    if (FAMILY_AMENITIES.test(amenities)) {
      signals.push({ weight: 25, reason: { key: "familyAmenities" } });
    }
    if (units.some((u) => FAMILY_TYPES.test(u.propertyType ?? ""))) {
      signals.push({ weight: 25, reason: { key: "familyHomeTypes" } });
    }
    if (hasPaymentPlan(project.paymentPlan)) {
      signals.push({
        weight: 20,
        reason: { key: "familyPaymentPlan", value: project.paymentPlan ?? undefined },
      });
    }
    const score = build("family", signals, 100);
    if (score) out.push(score);
  }

  // ── Investor — requires real market data ─────────────────────────────
  const marketOk =
    areaStats != null &&
    (areaStats.confidence === "high" || areaStats.confidence === "medium");
  if (units.length > 0 && marketOk) {
    const signals: Signal[] = [];
    if (areaStats.grossYieldPct != null) {
      signals.push({
        weight: 30,
        reason: { key: "investorYield", value: `${areaStats.grossYieldPct}%` },
      });
    }
    const projPpsqft = minProjectPpsqft(units);
    if (projPpsqft != null && areaStats.medianPpsqft != null && projPpsqft < areaStats.medianPpsqft) {
      const pct = Math.round((1 - projPpsqft / areaStats.medianPpsqft) * 100);
      // Honest framing: launch price vs RECENT SOLD median (resale) — the
      // dictionary copy says "below recent sold prices in the area".
      if (pct >= 5) {
        signals.push({ weight: 25, reason: { key: "investorEntryPrice", value: `${pct}%` } });
      }
    }
    if (areaStats.saleSample >= 100) {
      signals.push({
        weight: 20,
        reason: { key: "investorLiquidity", value: areaStats.saleSample.toLocaleString("en-US") },
      });
    }
    const parsedPlan = project.paymentPlan ? parsePaymentPlan(project.paymentPlan) : null;
    if (parsedPlan && (parsedPlan.afterPct > 0 || parsedPlan.downPaymentPct <= 10)) {
      signals.push({
        weight: 15,
        reason: {
          key: parsedPlan.afterPct > 0 ? "investorPostHandover" : "investorLowDownPayment",
          value: project.paymentPlan ?? undefined,
        },
      });
    }
    const months = handoverMonths(project.handover ?? undefined);
    if (months != null && months <= 24) {
      signals.push({ weight: 10, reason: { key: "investorNearHandover", value: project.handover ?? undefined } });
    }
    const score = build("investor", signals, 100);
    if (score) out.push(score);
  }

  // ── Lifestyle ─────────────────────────────────────────────────────────
  if (units.length > 0) {
    const signals: Signal[] = [];
    if (LIFESTYLE_AMENITIES.test(amenities)) {
      signals.push({ weight: 30, reason: { key: "lifestyleAmenities" } });
    }
    if (/beach|marina|island|waterfront|creek|canal|sea/i.test(`${project.area} ${amenities}`)) {
      signals.push({ weight: 25, reason: { key: "lifestyleWaterfront" } });
    }
    const compactShare = bedsShare(units, (b) => b <= 1);
    if (compactShare >= 0.5) {
      signals.push({
        weight: 25,
        reason: { key: "lifestyleCompactMix", value: `${Math.round(compactShare * 100)}%` },
      });
    }
    if (units.some((u) => /penthouse/i.test(u.propertyType ?? ""))) {
      signals.push({ weight: 20, reason: { key: "lifestylePenthouse" } });
    }
    const score = build("lifestyle", signals, 100);
    if (score) out.push(score);
  }

  return out.sort((a, b) => b.score - a.score);
}
