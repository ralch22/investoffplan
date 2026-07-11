import { test, expect } from "./fixtures";

// Regression guard: no horizontal scroll at mobile width. A grid with responsive
// column counts (e.g. `grid lg:grid-cols-3`) but NO base `grid-cols-1` sizes its
// single implicit column to the content max-content on mobile, overflowing the
// viewport. This asserts document.scrollWidth stays within the viewport.
const MOBILE = { width: 375, height: 812 };
const PAGES = ["/", "/projects", "/developers", "/tools/roi", "/communities"];

test.describe("Mobile — no horizontal overflow", () => {
  for (const path of PAGES) {
    test(`${path} does not scroll horizontally at 375px`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Let layout settle (fonts/images can nudge width briefly).
      await page.waitForTimeout(400);
      const { scrollW, clientW } = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      // 2px tolerance for sub-pixel rounding.
      expect(scrollW, `${path}: ${scrollW}px content in ${clientW}px viewport`).toBeLessThanOrEqual(
        clientW + 2,
      );
    });
  }
});
