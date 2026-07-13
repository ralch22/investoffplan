import { test, expect } from "./fixtures";
import {
  buildComparisonFaqs,
  buildPros,
  buildSuitability,
  type SideExtras,
} from "../src/lib/compare-content";
import type { AreaComparison, AreaComparisonSide } from "../src/lib/area-compare";
import { getDictionary } from "../src/i18n";

function side(
  name: string,
  slug: string,
  stats: NonNullable<AreaComparisonSide["stats"]> | null,
  minPriceAed: number,
  projectCount = 10,
  unitCount = 100,
): AreaComparisonSide {
  return {
    area: {
      slug,
      name,
      cityLabel: "Dubai",
      projectCount,
      unitCount,
      minPriceAed,
    },
    stats,
  } as AreaComparisonSide;
}

const extras: SideExtras = { familyStockShare: 0.4 };

const cmp = {
  pairSlug: "business-bay-vs-jumeirah-village-circle",
  a: side(
    "Business Bay",
    "business-bay",
    {
      grossYieldPct: 7.2,
      medianPpsqft: 1800,
      medianPrice: 1_500_000,
      appreciationPct: 4,
      saleSample: 2000,
    } as NonNullable<AreaComparisonSide["stats"]>,
    900_000,
    40,
    400,
  ),
  b: side(
    "Jumeirah Village Circle",
    "jumeirah-village-circle",
    {
      grossYieldPct: 6.1,
      medianPpsqft: 1200,
      medianPrice: 900_000,
      appreciationPct: 2,
      saleSample: 800,
    } as NonNullable<AreaComparisonSide["stats"]>,
    550_000,
    20,
    200,
  ),
} as AreaComparison;

test.describe("area compare decision locale (#357)", () => {
  test("EN buildPros stays byte-identical to prior hard-coded copy", () => {
    const en = getDictionary("en");
    const pros = buildPros(cmp.a, cmp.b, extras, en);
    expect(pros).toContain("Higher gross rental yield — 7.2% vs 6.1%");
    expect(pros.some((p) => p.startsWith("More live off-plan supply"))).toBe(
      true,
    );
    expect(pros.some((p) => p.includes("villa/townhouse stock"))).toBe(true);
  });

  test("AR buildPros / suitability / FAQs use Arabic templates", () => {
    const ar = getDictionary("ar");
    const pros = buildPros(cmp.a, cmp.b, extras, ar);
    expect(pros.some((p) => p.includes("عائد إيجاري"))).toBe(true);
    expect(pros.join(" ")).not.toContain("Higher gross rental yield");

    const suit = buildSuitability(cmp.a, cmp.b, extras, ar);
    expect(suit.some((s) => s.profile === "مستثمرو العائد")).toBe(true);
    expect(suit.map((s) => s.profile).join(" ")).not.toContain(
      "Yield investors",
    );

    const faqs = buildComparisonFaqs(cmp, ar);
    expect(faqs.length).toBeGreaterThan(0);
    expect(faqs.some((f) => f.q.includes("العائد"))).toBe(true);
    expect(faqs.map((f) => f.q).join(" ")).not.toContain(
      "Which has the better rental yield",
    );
  });

  test("default dict (omit arg) keeps EN FAQ wording", () => {
    const faqs = buildComparisonFaqs(cmp);
    expect(faqs[0]?.q).toContain("Which has the better rental yield");
  });
});
