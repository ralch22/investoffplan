import { test, expect } from "./fixtures";

// AR parity close-out: Arabic home parity + the newly mirrored AR routes.
//
// We assert on the raw SSR HTML response body (`await response.text()`) rather
// than the live DOM. On localhost the global footer's Cloudflare Turnstile
// widget errors (site key bound to investoffplan.com → 110200) and destabilizes
// live-DOM polling on heavy pages. The served HTML is deterministic and immune
// to that post-load instability — exactly what these locale/route checks need.
test.describe("AR close-out", () => {
  test("/ar renders the hero-stat-strip and an Arabic Browse-by-type chip", async ({ page }) => {
    const response = await page.goto("/ar", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);

    const html = await response!.text();

    // In-locale chrome from the AR root layout.
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');

    // The slim hero-stat-strip (Wave 2) now renders on the AR home too.
    expect(html).toContain('data-testid="hero-stat-strip"');

    // "Browse by type" chips render in Arabic (label + a property-type chip).
    expect(html).toContain("تصفّح حسب النوع:");
    expect(html).toContain("شقق");
  });

  test("/ar/tools/roi returns 200", async ({ page }) => {
    const response = await page.goto("/ar/tools/roi", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toContain('lang="ar"');
  });

  test("/ar/tools/investor-match returns 200", async ({ page }) => {
    const response = await page.goto("/ar/tools/investor-match", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    expect(await response!.text()).toContain('lang="ar"');
  });

  test("/ar/favorites returns 200 in-locale", async ({ page }) => {
    const response = await page.goto("/ar/favorites", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    // Stays inside the AR (RTL) tree rather than bouncing to the EN mirror.
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });

  test("a bogus /ar/* URL 404s in-locale (Arabic not-found)", async ({ page }) => {
    const response = await page.goto("/ar/does-not-exist", { waitUntil: "commit" });
    expect(response?.status()).toBe(404);
    const html = await response!.text();
    // The 404 stays IN ARABIC — Arabic not-found title + og:locale + noindex.
    // (Next renders truly-unmatched routes in a global `<html id="__next_error__">`
    // error shell that bypasses the locale layout's lang attribute, so we assert
    // on the Arabic content/metadata that IS present rather than the html lang.)
    expect(html).toContain("الصفحة غير موجودة"); // "page not found" in Arabic
    expect(html).toContain("ar_AE"); // og:locale — AR context resolved
    expect(html.toLowerCase()).toContain("noindex");
    expect(html).not.toContain("Page not found"); // no EN fallback leak
  });
});
