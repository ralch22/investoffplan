import { test, expect } from "./fixtures";
import { googleMapsAreaSearchUrl } from "../src/lib/format";
import { getDictionary } from "../src/i18n";

// #381 — maps search fallback must use project city, not hard-coded Dubai UAE.
test.describe("googleMapsAreaSearchUrl (#381)", () => {
  test("non-Dubai EN query uses emirate label, not forced Dubai UAE only", () => {
    const url = googleMapsAreaSearchUrl("Al Marjan Island", "rak");
    const q = decodeURIComponent(url.split("/search/")[1] ?? "");
    expect(q).toContain("Al Marjan Island");
    expect(q).toContain("Ras Al Khaimah");
    expect(q).toContain("UAE");
    expect(q).not.toBe("Al Marjan Island Dubai UAE");
    expect(q.includes("Dubai")).toBe(false);
  });

  test("Abu Dhabi + AR dict uses Arabic city/country chrome", () => {
    const dict = getDictionary("ar");
    const url = googleMapsAreaSearchUrl("Yas Island", "abu-dhabi", dict);
    const q = decodeURIComponent(url.split("/search/")[1] ?? "");
    expect(q).toContain("Yas Island");
    expect(q).toContain("أبوظبي");
    expect(q).toContain("الإمارات");
    expect(q).not.toContain("Dubai");
  });

  test("Dubai EN still resolves with city + UAE", () => {
    const url = googleMapsAreaSearchUrl("Jumeirah Village Circle", "dubai");
    const q = decodeURIComponent(url.split("/search/")[1] ?? "");
    expect(q).toContain("Jumeirah Village Circle");
    expect(q).toContain("Dubai");
    expect(q).toContain("UAE");
  });
});
