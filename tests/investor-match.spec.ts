import { test, expect } from "@playwright/test";
import type { FlatUnit } from "@/lib/catalog-core";
import type { Project, PropertyType, UnitType } from "@/lib/types";
import {
  decodeAnswers,
  encodeAnswers,
  matchInvestments,
  MAX_MATCHES,
  QUIZ_STEPS,
  type QuizAnswers,
  type YieldCommunity,
} from "@/lib/investor-match";

// ---------------------------------------------------------------------------
// Fixtures — minimal FlatUnit builder over the real Project/UnitType types.
// ---------------------------------------------------------------------------

let seq = 0;

interface UnitOverride {
  name?: string;
  area?: string;
  locationFull?: string;
  price?: number;
  beds?: number;
  sqft?: number;
  propertyType?: PropertyType;
  paymentPlan?: string;
  handover?: string;
  amenities?: string[];
  isPremium?: boolean;
}

function makeUnit(over: UnitOverride = {}): FlatUnit {
  const n = ++seq;
  const id = `p${n}`;
  const unit: UnitType = {
    id: `u${n}`,
    beds: over.beds ?? 1,
    sqftMin: over.sqft ?? 800,
    launchPriceAed: over.price ?? 1_500_000,
    propertyType: over.propertyType ?? "apartment",
  };
  const area = over.area ?? "Business Bay";
  const project: Project = {
    id,
    slug: `proj-${id}`,
    name: over.name ?? `Project ${id}`,
    developer: "Test Developer",
    developerInitials: "TD",
    city: "dubai",
    area,
    locationFull: over.locationFull ?? `${area}, Dubai`,
    status: "off-plan",
    handover: over.handover,
    paymentPlan: over.paymentPlan ?? "20/80",
    isPremium: over.isPremium ?? false,
    unitCount: 1,
    amenities: over.amenities,
    whatsapp: "+971500000000",
    units: [unit],
  };
  return { project, unit };
}

