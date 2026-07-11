import { test, expect } from "@playwright/test";
import { paginationRange } from "../src/lib/pagination";

// Pure model test — no browser needed (compiles with the suite, runs fast).
test.describe("paginationRange (windowing)", () => {
  const cases: Array<{ page: number; total: number; want: (number | "ellipsis")[] }> = [
    { page: 1, total: 1, want: [1] },
    { page: 3, total: 5, want: [1, 2, 3, 4, 5] },
    { page: 1, total: 7, want: [1, 2, 3, 4, 5, 6, 7] },
    { page: 1, total: 10, want: [1, 2, 3, 4, 5, "ellipsis", 10] },
    { page: 3, total: 10, want: [1, 2, 3, 4, 5, "ellipsis", 10] },
    { page: 4, total: 10, want: [1, "ellipsis", 3, 4, 5, "ellipsis", 10] },
    { page: 5, total: 10, want: [1, "ellipsis", 4, 5, 6, "ellipsis", 10] },
    { page: 10, total: 10, want: [1, "ellipsis", 6, 7, 8, 9, 10] },
    { page: 8, total: 10, want: [1, "ellipsis", 6, 7, 8, 9, 10] },
    // out-of-range inputs clamp
    { page: 0, total: 10, want: [1, 2, 3, 4, 5, "ellipsis", 10] },
    { page: 99, total: 10, want: [1, "ellipsis", 6, 7, 8, 9, 10] },
  ];

  for (const { page, total, want } of cases) {
    test(`page ${page} of ${total}`, () => {
      expect(paginationRange(page, total)).toEqual(want);
    });
  }

  test("never exceeds 2*sib+5 items and always includes first + last", () => {
    for (let total = 1; total <= 40; total += 1) {
      for (let page = 1; page <= total; page += 1) {
        const r = paginationRange(page, total);
        expect(r.length).toBeLessThanOrEqual(7);
        expect(r[0]).toBe(1);
        expect(r[r.length - 1]).toBe(total);
        expect(r).toContain(page); // current page is always visible
      }
    }
  });
});
