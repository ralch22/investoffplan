import { test, expect } from "./fixtures";
import {
  buildDeveloperItemListJsonLd,
  buildProjectJsonLd,
  buildProjectsItemListJsonLd,
} from "../src/lib/project-json-ld";
import type { Project, UnitType } from "../src/lib/types";
import { localePath } from "../src/i18n/config";

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
  const units = partial.units ?? [unit({ id: "u1" })];
  return {
    id: "p1",
    slug: "sample-residences",
    name: "Sample Residences",
    developer: "Emaar Properties",
    developerInitials: "EP",
    area: "Downtown Dubai",
    city: "dubai",
    handover: "Q4 2028",
    paymentPlan: "60/40",
    status: "off-plan",
    isPremium: false,
    unitCount: units.length,
    whatsapp: "971500000000",
    units,
    brochureUrl: "/cdn/projects/sample-residences/brochure.pdf",
    ...partial,
  };
}

const siteUrl = "https://investoffplan.com";

test.describe("JSON-LD locale honesty (#343)", () => {
  test("buildDeveloperItemListJsonLd defaults to EN /projects/*", () => {
    const ld = buildDeveloperItemListJsonLd({
      developer: { name: "Emaar Properties" },
      projects: [{ name: "Sample", slug: "sample-residences" }],
      developerUrl: `${siteUrl}/developers/emaar-properties`,
      siteUrl,
    });
    expect(ld.mainEntity.itemListElement[0].url).toBe(
      `${siteUrl}/projects/sample-residences`,
    );
    expect(ld.name).toContain("New & Off-Plan Projects by");
  });

  test("buildDeveloperItemListJsonLd accepts AR projectUrlFor + name", () => {
    const abs = (href: string) => `${siteUrl}${localePath("ar", href)}`;
    const ld = buildDeveloperItemListJsonLd({
      developer: { name: "Emaar Properties" },
      projects: [
        { name: "Sample", slug: "sample-residences" },
        { name: "Other", slug: "other-project" },
      ],
      developerUrl: abs("/developers/emaar-properties"),
      siteUrl,
      name: "مشاريع جديدة وعلى الخارطة من Emaar Properties",
      projectUrlFor: (slug) => abs(`/projects/${slug}`),
    });
    for (const item of ld.mainEntity.itemListElement as Array<{ url: string }>) {
      expect(item.url).toContain("/ar/projects/");
      expect(item.url).not.toMatch(
        new RegExp(`${siteUrl.replace(/\./g, "\\.")}/projects/`),
      );
    }
    expect(ld.name).toMatch(/مشاريع/);
    expect(ld.url).toContain("/ar/developers/");
  });

  test("buildProjectsItemListJsonLd peer accepts projectUrlFor", () => {
    const abs = (href: string) => `${siteUrl}${localePath("ar", href)}`;
    const ld = buildProjectsItemListJsonLd({
      projects: [project()],
      pageUrl: abs("/projects"),
      siteUrl,
      projectUrlFor: (slug) => abs(`/projects/${slug}`),
      name: "المشاريع الجديدة على الخارطة في الإمارات",
    });
    expect(ld).toBeTruthy();
    expect(ld!.mainEntity.itemListElement[0].url).toBe(
      `${siteUrl}/ar/projects/sample-residences`,
    );
  });

  test("buildProjectJsonLd PropertyValue names default EN", () => {
    const ld = buildProjectJsonLd({
      project: project(),
      projectUrl: `${siteUrl}/projects/sample-residences`,
      siteUrl,
      minPrice: 1_200_000,
      gallery: [],
    });
    const props = ld.additionalProperty as Array<{ name: string; value: string }>;
    const names = props.map((p) => p.name);
    expect(names).toContain("Handover");
    expect(names).toContain("Payment plan");
    expect(names).toContain("Brochure");
  });

  test("buildProjectJsonLd accepts localized PropertyValue names", () => {
    const ld = buildProjectJsonLd({
      project: project(),
      projectUrl: `${siteUrl}/ar/projects/sample-residences`,
      siteUrl,
      minPrice: 1_200_000,
      gallery: [],
      propertyNames: {
        handover: "التسليم",
        paymentPlan: "خطة السداد",
        brochure: "البروشور",
      },
    });
    const props = ld.additionalProperty as Array<{ name: string }>;
    const names = props.map((p) => p.name);
    expect(names).toContain("التسليم");
    expect(names).toContain("خطة السداد");
    expect(names).toContain("البروشور");
    expect(names).not.toContain("Handover");
    expect(names).not.toContain("Payment plan");
    expect(names).not.toContain("Brochure");
  });
});
