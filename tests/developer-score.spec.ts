import { test, expect } from "./fixtures";
import {
  portfolioScaleScore,
  geographicReachScore,
  buyerTermsScore,
  isPostHandoverPlan,
  positioningRatio,
  positioningBand,
  positioningScore,
  compositeScore,
  profileTier,
  computeDeveloperProfile,
  median,
  PROFILE_WEIGHTS,
  type ProfileProject,
} from "../src/lib/developer-score";

// Pure, table-driven spec for the data-derived Developer Profile scorers.
// Every expected value is derived by hand from the documented formulas so the
// tables double as executable documentation of the math.

test.describe("median", () => {
  const cases: Array<[number[], number | null]> = [
    [[], null],
    [[5], 5],
    [[3, 1, 2], 2],
    [[4, 1, 3, 2], 2.5],
  ];
  for (const [input, expected] of cases) {
    test(`median([${input.join(",")}]) = ${expected}`, () => {
      expect(median(input)).toBe(expected);
    });
  }
});

test.describe("portfolioScaleScore (log-scaled vs catalog max)", () => {
  const cases: Array<[number, number, number]> = [
    // [projectCount, maxProjectCount, expectedScore]
    [0, 222, 0],
    [1, 1, 100],
    [222, 222, 100],
    [1, 222, 13],
    [18, 222, 54],
    [29, 222, 63],
  ];
  for (const [count, max, expected] of cases) {
    test(`scale(${count}, ${max}) = ${expected}`, () => {
      expect(portfolioScaleScore(count, max)).toBe(expected);
    });
  }
});

test.describe("geographicReachScore (log-scaled vs catalog max)", () => {
  const cases: Array<[number, number, number]> = [
    [0, 16, 0],
    [16, 16, 100],
    [1, 16, 24],
    [5, 16, 63],
    [8, 16, 78],
  ];
  for (const [count, max, expected] of cases) {
    test(`reach(${count}, ${max}) = ${expected}`, () => {
      expect(geographicReachScore(count, max)).toBe(expected);
    });
  }
});

test.describe("buyerTermsScore (post-handover share)", () => {
  const cases: Array<[number, number, number]> = [
    [0, 0, 0],
    [0, 3, 0],
    [1, 2, 50],
    [2, 3, 67],
    [3, 3, 100],
  ];
  for (const [post, total, expected] of cases) {
    test(`terms(${post}/${total}) = ${expected}`, () => {
      expect(buyerTermsScore(post, total)).toBe(expected);
    });
  }
});

test.describe("isPostHandoverPlan (parsePaymentPlan validated 95–105%)", () => {
  const cases: Array<[string | undefined, boolean]> = [
    ["10/35/5/50", true], // total 100, after 50
    ["10/20/30/40", true], // total 100, after 40
    ["5/10/5/75", true], // total 95 (lower bound inclusive)
    ["10/10/10/75", true], // total 105 (upper bound inclusive)
    ["20/80", false], // no post-handover segment
    ["10/40/50/0", false], // after = 0
    ["50/50/50/50", false], // total 200 — outside 95–105
    ["10/10/10/76", false], // total 106 — outside 95–105
    ["", false],
    [undefined, false],
  ];
  for (const [plan, expected] of cases) {
    test(`isPostHandoverPlan(${JSON.stringify(plan)}) = ${expected}`, () => {
      expect(isPostHandoverPlan(plan)).toBe(expected);
    });
  }
});

test.describe("market positioning (dev median ÷ DLD area median)", () => {
  test("ratio is null without both medians", () => {
    expect(positioningRatio(null, 2000)).toBeNull();
    expect(positioningRatio(2000, null)).toBeNull();
    expect(positioningRatio(2000, 2000)).toBe(1);
    expect(positioningRatio(2400, 2000)).toBeCloseTo(1.2, 5);
  });

  const bandCases: Array<[number, "premium" | "mid-market" | "value"]> = [
    [1.2, "premium"],
    [1.15, "premium"],
    [1.14, "mid-market"],
    [1.0, "mid-market"],
    [0.9, "mid-market"],
    [0.85, "value"],
    [0.6, "value"],
  ];
  for (const [ratio, expected] of bandCases) {
    test(`band(${ratio}) = ${expected}`, () => {
      expect(positioningBand(ratio)).toBe(expected);
    });
  }

  const scoreCases: Array<[number, number]> = [
    [1.0, 50],
    [1.2, 70],
    [0.85, 35],
    [1.5, 100],
    [2.0, 100],
    [0.5, 0],
  ];
  for (const [ratio, expected] of scoreCases) {
    test(`positioningScore(${ratio}) = ${expected}`, () => {
      expect(positioningScore(ratio)).toBe(expected);
    });
  }
});

