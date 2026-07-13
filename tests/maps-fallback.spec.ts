import { test, expect } from "./fixtures";
import { googleMapsSearchQuery } from "../src/lib/format";
import { getDictionary } from "../src/i18n";

test.describe("Google Maps search fallback (#381)", () => {
  test("uses project emirate — never forces Dubai UAE for non-Dubai cities", () => {
    const en = getDictionary("en");
    const rak = googleMapsSearchQuery("Al Marjan Island", "rak", en);
    expect(rak).toContain("Al Marjan Island");
    expect(rak).toContain("Ras Al Khaimah");
    expect(rak).toContain("UAE");
    expect(rak).not.toMatch(/Dubai UAE$/);
    expect(rak.includes("Dubai")).toBe(false);

    const abu = googleMapsSearchQuery("Yas Island", "abu-dhabi", en);
    expect(abu).toContain("Abu Dhabi");
    expect(abu).not.toContain("Dubai");

    // Dubai projects still resolve sensibly.
    const dxb = googleMapsSearchQuery("Business Bay", "dubai", en);
    expect(dxb).toBe("Business Bay Dubai UAE");
  });

  test("AR city label is used when dict is Arabic", () => {
    const ar = getDictionary("ar");
    const q = googleMapsSearchQuery("الشارقة", "sharjah", ar);
    expect(q).toContain("الشارقة");
    expect(q).not.toContain("Dubai");
  });
});
