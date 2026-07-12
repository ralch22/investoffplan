import { test, expect } from "@playwright/test";
import { hasPaymentPlan, parsePaymentPlan } from "../src/lib/investment-metrics";

test.describe("hasPaymentPlan", () => {
  const truthy: string[] = [
    "20/40/40",
    "10/70/20",
    "5 / 30 / 65",
    "10/35/5/50",
    "2 Payment Plans",
    "Flexible terms",
  ];
  for (const plan of truthy) {
    test(`accepts real plan ${JSON.stringify(plan)}`, () => {
      expect(hasPaymentPlan(plan)).toBe(true);
    });
  }

  const falsy: Array<string | null | undefined> = [
    "",
    "   ",
    null,
    undefined,
    "Payment Plan",
    "payment plan",
    "PAYMENT PLAN",
    "AED 0",
    "aed 0",
    "AED 0.0",
    "0",
  ];
  for (const plan of falsy) {
    test(`rejects empty/junk ${JSON.stringify(plan)}`, () => {
      expect(hasPaymentPlan(plan)).toBe(false);
    });
  }
});

test.describe("parsePaymentPlan still rejects non-split labels", () => {
  test("numeric splits parse", () => {
    expect(parsePaymentPlan("20/40/40")).toEqual({
      downPaymentPct: 20,
      duringPct: 40,
      handoverPct: 40,
      afterPct: 0,
    });
  });

  test("junk count labels do not fabricate a schedule", () => {
    expect(parsePaymentPlan("2 Payment Plans")).toBeNull();
    expect(parsePaymentPlan("Payment Plan")).toBeNull();
    expect(parsePaymentPlan("")).toBeNull();
  });
});
