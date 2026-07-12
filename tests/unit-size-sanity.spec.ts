import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "./fixtures";
import {
  createCatalogApi,
  isPlausibleUnitSqft,
  sanitizeUnitSizes,
  sanitizeUnitSqft,
  unitSqftBand,
  type CatalogFile,
} from "../src/lib/catalog-core";
import {
  formatFromPrice,
  formatLaunchPrice,
  formatPricePerSqft,
  formatSqft,
  fromPriceLabel,
  launchPriceLabel,
  pricePerSqftLabel,
  sqftLabel,
} from "../src/lib/format";
import { pricePerSqft } from "../src/lib/investment-metrics";
import { getDictionary } from "../src/i18n";

test.describe("unitSqftBand thresholds", () => {
  test("apartment studio–3BR tops out at 6_000", () => {
    expect(unitSqftBand("apartment", 0).max).toBe(6_000);
    expect(unitSqftBand("apartment", 3).max).toBe(6_000);
  });

  test("villa band keeps 20–35k mansions", () => {
    const band = unitSqftBand("villa", 7);
    expect(band.min).toBe(150);
    expect(band.max).toBe(40_000);
    expect(isPlausibleUnitSqft(35_000, "villa", 7)).toBe(true);
    expect(isPlausibleUnitSqft(20_000, "villa", 6)).toBe(true);
  });

  test("penthouse allows up to 20k", () => {
    expect(unitSqftBand("penthouse", 4).max).toBe(20_000);
    expect(isPlausibleUnitSqft(15_328, "penthouse", 5)).toBe(true);
  });
});

test.describe("sanitizeUnitSqft / sanitizeUnitSizes", () => {
  test("nulls the beachfront-gates-2 style 1e6 apartment outlier", () => {
    expect(sanitizeUnitSqft(1_000_000, "apartment", 3)).toBe(0);
    const unit = sanitizeUnitSizes({
      beds: 3,
      propertyType: "apartment",
      sqftMin: 1_000_000,
    });
    expect(unit.sqftMin).toBe(0);
    expect(unit.sqftMax).toBeUndefined();
  });

  test("keeps real large villa sizes within the villa band", () => {
    const unit = sanitizeUnitSizes({
      beds: 7,
      propertyType: "villa",
      sqftMin: 35_845,
    });
    expect(unit.sqftMin).toBe(35_845);
  });

  test("drops absurd max while keeping a sane min", () => {
    const unit = sanitizeUnitSizes({
      beds: 1,
      propertyType: "apartment",
      sqftMin: 549,
      sqftMax: 917_122,
    });
    expect(unit.sqftMin).toBe(549);
    expect(unit.sqftMax).toBeUndefined();
  });

  test("zeros sub-habitable sizes", () => {
    expect(sanitizeUnitSqft(50, "apartment", 0)).toBe(0);
    expect(sanitizeUnitSqft(0, "villa", 5)).toBe(0);
  });

  test("villa max above 40k is rejected; min in band is kept", () => {
    const unit = sanitizeUnitSizes({
      beds: 8,
      propertyType: "villa",
      sqftMin: 21_635,
      sqftMax: 71_009,
    });
    expect(unit.sqftMin).toBe(21_635);
    expect(unit.sqftMax).toBeUndefined();
  });
});

