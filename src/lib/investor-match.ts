/**
 * Investor Match — pure matcher.
 *
 * Scores flattened catalog units against a 6-answer quiz brief and returns the
 * top project matches, each annotated with 2–3 "why it matched" reasons.
 *
 * TRUTHFULNESS INVARIANT: this module never fabricates a reason. Every reason is
 * a `{ code, values }` pair emitted ONLY when the underlying data predicate is
 * verified against the real catalog record (yield lookup, price threshold,
 * parsed+validated payment plan, handover math, bedroom equality, amenity
 * count). The UI renders each code with a fixed localized template that states
 * exactly what the predicate proved — it never free-writes prose. Fallback
 * reasons (budget fit / handover date / payment-plan string) are equally
 * factual, derived straight from the record.
 *
 * Pure + isomorphic: no React, no fetch, no client-only imports. Safe to unit
 * test and to run in the browser.
 */
import type { FlatUnit } from "./catalog-core";
import type { Project, PropertyType, UnitType } from "./types";
import {
  handoverMonths,
  isBrandedResidence,
  isWaterfront,
  parsePaymentPlan,
  unitPricePerSqft,
} from "./investment-metrics";

// ---------------------------------------------------------------------------
// Answer model
// ---------------------------------------------------------------------------

export type BudgetAnswer = "under-1m" | "1-2m" | "2-5m" | "5m-plus";
export type GoalAnswer = "income" | "appreciation" | "golden-visa" | "live-in";
export type VibeAnswer = "beachfront" | "urban" | "family" | "any";
export type TimingAnswer = "ready" | "mid" | "long";
export type PaymentAnswer = "low-down" | "post-handover" | "any";
export type BedsAnswer = "studio" | "1" | "2" | "3-plus" | "any";

export interface QuizAnswers {
  budget: BudgetAnswer;
  goal: GoalAnswer;
  vibe: VibeAnswer;
  timing: TimingAnswer;
  payment: PaymentAnswer;
  beds: BedsAnswer;
}

/** Fixed step order — drives both the wizard and the compact URL codec. */
export const QUIZ_STEPS = [
  "budget",
  "goal",
  "vibe",
  "timing",
  "payment",
  "beds",
] as const;
export type QuizStepKey = (typeof QUIZ_STEPS)[number];

/** Ordered option values per step (order = UI order). */
export const QUIZ_OPTIONS = {
  budget: ["under-1m", "1-2m", "2-5m", "5m-plus"],
  goal: ["income", "appreciation", "golden-visa", "live-in"],
  vibe: ["beachfront", "urban", "family", "any"],
  timing: ["ready", "mid", "long"],
  payment: ["low-down", "post-handover", "any"],
  beds: ["studio", "1", "2", "3-plus", "any"],
} as const satisfies Record<QuizStepKey, readonly string[]>;

// ---------------------------------------------------------------------------
// Compact URL codec — 6 chars, one per step, positional.
// ---------------------------------------------------------------------------

/** Query-string parameter that carries the encoded answers. */
export const ANSWERS_PARAM = "a";

// Per-step value <-> single-char code. Codes are positional so collisions
// across steps (e.g. "r" for both income and ready) are unambiguous.
const CODEC: Record<QuizStepKey, Record<string, string>> = {
  budget: { "under-1m": "1", "1-2m": "2", "2-5m": "3", "5m-plus": "4" },
  goal: { income: "r", appreciation: "a", "golden-visa": "g", "live-in": "h" },
  vibe: { beachfront: "b", urban: "u", family: "f", any: "x" },
  timing: { ready: "r", mid: "m", long: "l" },
  payment: { "low-down": "d", "post-handover": "p", any: "x" },
  beds: { studio: "s", "1": "1", "2": "2", "3-plus": "3", any: "x" },
};

const DECODE: Record<QuizStepKey, Record<string, string>> = Object.fromEntries(
  (Object.keys(CODEC) as QuizStepKey[]).map((step) => [
    step,
    Object.fromEntries(Object.entries(CODEC[step]).map(([v, c]) => [c, v])),
  ]),
) as Record<QuizStepKey, Record<string, string>>;

