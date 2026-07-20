/**
 * Pins the suitability rules + confidence floors:
 * - every emitted reason is a dictionary key + optional traceable value;
 * - investor NEVER emits without high/medium-confidence DLD market data
 *   (degraded data refuses to conclude);
 * - an audience emits only when >= MIN_SIGNALS fired and it clears the floor.
 *
 *   npm run test:unit
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { suitabilityScores } from "./suitability";
import type { DldAreaStats } from "./dld-area-stats";
import type { Project, UnitType } from "./types";

function unit(p: Partial<UnitType> = {}): UnitType {
  return {
    id: p.id ?? "u",
    beds: p.beds ?? 2,
    sqftMin: p.sqftMin ?? 900,
    launchPriceAed: p.launchPriceAed ?? 1_500_000,
    propertyType: p.propertyType ?? "apartment",
    ...p,
  };
}

function project(p: Partial<Project> = {}): Project {
  return {
    id: "p",
    slug: "sample",
    name: "Sample",
    developer: "Dev",
    developerInitials: "D",
    area: "Jumeirah Village Circle",
    city: "dubai",
    status: "off-plan",
    isPremium: false,
    unitCount: 1,
    whatsapp: "9715",
    units: [unit()],
    ...p,
  } as Project;
}

const richArea: DldAreaStats = {
  areaLabel: "JVC",
  saleSample: 18000,
  medianPrice: 1_400_000,
  medianPpsqft: 1600,
  appreciationPct: null,
  monthlyTrend: [],
  rentSample: 5000,
  medianAnnualRent: 90000,
  grossYieldPct: 6.9,
  confidence: "high",
};

test("family emits for a villa/large-bed amenity-rich project", () => {
  const p = project({
    amenities: ["Kids play area", "Community park", "School nearby"],
    paymentPlan: "20/40/40",
    units: [unit({ beds: 3, propertyType: "townhouse" }), unit({ beds: 4, propertyType: "villa" })],
  });
  const scores = suitabilityScores(p, richArea);
  const fam = scores.find((s) => s.audience === "family");
  assert.ok(fam, "family score present");
  assert.ok(fam!.reasons.length >= 1 && fam!.reasons.every((r) => typeof r.key === "string"));
});

test("investor does NOT emit without high/medium-confidence market data", () => {
  const p = project({ paymentPlan: "10/40/50", units: [unit({ launchPriceAed: 1_000_000, sqftMin: 900 })] });
  // null area stats → no investor score, ever.
  assert.equal(suitabilityScores(p, null).some((s) => s.audience === "investor"), false);
  // low-confidence area stats → still no investor score.
  const lowConf = { ...richArea, confidence: "low" as const };
  assert.equal(suitabilityScores(p, lowConf).some((s) => s.audience === "investor"), false);
});

test("investor emits with real market data + yield/liquidity signals", () => {
  const p = project({
    paymentPlan: "10/40/50",
    handover: "Q2 2026",
    units: [unit({ launchPriceAed: 1_200_000, sqftMin: 900 })], // ~1333/sqft < 1600 median
  });
  const inv = suitabilityScores(p, richArea).find((s) => s.audience === "investor");
  assert.ok(inv, "investor score present with rich DLD data");
  assert.ok(inv!.reasons.some((r) => r.key === "investorYield"));
});

test("a data-thin project emits nothing (floors hold)", () => {
  const p = project({ amenities: [], paymentPlan: undefined, units: [unit({ beds: 1, propertyType: "apartment" })] });
  const scores = suitabilityScores(p, null);
  // one compact unit, no amenities, no plan, no market data → below MIN_SIGNALS
  assert.equal(scores.some((s) => s.audience === "family"), false);
  assert.equal(scores.some((s) => s.audience === "investor"), false);
});

test("scores are banded and sorted high→low", () => {
  const p = project({
    amenities: ["Beach access", "Marina promenade", "Infinity pool", "Concierge"],
    paymentPlan: "20/40/40",
    units: [unit({ beds: 1, propertyType: "apartment" }), unit({ beds: 3, propertyType: "villa" })],
  });
  const scores = suitabilityScores(p, richArea);
  for (const s of scores) {
    assert.ok(s.score >= 0 && s.score <= 100);
    assert.ok(s.tier === "strong" || s.tier === "good");
  }
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i - 1].score >= scores[i].score, "sorted descending");
  }
});
