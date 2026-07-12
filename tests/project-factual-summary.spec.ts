import { test, expect } from "./fixtures";
import { buildFactualSummary } from "../src/lib/project-factual-summary";
import type { Project, UnitType } from "../src/lib/types";

function unit(partial: Partial<UnitType> & Pick<UnitType, "id">): UnitType {
  return {
    beds: 1,
    sqftMin: 800,
    launchPriceAed: 1_200_000,
    propertyType: "apartment",
    ...partial,
  };
}

function project(partial: Partial<Project> = {}): Project {
  const units = partial.units ?? [
    unit({ id: "u1", beds: 1 }),
    unit({ id: "u2", beds: 2, launchPriceAed: 1_800_000 }),
  ];
  return {
    id: "p1",
    slug: "sample-residences",
    name: "Sample Residences",
    developer: "ARADA",
    developerInitials: "AR",
    area: "Aljada, Sharjah",
    city: "sharjah",
    handover: "Q4 2028",
    paymentPlan: "60/40",
    status: "off-plan",
    isPremium: false,
    unitCount: units.length,
    whatsapp: "971500000000",
    units,
    ...partial,
  };
}

test.describe("buildFactualSummary (thin PDP About fallback)", () => {
  test("returns undefined without a project name", () => {
    expect(buildFactualSummary(project({ name: "" }))).toBeUndefined();
    expect(buildFactualSummary(project({ name: "   " }))).toBeUndefined();
  });

  test("composes verified-claims sentences for a full thin project", () => {
    const summary = buildFactualSummary(project());
    expect(summary).toBeTruthy();
    expect(summary!).toContain("Sample Residences");
    expect(summary!).toContain("ARADA");
    expect(summary!).toMatch(/Aljada/);
    expect(summary!).toMatch(/60\/40/);
    expect(summary!).toMatch(/Q4 2028/);
    // Inventory sentence from beds range
    expect(summary!).toMatch(/1 Bed/i);
    expect(summary!).toMatch(/2 Beds/i);
    // Never invents empty / zero placeholders
    expect(summary!).not.toMatch(/AED 0/);
    expect(summary!).not.toMatch(/undefined/);
  });

  test("drops price clause when all unit prices are zero", () => {
    const summary = buildFactualSummary(
      project({
        units: [
          unit({ id: "u1", launchPriceAed: 0 }),
          unit({ id: "u2", beds: 2, launchPriceAed: 0 }),
        ],
      }),
    );
    expect(summary).toBeTruthy();
    expect(summary!).toContain("60/40");
    expect(summary!).not.toMatch(/Launch prices start/);
  });

  test("localizes intro into Arabic without inventing fields", () => {
    const summary = buildFactualSummary(project(), "ar");
    expect(summary).toBeTruthy();
    expect(summary!).toMatch(/مشروع/);
    expect(summary!).toContain("Sample Residences");
    expect(summary!).toContain("ARADA");
  });

  test("single bedroom band uses inventorySingle template", () => {
    const summary = buildFactualSummary(
      project({
        units: [unit({ id: "u1", beds: 0, propertyType: "apartment" })],
      }),
    );
    expect(summary).toMatch(/Studio/i);
    expect(summary!).not.toMatch(/to Studio/i);
  });
});