/** Encode complete answers to the 6-char query value. */
export function encodeAnswers(a: QuizAnswers): string {
  return QUIZ_STEPS.map((step) => CODEC[step][a[step]]).join("");
}

/** Decode a query value to complete answers, or null if malformed/partial. */
export function decodeAnswers(raw: string | null | undefined): QuizAnswers | null {
  if (!raw || raw.length !== QUIZ_STEPS.length) return null;
  const out: Partial<Record<QuizStepKey, string>> = {};
  for (let i = 0; i < QUIZ_STEPS.length; i++) {
    const step = QUIZ_STEPS[i];
    const value = DECODE[step][raw[i]];
    if (value == null) return null;
    out[step] = value;
  }
  return out as QuizAnswers;
}

// ---------------------------------------------------------------------------
// Reasons
// ---------------------------------------------------------------------------

export type ReasonCode =
  | "highYield"
  | "belowAvgPpsf"
  | "goldenVisa"
  | "amenityRich"
  | "waterfront"
  | "urbanHub"
  | "familyCommunity"
  | "readySoon"
  | "handoverWindow"
  | "longHorizon"
  | "lowDown"
  | "postHandover"
  | "bedsMatch"
  | "branded"
  | "budgetFit"
  | "handoverKnown"
  | "paymentPlanKnown"
  | "location";

export interface MatchReason {
  code: ReasonCode;
  values?: Record<string, string | number>;
}

export interface ProjectMatch {
  project: Project;
  /** Representative (best-scoring) qualifying unit for the project. */
  unit: UnitType;
  /** 0–100, relative to the maximum score achievable for these answers. */
  score: number;
  fromPriceAed: number;
  reasons: MatchReason[];
}

export interface YieldCommunity {
  key: string;
  name: string;
  grossYieldPct: number;
}

export interface MatchContext {
  yieldCommunities?: YieldCommunity[];
}

export const MAX_MATCHES = 6;

// ---------------------------------------------------------------------------
// Predicates / helpers
// ---------------------------------------------------------------------------

function inBudget(price: number, budget: BudgetAnswer): boolean {
  switch (budget) {
    case "under-1m":
      return price <= 1_000_000;
    case "1-2m":
      return price >= 1_000_000 && price <= 2_000_000;
    case "2-5m":
      return price >= 2_000_000 && price <= 5_000_000;
    case "5m-plus":
      return price >= 5_000_000;
  }
}

const URBAN_RE =
  /downtown|business bay|dubai marina|\bmarina\b|difc|city walk|jumeirah lake towers|\bjlt\b|za'?abeel|sheikh zayed|maritime city|world trade|financial cent|dubai canal|bur dubai|deira|barsha heights/i;

const FAMILY_RE =
  /ranches|town square|dubai hills|mudon|the valley|damac hills|tilal|serena|\breem\b|\bmira\b|nshama|emaar south|the springs|the meadows|villanova|hills estate|al furjan|jumeirah village|\bjvt\b|\bjvc\b|remraam|dubailand|the sustainable|motor city|sports city|silicon oasis|international city|arabian/i;

function locationHaystack(project: Project): string {
  return [project.area, project.locationFull, project.name]
    .filter(Boolean)
    .join(" ");
}

function isVillaLike(type: PropertyType): boolean {
  return type === "villa" || type === "townhouse";
}

function paymentPlanOf(item: FlatUnit): string | undefined {
  return item.catalog?.paymentPlan ?? item.project.paymentPlan;
}

/** parsePaymentPlan, but only trusted when the segments sum to ~100%. */
function validPlan(plan: string | undefined): {
  downPaymentPct: number;
  duringPct: number;
  handoverPct: number;
  afterPct: number;
} | null {
  if (!plan) return null;
  const parsed = parsePaymentPlan(plan);
  if (!parsed) return null;
  const sum =
    parsed.downPaymentPct +
    parsed.duringPct +
    parsed.handoverPct +
    parsed.afterPct;
  if (sum < 95 || sum > 105) return null;
  return parsed;
}

