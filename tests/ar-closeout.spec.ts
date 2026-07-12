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

  // Residual AR content-leak (#233): home hero chips + WhatsApp via dictionaries.
  test("/ar hero residual chrome is Arabic (popular, chips, WhatsApp)", async ({
    page,
  }) => {
    const response = await page.goto("/ar", { waitUntil: "commit" });
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).toContain("الأكثر بحثاً:");
    expect(html).toContain("فلل");
    expect(html).toContain("أقل من مليون درهم");
    expect(html).toContain("واتساب");
    // EN residual defaults must not win on /ar.
    expect(html).not.toContain(">Popular:<");
    expect(html).not.toContain(">WhatsApp<");
    expect(html).not.toContain(">Under AED 1M<");
  });

  // Residual: residential tools form labels from dict (not hard-coded EN).
  test("/ar/tools/residential residual form chrome is Arabic", async ({ page }) => {
    const response = await page.goto("/ar/tools/residential", {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect(html).toContain("ابحث عن مشروع");
    expect(html).toContain("كل المناطق");
    expect(html).not.toContain(">All areas<");
    expect(html).not.toContain(">Search project<");
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

  test("a bogus URL 404s with a proper branded document (no bare error shell)", async ({
    browser,
    page,
  }) => {
    // globalNotFound renders a real branded 404 (lang/dir + noindex + 404 status)
    // instead of the bare `<html id="__next_error__">` shell.
    //
    // Path prefix wins over Accept-Language (#224): /ar/* 404s are Arabic even
    // when the browser sends Accept-Language: en (desktop EN / Googlebot-ish).
    // Edge middleware stamps x-iop-locale; OpenNext rejects Node proxy.ts.
    const enArCtx = await browser.newContext({ locale: "en-US" });
    const enArPage = await enArCtx.newPage();
    const pathArResp = await enArPage.goto("/ar/does-not-exist", {
      waitUntil: "commit",
    });
    expect(pathArResp?.status()).toBe(404);
    const pathArHtml = await pathArResp!.text();
    expect(pathArHtml).toContain('lang="ar"');
    expect(pathArHtml).toContain('dir="rtl"');
    expect(pathArHtml).toContain("الصفحة غير موجودة"); // Arabic "page not found"
    expect(pathArHtml).toContain("ar_AE");
    expect(pathArHtml.toLowerCase()).toContain("noindex");
    // EN copy must not win for an /ar path.
    expect(pathArHtml).not.toContain(">Page not found<");
    await enArCtx.close();

    // Accept-Language: ar still gets Arabic when path is also /ar.
    const arCtx = await browser.newContext({ locale: "ar-AE" });
    const arPage = await arCtx.newPage();
    const arResp = await arPage.goto("/ar/this-route-should-404-xyz", {
      waitUntil: "commit",
    });
    expect(arResp?.status()).toBe(404);
    const arHtml = await arResp!.text();
    expect(arHtml).toContain("الصفحة غير موجودة");
    expect(arHtml).toContain("ar_AE");
    await arCtx.close();

    // Default (English) browser on an EN path gets the branded EN 404.
    const enResp = await page.goto("/definitely-not-a-real-page", {
      waitUntil: "commit",
    });
    expect(enResp?.status()).toBe(404);
    const enHtml = await enResp!.text();
    expect(enHtml).toContain('lang="en"');
    expect(enHtml).toContain("Page not found");
    expect(enHtml.toLowerCase()).toContain("noindex");
  });
});