test.describe("compositeScore (weighted avg, renormalized on missing)", () => {
  test("weights sum to 1", () => {
    const sum = Object.values(PROFILE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  test("all four present → weighted average", () => {
    expect(
      compositeScore({
        portfolioScale: 40,
        geographicReach: 40,
        buyerTerms: 40,
        marketPositioning: 40,
      }),
    ).toBe(40);
  });

  test("positioning missing → renormalized over remaining three", () => {
    // (60·.35 + 40·.25 + 20·.25) / .85 = 36 / .85 = 42.35 → 42
    expect(
      compositeScore({
        portfolioScale: 60,
        geographicReach: 40,
        buyerTerms: 20,
      }),
    ).toBe(42);
  });

  test("empty → 0", () => {
    expect(compositeScore({})).toBe(0);
  });
});

test.describe("profileTier (descriptive size tier)", () => {
  const cases: Array<[number, "established" | "growing" | "boutique"]> = [
    [100, "established"],
    [45, "established"],
    [44, "growing"],
    [25, "growing"],
    [24, "boutique"],
    [0, "boutique"],
  ];
  for (const [composite, expected] of cases) {
    test(`tier(${composite}) = ${expected}`, () => {
      expect(profileTier(composite)).toBe(expected);
    });
  }
});

test.describe("computeDeveloperProfile (end-to-end, injected DLD lookup)", () => {
  const projects: ProfileProject[] = [
    {
      area: "Dubai Marina, Dubai, UAE",
      paymentPlan: "10/35/5/50", // post-handover
      units: [{ launchPriceAed: 2_000_000, sqftMin: 1000 }], // 2000/sqft
    },
    {
      area: "Business Bay, Dubai, UAE",
      paymentPlan: "20/80", // not post-handover
      units: [{ launchPriceAed: 3_000_000, sqftMin: 1000 }], // 3000/sqft
    },
  ];
  const areaMedianPpsqft = (area: string): number | null => {
    if (area.startsWith("Dubai Marina")) return 2000;
    if (area.startsWith("Business Bay")) return 2500;
    return null;
  };

  test("computes all sub-metrics, composite, tier, and audit inputs", () => {
    const profile = computeDeveloperProfile({
      projects,
      maxProjectCount: 222,
      maxCommunityCount: 16,
      areaMedianPpsqft,
    });

    expect(profile.subMetrics.portfolioScale).toEqual({
      score: 20,
      projectCount: 2,
    });
    expect(profile.subMetrics.geographicReach).toEqual({
      score: 39,
      communityCount: 2,
    });
    expect(profile.subMetrics.buyerTerms).toEqual({
      score: 50,
      postHandoverProjects: 1,
      totalProjects: 2,
    });
    // dev median ppsqft = median(2000, 3000) = 2500; area median = median(2000, 2500) = 2250
    // ratio 2500/2250 = 1.111 → mid-market, score 61
    expect(profile.subMetrics.marketPositioning).not.toBeNull();
    expect(profile.subMetrics.marketPositioning?.band).toBe("mid-market");
    expect(profile.subMetrics.marketPositioning?.score).toBe(61);

    // composite = 20·.35 + 39·.25 + 50·.25 + 61·.15 = 38.4 → 38 (growing)
    expect(profile.composite).toBe(38);
    expect(profile.tier).toBe("growing");

    expect(profile.inputs).toEqual({
      projectCount: 2,
      communityCount: 2,
      postHandoverProjects: 1,
      devMedianPpsqft: 2500,
      marketMedianPpsqft: 2250,
      areasWithDldData: 2,
    });
    expect(profile.weights).toBe(PROFILE_WEIGHTS);
  });

  test("drops positioning (never fabricates) when no DLD coverage", () => {
    const profile = computeDeveloperProfile({
      projects: [
        {
          area: "Al Reem Island, Abu Dhabi, UAE",
          paymentPlan: "10/10/10/70", // post-handover
          units: [{ launchPriceAed: 1_000_000, sqftMin: 800 }],
        },
      ],
      maxProjectCount: 222,
      maxCommunityCount: 16,
      areaMedianPpsqft: () => null,
    });

    expect(profile.subMetrics.marketPositioning).toBeNull();
    expect(profile.inputs.marketMedianPpsqft).toBeNull();
    expect(profile.inputs.areasWithDldData).toBe(0);
    // (13·.35 + 24·.25 + 100·.25) / .85 = 35.55 / .85 = 41.8 → 42 (growing)
    expect(profile.composite).toBe(42);
    expect(profile.tier).toBe("growing");
  });
});
