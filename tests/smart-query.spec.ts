import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "./fixtures";
import { createCatalogApi, type CatalogFile } from "../src/lib/catalog-core";
import { buildSuggestIndex, normText } from "../src/lib/suggest-index";
import {
  parseSmartQuery,
  type MatchedEntity,
  type SmartQueryResult,
} from "../src/lib/smart-query";

const raw = JSON.parse(
  readFileSync(join(process.cwd(), "data", "catalog.json"), "utf8"),
) as CatalogFile;
const index = buildSuggestIndex(createCatalogApi(raw));

interface Case {
  name: string;
  input: string;
  filters?: SmartQueryResult["filters"];
  intent?: "yield" | null;
  matched?: Array<Pick<MatchedEntity, "kind" | "slug">>;
  residual?: string;
}

const CASES: Case[] = [
  {
    name: "JVC alias + under 1M",
    input: "JVC under 1M",
    filters: { city: "dubai", maxPrice: 1_000_000 },
    matched: [{ kind: "community", slug: "jumeirah-village-circle" }],
    residual: "",
  },
  {
    name: "beds + developer + community + suffix-distributed range",
    input: "2br emaar downtown 1-2m",
    filters: { city: "dubai", beds: 2, minPrice: 1_000_000, maxPrice: 2_000_000 },
    matched: [
      { kind: "developer", slug: "emaar-properties" },
      { kind: "community", slug: "downtown-dubai" },
    ],
    residual: "",
  },
  {
    name: "studio + post-handover + handover year",
    input: "studio post handover by 2027",
    filters: { beds: "studio", paymentPlan: "post-handover", handoverBy: 2027 },
    residual: "",
  },
  {
    name: "type + multiword community with digit + max price",
    input: "villas in damac hills 2 under 3m",
    filters: { city: "dubai", propertyType: "villa", maxPrice: 3_000_000 },
    matched: [{ kind: "community", slug: "damac-hills-2" }],
    residual: "",
  },
  {
    name: "yield intent",
    input: "high yield",
    filters: {},
    intent: "yield",
    residual: "",
  },
  {
    name: "arabic: under a million",
    input: "عقارات تحت مليون",
    filters: { maxPrice: 1_000_000 },
    residual: "",
  },
  {
    name: "arabic: apartment in dubai marina",
    input: "شقة في دبي مارينا",
    filters: { city: "dubai", propertyType: "apartment" },
    matched: [{ kind: "community", slug: "dubai-marina" }],
    residual: "",
  },
  {
    name: "plain project prefix match",
    input: "azizi venice",
    matched: [{ kind: "project", slug: "azizi-venice-15" }],
    residual: "",
  },
  {
    name: "garbage → all residual",
    input: "xyzzy",
    filters: {},
    intent: null,
    matched: [],
    residual: "xyzzy",
  },
  {
    name: "empty string",
    input: "",
    filters: {},
    intent: null,
    matched: [],
    residual: "",
  },
  {
    name: "bare max price with k magnitude",
    input: "under 500k",
    filters: { maxPrice: 500_000 },
    matched: [],
    residual: "",
  },
  {
    name: "type + min price",
    input: "penthouse over 5m",
    filters: { propertyType: "penthouse", minPrice: 5_000_000 },
    matched: [],
    residual: "",
  },
  {
    name: "arabic-indic digits + beds",
    input: "٣ غرف في دبي",
    filters: { beds: 3, city: "dubai" },
    matched: [{ kind: "city", slug: "dubai" }],
    residual: "",
  },
  {
    name: "between range with magnitudes",
    input: "apartments between 800k and 1.5m in jvt",
    filters: {
      propertyType: "apartment",
      minPrice: 800_000,
      maxPrice: 1_500_000,
      city: "dubai",
    },
    matched: [{ kind: "community", slug: "jumeirah-village-triangle" }],
    residual: "",
  },
];

test.describe("parseSmartQuery", () => {
  for (const c of CASES) {
    test(c.name, () => {
      const result = parseSmartQuery(c.input, index);
      if (c.filters) expect(result.filters).toEqual(c.filters);
      if (c.intent !== undefined) expect(result.intent).toBe(c.intent);
      if (c.matched) {
        expect(
          result.matched.map(({ kind, slug }) => ({ kind, slug })),
        ).toEqual(c.matched);
      }
      if (c.residual !== undefined) expect(result.residual).toBe(c.residual);
    });
  }
});

test.describe("buildSuggestIndex", () => {
  test("normText strips diacritics and lowercases", () => {
    expect(normText("Émaar  Béach")).toBe("emaar beach");
    expect(normText("إعمار")).toBe("اعمار");
  });

  test("index has projects, communities, developers with norms", () => {
    expect(index.projects.length).toBeGreaterThan(100);
    expect(index.communities.length).toBeGreaterThan(50);
    expect(index.developers.length).toBeGreaterThan(5);
    const jvc = index.communities.find((c) => c.slug === "jumeirah-village-circle");
    expect(jvc?.city).toBe("dubai");
    expect(jvc?.projectCount).toBeGreaterThan(0);
    for (const p of index.projects.slice(0, 5)) {
      expect(p.norm).toBe(normText(p.name));
    }
  });
});
