import { test, expect } from "@playwright/test";

/**
 * #228 — cookie banner must not cover CompareBar / bottom tabs at 375px.
 * Default fixtures pre-deny consent; this file uses a fresh context without
 * that seed so the banner actually renders.
 */
test.use({
  viewport: { width: 375, height: 812 },
});

test.describe("Cookie consent chrome offset (#228)", () => {
  test("publishes measured --consent-h and lifts bottom tabs", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    // No iop_consent seed → banner should show.
    await page.goto("/projects", { waitUntil: "domcontentloaded" });

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible({ timeout: 15_000 });

    // ResizeObserver publishes height after paint.
    await page.waitForFunction(() => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--consent-h")
        .trim();
      const px = parseFloat(raw);
      return Number.isFinite(px) && px > 80; // multi-line mobile > hardcoded 72
    });

    const consentH = await page.evaluate(() =>
      parseFloat(
        getComputedStyle(document.documentElement)
          .getPropertyValue("--consent-h")
          .trim(),
      ),
    );
    expect(consentH).toBeGreaterThan(80);

    const tabBar = page.locator('nav[aria-label]').filter({ hasText: /Explore|استكشف/i }).first();
    await expect(tabBar).toBeVisible();
    const tabBox = await tabBar.boundingBox();
    const bannerBox = await banner.boundingBox();
    expect(tabBox).toBeTruthy();
    expect(bannerBox).toBeTruthy();
    // Tabs sit above the banner (no full vertical overlap).
    expect(tabBox!.y + tabBox!.height).toBeLessThanOrEqual(bannerBox!.y + 2);

    await context.close();
  });
});
