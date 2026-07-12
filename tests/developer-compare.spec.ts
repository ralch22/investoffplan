import { test, expect } from "./fixtures";
import {
  buildDeveloperFaqs,
  buildDeveloperPros,
  buildDeveloperSuitability,
  type DeveloperSide,
} from "../src/lib/developer-compare-content";

function side(partial: Partial<DeveloperSide> & Pick<DeveloperSide, "slug" | "name">): DeveloperSide {
  return {
    projectCount: 10,
    unitCount: 40,
    fromPrice: 1_000_000,
    avgPpsf: 1_400,
    communities: ["JVC", "Dubai Hills", "Business Bay"],
    handoverYears: [2026, 2027, 2028],
    premiumShare: 0.1,
    ...partial,
  };
}

test.describe("developer-compare decision layer", () => {
  const large = side({
    slug: "emaar-properties",
    name: "Emaar Properties",
    projectCount: 100,
    unitCount: 500,
    fromPrice: 2_000_000,
    avgPpsf: 2_200,
    communities: ["Downtown", "Dubai Hills", "Creek", "Marina", "The Valley", "Arabian Ranches"],
    premiumShare: 0.4,
    handoverYears: [2025, 2026, 2029],
  });
  const boutique = side({
    slug: "beyond",
    name: "Beyond",
    projectCount: 5,
    unitCount: 20,
    fromPrice: 800_000,
    avgPpsf: 1_100,
    communities: ["JVC"],
    premiumShare: 0.05,
    handoverYears: [2027, 2028],
  });

  test("buildDeveloperPros attributes measurable wins only", () => {
    const prosLarge = buildDeveloperPros(large, boutique);
    const prosBoutique = buildDeveloperPros(boutique, large);

    expect(prosLarge.some((p) => /Larger live off-plan portfolio/i.test(p))).toBe(true);
    expect(prosLarge.some((p) => /Broader geographic reach/i.test(p))).toBe(true);
    expect(prosLarge.some((p) => /premium-flagged/i.test(p))).toBe(true);
    expect(prosLarge.some((p) => /Earlier handover/i.test(p))).toBe(true);

    expect(prosBoutique.some((p) => /Lower entry price/i.test(p))).toBe(true);
    expect(prosBoutique.some((p) => /Lower average launch AED\/sqft/i.test(p))).toBe(true);
    // Boutique does not falsely claim a larger portfolio
    expect(prosBoutique.some((p) => /Larger live off-plan portfolio/i.test(p))).toBe(false);
  });

  test("buildDeveloperSuitability returns at most 3 buyer profiles", () => {
    const suits = buildDeveloperSuitability(large, boutique);
    expect(suits.length).toBeGreaterThan(0);
    expect(suits.length).toBeLessThanOrEqual(3);
    for (const s of suits) {
      expect(s.profile.length).toBeGreaterThan(3);
      expect(s.reason.length).toBeGreaterThan(10);
    }
  });

  test("buildDeveloperFaqs stays catalog-grounded and expands past 3 items when data allows", () => {
    const faqs = buildDeveloperFaqs({
      pairSlug: "beyond-vs-emaar-properties",
      a: boutique,
      b: large,
    });
    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs.length).toBeLessThanOrEqual(5);
    expect(faqs.every((f) => f.q && f.a)).toBe(true);
    expect(faqs.some((f) => /price per sqft|AED\/sqft|per sqft/i.test(f.q + f.a))).toBe(true);
    // Honesty: premium is positioning, not quality
    const premiumFaq = faqs.find((f) => /premium/i.test(f.q));
    if (premiumFaq) {
      expect(premiumFaq.a).toMatch(/not a quality/i);
    }
  });

  test("equal sides produce no false-positive pros", () => {
    const twin = side({ slug: "a", name: "A" });
    const other = side({ slug: "b", name: "B" });
    expect(buildDeveloperPros(twin, other)).toEqual([]);
    expect(buildDeveloperPros(other, twin)).toEqual([]);
  });
});