test.describe("pricePerSqft + formatSqft safety nets", () => {
  test("pricePerSqft returns null for absurd sizes", () => {
    expect(pricePerSqft(1_950, 1_000_000)).toBeNull();
    expect(pricePerSqft(2_000_000, 100)).toBeNull();
    expect(pricePerSqft(2_000_000, 1_000)).toBe(2_000);
  });

  test("formatSqft never renders 1e6", () => {
    expect(formatSqft(1_000_000)).toBe("—");
    expect(formatSqft(549, 917_122)).toBe("549 sqft");
    expect(formatSqft(35_845)).toBe("35,845 sqft");
  });

  // #324 — locale-aware labels: EN byte-stable vs legacy helpers; AR uses dict.
  test("sqftLabel / fromPriceLabel / launchPriceLabel EN match legacy helpers", () => {
    const en = getDictionary("en");
    expect(sqftLabel(1_000_000, undefined, en)).toBe(formatSqft(1_000_000));
    expect(sqftLabel(549, 917_122, en)).toBe(formatSqft(549, 917_122));
    expect(sqftLabel(35_845, undefined, en)).toBe(formatSqft(35_845));
    expect(sqftLabel(800, 1_200, en)).toBe(formatSqft(800, 1_200));

    expect(fromPriceLabel(0, undefined, "AED", en)).toBe(
      formatFromPrice(0, undefined, "AED"),
    );
    expect(fromPriceLabel(1_500_000, undefined, "AED", en)).toBe(
      formatFromPrice(1_500_000, undefined, "AED"),
    );
    expect(fromPriceLabel(1_000_000, 2_000_000, "AED", en)).toBe(
      formatFromPrice(1_000_000, 2_000_000, "AED"),
    );

    expect(launchPriceLabel(0, undefined, "AED", en)).toBe(
      formatLaunchPrice(0, undefined, "AED"),
    );
    expect(launchPriceLabel(2_500_000, undefined, "AED", en)).toBe(
      formatLaunchPrice(2_500_000, undefined, "AED"),
    );
    expect(pricePerSqftLabel(1_200, "AED", en)).toBe(
      formatPricePerSqft(1_200, "AED"),
    );
  });

  test("sqftLabel / fromPriceLabel AR use Arabic chrome (not EN sqft/FROM)", () => {
    const ar = getDictionary("ar");
    expect(sqftLabel(549, undefined, ar)).toContain("قدم");
    expect(sqftLabel(549, undefined, ar)).not.toMatch(/sqft/i);
    expect(sqftLabel(800, 1_200, ar)).toContain("قدم");
    expect(fromPriceLabel(0, undefined, "AED", ar)).toBe(ar.pdp.priceOnRequest);
    expect(fromPriceLabel(0, undefined, "AED", ar)).not.toBe("Price on request");
    expect(fromPriceLabel(1_500_000, undefined, "AED", ar)).toContain(
      ar.format.fromUpper,
    );
    expect(fromPriceLabel(1_500_000, undefined, "AED", ar)).not.toMatch(/^FROM /);
    expect(launchPriceLabel(0, undefined, "AED", ar)).toBe(ar.pdp.priceOnRequest);
    const ppsf = pricePerSqftLabel(1_200, "AED", ar);
    expect(ppsf).toBeTruthy();
    expect(ppsf!).toContain("قدم");
    expect(ppsf!).not.toMatch(/\/sqft$/i);
  });
});

test.describe("createCatalogApi applies size gate end-to-end", () => {
  test("beachfront-gates-2 unit no longer surfaces 1e6 sqft", () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "data", "catalog.json"), "utf8"),
    ) as CatalogFile;
    const api = createCatalogApi(raw);
    const project = api.getProjectBySlug("beachfront-gates-2");
    expect(project).toBeTruthy();
    for (const u of project!.units) {
      expect(u.sqftMin).toBeLessThanOrEqual(40_000);
      if (u.propertyType === "apartment" && u.beds <= 3) {
        expect(u.sqftMin === 0 || u.sqftMin <= 6_000).toBe(true);
      }
    }
    const million = api.units.filter(
      (u) => u.projectSlug === "beachfront-gates-2" && u.sqftMin >= 100_000,
    );
    expect(million).toHaveLength(0);
    const flat = api
      .flattenCatalogUnits()
      .filter((i) => i.project.slug === "beachfront-gates-2");
    for (const item of flat) {
      expect(item.unit.sqftMin).toBeLessThan(100_000);
      expect(pricePerSqft(item.unit.launchPriceAed, item.unit.sqftMin)).not.toBe(
        // 0-rounded ppsf from 1e6 would be the bug; null or real number is fine
        0,
      );
    }
  });

  test("large villas in the 20–35k band still pass through", () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "data", "catalog.json"), "utf8"),
    ) as CatalogFile;
    const api = createCatalogApi(raw);
    const largeVillas = api.units.filter(
      (u) =>
        u.propertyType === "villa" &&
        u.sqftMin >= 20_000 &&
        u.sqftMin <= 35_000,
    );
    expect(largeVillas.length).toBeGreaterThan(0);
  });
});