/** "Q# YYYY" whose quarter start is ~monthsAhead from today (date-agnostic). */
function futureQuarter(monthsAhead: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

function reasonCodes(m: { reasons: { code: string }[] }): string[] {
  return m.reasons.map((r) => r.code);
}

// ---------------------------------------------------------------------------
// URL codec
// ---------------------------------------------------------------------------

test.describe("investor-match codec", () => {
  const samples: QuizAnswers[] = [
    {
      budget: "under-1m",
      goal: "income",
      vibe: "beachfront",
      timing: "ready",
      payment: "low-down",
      beds: "studio",
    },
    {
      budget: "5m-plus",
      goal: "golden-visa",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "any",
    },
    {
      budget: "2-5m",
      goal: "appreciation",
      vibe: "urban",
      timing: "mid",
      payment: "post-handover",
      beds: "3-plus",
    },
  ];

  for (const answers of samples) {
    test(`round-trips ${answers.budget}/${answers.goal}`, () => {
      const encoded = encodeAnswers(answers);
      expect(encoded).toHaveLength(QUIZ_STEPS.length);
      expect(decodeAnswers(encoded)).toEqual(answers);
    });
  }

  const badInputs: (string | null | undefined)[] = [null, undefined, "", "12345", "zzzzzz", "1234567"];
  for (const raw of badInputs) {
    test(`rejects malformed value ${JSON.stringify(raw)}`, () => {
      expect(decodeAnswers(raw)).toBeNull();
    });
  }
});

// ---------------------------------------------------------------------------
// Matcher — budget filter
// ---------------------------------------------------------------------------

test.describe("investor-match budget filter", () => {
  const base: QuizAnswers = {
    budget: "1-2m",
    goal: "live-in",
    vibe: "any",
    timing: "long",
    payment: "any",
    beds: "any",
  };

  test("keeps only units inside the band", () => {
    const units = [
      makeUnit({ name: "TooCheap", price: 600_000 }),
      makeUnit({ name: "InBand", price: 1_500_000 }),
      makeUnit({ name: "TooDear", price: 3_000_000 }),
    ];
    const res = matchInvestments(units, base);
    expect(res.map((m) => m.project.name)).toEqual(["InBand"]);
  });

  test("returns nothing when the pool is empty", () => {
    const res = matchInvestments([makeUnit({ price: 9_000_000 })], base);
    expect(res).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Matcher — goal weighting + truthful reasons
// ---------------------------------------------------------------------------

test.describe("investor-match goal weighting", () => {
  test("golden-visa: 2M+ units earn the goldenVisa reason", () => {
    const answers: QuizAnswers = {
      budget: "2-5m",
      goal: "golden-visa",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "any",
    };
    const res = matchInvestments(
      [makeUnit({ name: "Alpha", price: 2_500_000 }), makeUnit({ name: "Beta", price: 4_000_000 })],
      answers,
    );
    expect(res).toHaveLength(2);
    for (const m of res) {
      expect(reasonCodes(m)).toContain("goldenVisa");
      expect(m.score).toBe(100);
    }
  });

  test("income: higher-yield community ranks first and cites the yield", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "income",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "any",
    };
    const yieldCommunities: YieldCommunity[] = [
      { key: "DUBAI MARINA", name: "DUBAI MARINA", grossYieldPct: 5.3 },
      { key: "BUSINESS BAY", name: "BUSINESS BAY", grossYieldPct: 6.1 },
    ];
    const res = matchInvestments(
      [
        makeUnit({ name: "Marina Tower", area: "Dubai Marina", price: 1_500_000 }),
        makeUnit({ name: "Bay Tower", area: "Business Bay", price: 1_800_000 }),
      ],
      answers,
      { yieldCommunities },
    );
    expect(res[0].project.name).toBe("Bay Tower");
    expect(reasonCodes(res[0])).toContain("highYield");
    const yieldReason = res[0].reasons.find((r) => r.code === "highYield");
    expect(yieldReason?.values?.yield).toBe(6.1);
  });

  test("income: no yield reason when the community is unknown (no fabrication)", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "income",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "any",
    };
    const res = matchInvestments(
      [makeUnit({ name: "Mystery", area: "Nowhere Estate", price: 1_400_000 })],
      answers,
      { yieldCommunities: [{ key: "DUBAI MARINA", name: "DUBAI MARINA", grossYieldPct: 5 }] },
    );
    expect(reasonCodes(res[0])).not.toContain("highYield");
  });

  test("live-in: amenity-rich project outranks a bare one and cites amenities", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "2",
    };
    const res = matchInvestments(
      [
        makeUnit({
          name: "AmenCity",
          beds: 2,
          amenities: ["Pool", "Gym", "Kids play area"],
        }),
        makeUnit({ name: "Bare", beds: 2, amenities: [] }),
      ],
      answers,
    );
    expect(res[0].project.name).toBe("AmenCity");
    expect(reasonCodes(res[0])).toEqual(expect.arrayContaining(["amenityRich", "bedsMatch"]));
  });
});

// ---------------------------------------------------------------------------
// Matcher — vibe / payment / beds
// ---------------------------------------------------------------------------

