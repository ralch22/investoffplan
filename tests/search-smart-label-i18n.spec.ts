import { test, expect } from "./fixtures";
import { getDictionary } from "../src/i18n";
import { smartLabel } from "../src/components/search/search-suggest";
import type { SmartQueryResult } from "../src/lib/smart-query";

/**
 * #338 — smart-query suggestion chrome hard-coded EN for
 * under/over/by/post-handover on AR. Pure unit coverage; prefer CI e2e suite.
 * Do not dual-push #301.
 */

function emptyParse(overrides: Partial<SmartQueryResult> = {}): SmartQueryResult {
  return {
    filters: {},
    matched: [],
    residual: "",
    ...overrides,
  };
}

test.describe("search smartLabel i18n (discovery residual)", () => {
  test("EN labels stay byte-identical to prior hard-coded chrome", () => {
    const dict = getDictionary("en");
    const label = smartLabel(
      emptyParse({
        filters: {
          maxPrice: 1_000_000,
          paymentPlan: "post-handover",
          handoverBy: 2027,
          propertyType: "apartment",
        },
      }),
      dict,
      "en",
    );
    expect(label).toContain("under AED 1M");
    expect(label).toContain("by 2027");
    expect(label).toContain("post-handover");
    expect(label).toContain("Apartment");
  });

  test("AR smart row uses Arabic under/over/by/post-handover + property type", () => {
    const dict = getDictionary("ar");
    const under = smartLabel(
      emptyParse({ filters: { maxPrice: 2_000_000 } }),
      dict,
      "ar",
    );
    expect(under).toMatch(/أقل من/);
    expect(under).not.toMatch(/\bunder\b/i);

    const over = smartLabel(
      emptyParse({ filters: { minPrice: 500_000 } }),
      dict,
      "ar",
    );
    expect(over).toMatch(/أكثر من/);
    expect(over).not.toMatch(/\bover\b/i);

    const by = smartLabel(
      emptyParse({ filters: { handoverBy: 2028 } }),
      dict,
      "ar",
    );
    expect(by).toMatch(/بحلول/);
    expect(by).not.toMatch(/\bby 2028\b/i);

    const plan = smartLabel(
      emptyParse({ filters: { paymentPlan: "post-handover" } }),
      dict,
      "ar",
    );
    expect(plan).toBe(dict.nav.suggest.smartPostHandover);
    expect(plan).not.toBe("post-handover");

    const type = smartLabel(
      emptyParse({ filters: { propertyType: "villa" } }),
      dict,
      "ar",
    );
    expect(type).toBe(dict.serp.filters.villa);
    expect(type).not.toBe("Villa");
  });
});