function bedsMatch(beds: number, answer: BedsAnswer): boolean {
  switch (answer) {
    case "studio":
      return beds === 0;
    case "1":
      return beds === 1;
    case "2":
      return beds === 2;
    case "3-plus":
      return beds >= 3;
    case "any":
      return false;
  }
}

function findYield(
  project: Project,
  communities: YieldCommunity[] | undefined,
): YieldCommunity | null {
  if (!communities?.length) return null;
  const hay = locationHaystack(project).toUpperCase();
  let best: YieldCommunity | null = null;
  for (const c of communities) {
    const key = c.key.toUpperCase();
    const name = c.name.toUpperCase();
    const hit =
      (key.length >= 3 && hay.includes(key)) ||
      (name.length >= 3 && hay.includes(name));
    if (hit && (!best || c.grossYieldPct > best.grossYieldPct)) best = c;
  }
  return best;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Per-dimension max points (goal always contributes; the rest drop out of the
// denominator when the answer is "any", so a perfect fit reads as 100%).
const GOAL_MAX = 40;
const VIBE_MAX = 20;
const PAYMENT_MAX = 12;
const BEDS_MAX = 15;

function timingMax(timing: TimingAnswer): number {
  return timing === "long" ? 12 : 15;
}

/** Denominator for score normalization — depends only on the answers. */
function denominator(a: QuizAnswers): number {
  return (
    GOAL_MAX +
    (a.vibe === "any" ? 0 : VIBE_MAX) +
    timingMax(a.timing) +
    (a.payment === "any" ? 0 : PAYMENT_MAX) +
    (a.beds === "any" ? 0 : BEDS_MAX)
  );
}

// ---------------------------------------------------------------------------
// Per-unit scoring
// ---------------------------------------------------------------------------

interface ScoredUnit {
  raw: number;
  reasons: MatchReason[];
}

interface ScoreEnv {
  medianPpsf: number | null;
}

function scoreGoal(
  item: FlatUnit,
  a: QuizAnswers,
  ctx: MatchContext,
  env: ScoreEnv,
): { raw: number; reason: MatchReason | null } {
  const { project, unit } = item;
  switch (a.goal) {
    case "income": {
      const community = findYield(project, ctx.yieldCommunities);
      if (!community) return { raw: 0, reason: null };
      const raw = clamp((community.grossYieldPct - 3) / (9 - 3), 0, 1) * GOAL_MAX;
      return {
        raw,
        reason: {
          code: "highYield",
          values: {
            yield: community.grossYieldPct,
            community: community.name,
          },
        },
      };
    }
    case "appreciation": {
      let raw = 0;
      let reason: MatchReason | null = null;
      const ppsf = unitPricePerSqft(item);
      if (ppsf != null && env.medianPpsf && ppsf < env.medianPpsf) {
        const ratio = (env.medianPpsf - ppsf) / env.medianPpsf;
        raw += (clamp(ratio, 0, 0.4) / 0.4) * 26;
        reason = {
          code: "belowAvgPpsf",
          values: { ppsf, median: Math.round(env.medianPpsf) },
        };
      }
      if (isBrandedResidence(item)) {
        raw += 8;
        reason = reason ?? { code: "branded" };
      }
      if (item.catalog?.isPremium ?? project.isPremium) raw += 6;
      return { raw, reason };
    }
    case "golden-visa": {
      if (unit.launchPriceAed >= 2_000_000) {
        return {
          raw: GOAL_MAX,
          reason: {
            code: "goldenVisa",
            values: { price: unit.launchPriceAed },
          },
        };
      }
      return { raw: 0, reason: null };
    }
    case "live-in": {
      let raw = 0;
      const amenities = project.amenities ?? [];
      raw += (clamp(amenities.length, 0, 8) / 8) * 24;
      if (isVillaLike(unit.propertyType)) raw += 8;
      const months = handoverMonths(project.handover);
      if (months != null && months <= 24) raw += 8;
      const reason: MatchReason | null =
        amenities.length >= 3
          ? {
              code: "amenityRich",
              values: {
                count: amenities.length,
                list: amenities.slice(0, 2).join(", "),
              },
            }
          : null;
      return { raw, reason };
    }
  }
}

function scoreVibe(
  item: FlatUnit,
  a: QuizAnswers,
): { raw: number; reason: MatchReason | null } {
  if (a.vibe === "any") return { raw: 0, reason: null };
  const { project, unit } = item;
  const hay = locationHaystack(project);
  switch (a.vibe) {
    case "beachfront":
      return isWaterfront(item)
        ? { raw: VIBE_MAX, reason: { code: "waterfront" } }
        : { raw: 0, reason: null };
    case "urban": {
      if (URBAN_RE.test(hay)) {
        const bonus =
          unit.propertyType === "apartment" || unit.propertyType === "penthouse"
            ? 2
            : 0;
        return {
          raw: clamp(18 + bonus, 0, VIBE_MAX),
          reason: { code: "urbanHub", values: { area: project.area } },
        };
      }
      return { raw: 0, reason: null };
    }
    case "family": {
      const communityHit = FAMILY_RE.test(hay);
      let raw = communityHit ? 14 : 0;
      if (isVillaLike(unit.propertyType)) raw += 6;
      return {
        raw: clamp(raw, 0, VIBE_MAX),
        reason: communityHit
          ? { code: "familyCommunity", values: { area: project.area } }
          : null,
      };
    }
  }
  return { raw: 0, reason: null };
}

function scoreTiming(
  item: FlatUnit,
  a: QuizAnswers,
): { raw: number; reason: MatchReason | null } {
  const months = handoverMonths(item.project.handover);
  switch (a.timing) {
    case "ready": {
      if (months != null && months <= 12)
        return {
          raw: 15,
          reason: { code: "readySoon", values: { months } },
        };
      if (months != null && months <= 24) return { raw: 7, reason: null };
      return { raw: 0, reason: null };
    }
    case "mid": {
      if (months != null && months >= 12 && months <= 36)
        return {
          raw: 15,
          reason: { code: "handoverWindow", values: { months } },
        };
      if (months != null && months < 12) return { raw: 8, reason: null };
      if (months != null && months <= 48) return { raw: 6, reason: null };
      return { raw: 0, reason: null };
    }
    case "long": {
      const reason: MatchReason | null =
        months != null && months > 36
          ? { code: "longHorizon", values: { date: item.project.handover ?? "" } }
          : null;
      return { raw: 12, reason };
    }
  }
}

function scorePayment(
  item: FlatUnit,
  a: QuizAnswers,
): { raw: number; reason: MatchReason | null } {
  if (a.payment === "any") return { raw: 0, reason: null };
  const parsed = validPlan(paymentPlanOf(item));
  if (!parsed) return { raw: 0, reason: null };
  if (a.payment === "low-down") {
    if (parsed.downPaymentPct <= 20) {
      return {
        raw: parsed.downPaymentPct <= 10 ? PAYMENT_MAX : 8,
        reason: { code: "lowDown", values: { down: parsed.downPaymentPct } },
      };
    }
    return { raw: 0, reason: null };
  }
  // post-handover
  if (parsed.afterPct > 0) {
    return {
      raw: PAYMENT_MAX,
      reason: { code: "postHandover", values: { after: parsed.afterPct } },
    };
  }
  return { raw: 0, reason: null };
}

function scoreBeds(
  item: FlatUnit,
  a: QuizAnswers,
): { raw: number; reason: MatchReason | null } {
  if (a.beds === "any") return { raw: 0, reason: null };
  if (bedsMatch(item.unit.beds, a.beds)) {
    return {
      raw: BEDS_MAX,
      reason: { code: "bedsMatch", values: { beds: item.unit.beds } },
    };
  }
  return { raw: 0, reason: null };
}

function scoreUnit(
  item: FlatUnit,
  a: QuizAnswers,
  ctx: MatchContext,
  env: ScoreEnv,
): ScoredUnit {
  const goal = scoreGoal(item, a, ctx, env);
  const vibe = scoreVibe(item, a);
  const timing = scoreTiming(item, a);
  const payment = scorePayment(item, a);
  const beds = scoreBeds(item, a);

  const raw = goal.raw + vibe.raw + timing.raw + payment.raw + beds.raw;

  // Priority order: goal → vibe → timing → payment → beds → branded extra.
  const reasons: MatchReason[] = [];
  for (const r of [goal.reason, vibe.reason, timing.reason, payment.reason, beds.reason]) {
    if (r) reasons.push(r);
  }
  if (
    a.goal !== "appreciation" &&
    isBrandedResidence(item) &&
    !reasons.some((r) => r.code === "branded")
  ) {
    reasons.push({ code: "branded" });
  }

  return { raw, reasons };
}

/**
 * Factual, always-derivable fallbacks so every card carries ≥2 reasons.
 * `budgetFit` and `location` are always available, so a match can never drop
 * below two truthful reasons even when handover/payment data is missing.
 */
function fallbackReasons(item: FlatUnit): MatchReason[] {
  const out: MatchReason[] = [
    { code: "budgetFit", values: { price: item.unit.launchPriceAed } },
    {
      code: "location",
      values: { area: item.project.area, city: item.project.city },
    },
  ];
  if (item.project.handover) {
    out.push({ code: "handoverKnown", values: { date: item.project.handover } });
  }
  const plan = paymentPlanOf(item);
  if (plan) out.push({ code: "paymentPlanKnown", values: { plan } });
  return out;
}

// ---------------------------------------------------------------------------
// Public matcher
// ---------------------------------------------------------------------------

/**
 * Score every budget-qualifying unit, collapse to the best unit per project,
 * and return the top {@link MAX_MATCHES} projects ranked by fit.
 */
export function matchInvestments(
  units: FlatUnit[],
  answers: QuizAnswers,
  ctx: MatchContext = {},
): ProjectMatch[] {
  const pool = units.filter((u) => inBudget(u.unit.launchPriceAed, answers.budget));
  if (pool.length === 0) return [];

  const env: ScoreEnv = {
    medianPpsf:
      answers.goal === "appreciation"
        ? median(
            pool
              .map((u) => unitPricePerSqft(u))
              .filter((v): v is number => v != null),
          )
        : null,
  };

  const denom = denominator(answers);

  // Best-scoring unit per project.
  const bestByProject = new Map<string, { item: FlatUnit; scored: ScoredUnit }>();
  for (const item of pool) {
    const scored = scoreUnit(item, answers, ctx, env);
    const prev = bestByProject.get(item.project.id);
    if (!prev || scored.raw > prev.scored.raw) {
      bestByProject.set(item.project.id, { item, scored });
    }
  }

  const ranked = [...bestByProject.values()].sort((a, b) => {
    if (b.scored.raw !== a.scored.raw) return b.scored.raw - a.scored.raw;
    const ap = a.item.catalog?.isPremium ?? a.item.project.isPremium ? 0 : 1;
    const bp = b.item.catalog?.isPremium ?? b.item.project.isPremium ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.item.unit.launchPriceAed - b.item.unit.launchPriceAed;
  });

  return ranked.slice(0, MAX_MATCHES).map(({ item, scored }) => {
    const reasons = [...scored.reasons];
    if (reasons.length < 2) {
      for (const fb of fallbackReasons(item)) {
        if (reasons.length >= 3) break;
        if (!reasons.some((r) => r.code === fb.code)) reasons.push(fb);
      }
    }
    return {
      project: item.project,
      unit: item.unit,
      score: clamp(Math.round((scored.raw / denom) * 100), 0, 100),
      fromPriceAed: item.unit.launchPriceAed,
      reasons: reasons.slice(0, 3),
    };
  });
}
