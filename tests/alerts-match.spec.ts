/**
 * Pure table-driven spec for the saved-search alert matcher
 * (src/lib/alerts/match.ts) — no browser, no DB. Pattern follows
 * tests/smart-query.spec.ts.
 */
import { test, expect } from "./fixtures";
import {
  projectMatchesFilters,
  sanitizeSavedSearchFilters,
  savedSearchPath,
  serializeFilters,
  type AlertProject,
  type SavedSearchFilters,
} from "../src/lib/alerts/match";
import type { ProjectFilters } from "../src/lib/types";

function makeProject(overrides: Partial<AlertProject> = {}): AlertProject {
  return {
    name: "Marina Vista",
    developer: "Emaar Properties",
    area: "Dubai Marina",
    city: "dubai",
    units: [
      { beds: 1, propertyType: "apartment", launchPriceAed: 1_200_000 },
      { beds: 2, propertyType: "apartment", launchPriceAed: 2_100_000 },
    ],
    ...overrides,
  };
}

interface Case {
  name: string;
  project?: Partial<AlertProject>;
  filters: SavedSearchFilters;
  expected: boolean;
}

const CASES: Case[] = [
  { name: "empty filters match everything", filters: {}, expected: true },
  { name: "city match", filters: { city: "dubai" }, expected: true },
  { name: "city mismatch", filters: { city: "abu-dhabi" }, expected: false },
  { name: "city 'all' is a no-op", filters: { city: "all" }, expected: true },
  {
    name: "developer slug match",
    filters: { dev: "emaar-properties" },
    expected: true,
  },
  { name: "developer slug mismatch", filters: { dev: "damac" }, expected: false },
  {
    name: "q substring against project name (case-insensitive)",
    filters: { q: "marina VISTA" },
    expected: true,
  },
  { name: "q substring against developer", filters: { q: "emaar" }, expected: true },
  { name: "q substring against area", filters: { q: "dubai marina" }, expected: true },
  { name: "q no match", filters: { q: "palm jumeirah" }, expected: false },
  { name: "beds: any unit matches", filters: { beds: "2" }, expected: true },
  { name: "beds: no unit matches", filters: { beds: "4" }, expected: false },
  {
    name: "beds studio only matches 0-bed units",
    filters: { beds: "studio" },
    expected: false,
  },
  {
    name: "beds studio matches a 0-bed unit",
    project: { units: [{ beds: 0, propertyType: "apartment", launchPriceAed: 800_000 }] },
    filters: { beds: "studio" },
    expected: true,
  },
  {
    name: "beds 5 means 5+",
    project: { units: [{ beds: 6, propertyType: "villa", launchPriceAed: 9_000_000 }] },
    filters: { beds: "5" },
    expected: true,
  },
  { name: "type match", filters: { type: "apartment" }, expected: true },
  { name: "type mismatch", filters: { type: "villa" }, expected: false },
  { name: "minP: some unit above floor", filters: { minP: "2000000" }, expected: true },
  { name: "minP: all units below floor", filters: { minP: "3000000" }, expected: false },
  { name: "maxP: some unit under cap", filters: { maxP: "1500000" }, expected: true },
  { name: "maxP: all units above cap", filters: { maxP: "1000000" }, expected: false },
  {
    name: "combined unit predicates must hold on the SAME unit",
    // 1-bed is 1.2M, 2-bed is 2.1M — "2 beds under 1.5M" has no single unit.
    filters: { beds: "2", maxP: "1500000" },
    expected: false,
  },
  {
    name: "combined unit + project predicates",
    filters: { city: "dubai", dev: "emaar-properties", beds: "1", maxP: "1500000" },
    expected: true,
  },
  {
    name: "unknown params (pay/handover/amen) are ignored, not exclusionary",
    filters: { pay: "post-handover", handover: "2027", amen: "Gym" },
    expected: true,
  },
  {
    name: "project without unit rows fails unit-scoped searches",
    project: { units: [] },
    filters: { beds: "1" },
    expected: false,
  },
  {
    name: "project without unit rows still matches project-scoped searches",
    project: { units: [] },
    filters: { city: "dubai" },
    expected: true,
  },
];

test.describe("projectMatchesFilters", () => {
  for (const c of CASES) {
    test(c.name, () => {
      expect(projectMatchesFilters(makeProject(c.project), c.filters)).toBe(c.expected);
    });
  }
});

test.describe("sanitizeSavedSearchFilters", () => {
  test("drops unknown keys, empty strings, and non-strings", () => {
    expect(
      sanitizeSavedSearchFilters({
        q: " marina ",
        city: "dubai",
        beds: "",
        minP: 1000000,
        evil: "1; DROP TABLE",
      }),
    ).toEqual({ q: "marina", city: "dubai" });
  });

  test("non-object input yields empty filters", () => {
    expect(sanitizeSavedSearchFilters(null)).toEqual({});
    expect(sanitizeSavedSearchFilters("q=x")).toEqual({});
  });
});

test.describe("serializeFilters", () => {
  test("mirrors the SERP URL param vocabulary", () => {
    const filters: ProjectFilters = {
      query: "marina",
      city: "dubai",
      propertyType: "apartment",
      beds: "studio",
      minPrice: 500_000,
      maxPrice: 2_000_000,
      developer: "emaar-properties",
      paymentPlan: "post-handover",
      handoverBy: 2027,
      amenities: ["Gym", "Pool"],
    };
    expect(serializeFilters(filters)).toEqual({
      q: "marina",
      city: "dubai",
      type: "apartment",
      beds: "studio",
      minP: "500000",
      maxP: "2000000",
      dev: "emaar-properties",
      pay: "post-handover",
      handover: "2027",
      amen: "Gym,Pool",
    });
  });

  test("defaults serialize to an empty object", () => {
    const filters: ProjectFilters = {
      query: "",
      city: "all",
      propertyType: "all",
      beds: "all",
      minPrice: null,
      maxPrice: null,
      developer: "all",
      paymentPlan: "all",
      handoverBy: "all",
      amenities: [],
    };
    expect(serializeFilters(filters)).toEqual({});
  });
});

test.describe("savedSearchPath", () => {
  test("builds an EN SERP deep link", () => {
    expect(savedSearchPath({ city: "dubai", beds: "2" })).toBe(
      "/projects?city=dubai&beds=2",
    );
  });
  test("builds an AR SERP deep link", () => {
    expect(savedSearchPath({ q: "marina" }, "ar")).toBe("/ar/projects?q=marina");
  });
  test("no params → bare path", () => {
    expect(savedSearchPath({})).toBe("/projects");
  });
});