test.describe("investor-match dimension matches", () => {
  test("beachfront vibe rewards waterfront locations", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "beachfront",
      timing: "long",
      payment: "any",
      beds: "any",
    };
    const res = matchInvestments(
      [
        makeUnit({ name: "Palm View", area: "Palm Jumeirah", price: 1_800_000 }),
        makeUnit({ name: "Inland", area: "Arjan", price: 1_800_000 }),
      ],
      answers,
    );
    expect(res[0].project.name).toBe("Palm View");
    expect(reasonCodes(res[0])).toContain("waterfront");
  });

  test("low-down payment: validated plans surface a lowDown reason", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "any",
      timing: "long",
      payment: "low-down",
      beds: "any",
    };
    const res = matchInvestments(
      [
        makeUnit({ name: "EasyStart", paymentPlan: "10/90" }),
        makeUnit({ name: "BigDeposit", paymentPlan: "50/50" }),
      ],
      answers,
    );
    expect(res[0].project.name).toBe("EasyStart");
    expect(reasonCodes(res[0])).toContain("lowDown");
    expect(reasonCodes(res[1])).not.toContain("lowDown");
  });

  test("post-handover payment: only genuine post-handover plans qualify", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "any",
      timing: "long",
      payment: "post-handover",
      beds: "any",
    };
    const res = matchInvestments(
      [
        makeUnit({ name: "PostHO", paymentPlan: "20/50/10/20" }),
        makeUnit({ name: "OnHandover", paymentPlan: "20/80" }),
      ],
      answers,
    );
    expect(res[0].project.name).toBe("PostHO");
    expect(reasonCodes(res[0])).toContain("postHandover");
    expect(reasonCodes(res[1])).not.toContain("postHandover");
  });

  test("beds: exact bedroom match wins and reports the count", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "any",
      timing: "long",
      payment: "any",
      beds: "2",
    };
    const res = matchInvestments(
      [makeUnit({ name: "OneBed", beds: 1 }), makeUnit({ name: "TwoBed", beds: 2 })],
      answers,
    );
    expect(res[0].project.name).toBe("TwoBed");
    const bedsReason = res[0].reasons.find((r) => r.code === "bedsMatch");
    expect(bedsReason?.values?.beds).toBe(2);
  });

  test("ready timing: near handover earns readySoon", () => {
    const answers: QuizAnswers = {
      budget: "1-2m",
      goal: "live-in",
      vibe: "any",
      timing: "ready",
      payment: "any",
      beds: "any",
    };
    const res = matchInvestments(
      [makeUnit({ name: "MoveInSoon", handover: futureQuarter(2) })],
      answers,
    );
    expect(reasonCodes(res[0])).toContain("readySoon");
  });
});

// ---------------------------------------------------------------------------
// Matcher — invariants
// ---------------------------------------------------------------------------

test.describe("investor-match invariants", () => {
  const answers: QuizAnswers = {
    budget: "1-2m",
    goal: "appreciation",
    vibe: "urban",
    timing: "long",
    payment: "post-handover",
    beds: "2",
  };

  test("returns at most MAX_MATCHES projects", () => {
    const units = Array.from({ length: 10 }, (_, i) =>
      makeUnit({ name: `P${i}`, price: 1_200_000 + i * 10_000 }),
    );
    const res = matchInvestments(units, answers);
    expect(res.length).toBe(MAX_MATCHES);
  });

  test("every match carries 2–3 reasons", () => {
    const units = [
      makeUnit({ name: "Rich", area: "Business Bay", paymentPlan: "10/40/10/40", beds: 2, isPremium: true }),
      makeUnit({ name: "Plain", area: "Somewhere", paymentPlan: "", beds: 1 }),
    ];
    const res = matchInvestments(units, answers);
    for (const m of res) {
      expect(m.reasons.length).toBeGreaterThanOrEqual(2);
      expect(m.reasons.length).toBeLessThanOrEqual(3);
    }
  });

  test("collapses multiple units of one project to a single best entry", () => {
    const shared = makeUnit({ name: "Twin Towers", beds: 1, price: 1_500_000 });
    const secondUnit: UnitType = { ...shared.unit, id: "u-extra", beds: 2 };
    const second: FlatUnit = { project: shared.project, unit: secondUnit };
    const res = matchInvestments([shared, second], {
      ...answers,
      goal: "live-in",
      vibe: "any",
      payment: "any",
    });
    expect(res).toHaveLength(1);
    // The 2-bed unit is the better representative for a beds:"2" brief.
    expect(res[0].unit.beds).toBe(2);
  });
});
