import { test, expect } from "./fixtures";

test.describe("Content routes", () => {
  test("/insights permanently redirects to /guides", async ({ page }) => {
    const response = await page.goto("/insights");
    expect(response?.url()).toContain("/guides");
    await expect(
      page.getByRole("heading", { level: 1, name: /Investment Guides/i }),
    ).toBeVisible();
  });

  // #250 — AR guides hub must not hardcode EN H1/chrome.
  test("AR /ar/guides hub H1 is Arabic", async ({ page }) => {
    const res = await page.goto("/ar/guides", { waitUntil: "commit" });
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain('lang="ar"');
    expect(html).not.toContain(">Investment Guides<");
    expect(html).toContain("أدلّة الاستثمار");
  });

  test("news article renders with date, sections, and JSON-LD", async ({ page }) => {
    await page.goto("/news");
    const firstLink = page.getByRole("link", { name: "Read More" }).first();
    await firstLink.click();
    await page.waitForURL(/\/news\/[a-z0-9-]+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"NewsArticle"'))).toBe(true);
  });

  test("FAQ hub lists topics and topic page has FAQPage JSON-LD", async ({ page }) => {
    await page.goto("/faq");
    await expect(
      page.getByRole("heading", { level: 1, name: /Frequently Asked Questions/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /payment plans/i }).first().click();
    await page.waitForURL(/\/faq\/[a-z0-9-]+/);
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"FAQPage"'))).toBe(true);
    await expect(page.locator("details.faq-details").first()).toBeVisible();
  });

  test("expanded guide renders rich body sections", async ({ page }) => {
    await page.goto("/guides/understanding-payment-plans");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article h2").first()).toBeVisible();
  });

  // #191 — compare-developers decision layer (pros / who-suits / related mesh).
  // Assert on SSR body (not live-DOM getByTestId) so Turnstile/hydration can't
  // flake the content check — same pattern as other indexability assertions.
  test("compare-developers pair has decision-layer content + FAQ JSON-LD", async ({
    page,
  }) => {
    const response = await page.goto(
      "/compare-developers/damac-properties-vs-emaar-properties",
    );
    expect(response?.status()).toBe(200);
    const body = await response!.text();
    expect(body).toMatch(/The case for each|الحجّة لكل مطوّر/);
    expect(body).toMatch(/Who each suits|من يناسب كل مطوّر/);
    expect(body).toMatch(/Related developer comparisons|مقارنات مطوّرين ذات صلة/);
    expect(body).toMatch(/FAQPage/);
    expect(body).toMatch(/Premium-flagged share|حصة المشاريع المميزة/);
  });

  // Soft SEO residual (#230) — hub indexes + title/meta hygiene + favorites noindex.
  test("compare hub indexes render and favorites is noindex", async ({ page }) => {
    for (const path of ["/compare-projects", "/compare-developers"]) {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      const body = await res!.text();
      expect(body).toMatch(/<h1[\s>]/i);
    }

    const fav = await page.goto("/favorites");
    expect(fav?.status()).toBe(200);
    const favBody = await fav!.text();
    expect(favBody).toMatch(/noindex/i);

    const pair = await page.goto(
      "/compare-developers/damac-properties-vs-emaar-properties",
    );
    expect(pair?.status()).toBe(200);
    const pairBody = await pair!.text();
    // Title should not double-brand ("… | invest off-plan | invest off-plan").
    const titleMatch = pairBody.match(/<title>([^<]*)<\/title>/i);
    expect(titleMatch?.[1] ?? "").not.toMatch(
      /\|\s*invest off-plan\s*\|\s*invest off-plan/i,
    );
    // Cap SERP budget (allow slight overshoot only if names are extreme).
    expect((titleMatch?.[1] ?? "").length).toBeLessThanOrEqual(70);
  });

  // #241 — EN soft-404s: unknown detail slugs must be real HTTP 404s (not 200
  // "… not found" shells). Matches projects/AR which already set dynamicParams=false.
  test("unknown EN community/developer/news/guide slugs return 404", async ({
    page,
  }) => {
    for (const path of [
      "/communities/definitely-not-a-real-community-xyz",
      "/developers/definitely-not-a-real-developer-xyz",
      "/news/definitely-not-a-real-article-xyz",
      "/guides/definitely-not-a-real-guide-xyz",
    ]) {
      const response = await page.goto(path, { waitUntil: "commit" });
      expect(response?.status(), path).toBe(404);
      const body = await response!.text();
      expect(body).toContain("Page not found");
      // Soft-404 titles must not win.
      expect(body).not.toMatch(
        /<title>(Community|Developer|Article|Guide) not found/i,
      );
    }
  });

  // #243 — reverse pair order must 308 to alphabetical canonical (not 404 / soft-200).
  // Middleware 308s B-vs-A → A-vs-B; page permanentRedirect is a belt-and-braces.
  test("reverse area compare pair redirects to canonical order", async ({
    page,
    request,
  }) => {
    const reverse = "/compare/jumeirah-village-circle-vs-dubai-marina";
    const canonical = "/compare/dubai-marina-vs-jumeirah-village-circle";

    const bare = await request.fetch(reverse, { maxRedirects: 0 });
    expect([301, 308], `status for ${reverse}`).toContain(bare.status());
    expect(bare.headers()["location"] ?? "").toContain(canonical);

    const res = await page.goto(reverse, { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(200);
    expect(page.url()).toContain(canonical);
    // Final response body (after redirect follow).
    const body = await page.content();
    expect(body).toMatch(/Dubai Marina/i);
    expect(body).toMatch(/Jumeirah Village Circle/i);
  });

  // #245 — AR market-report hub must keep community print reports in /ar.
  test("AR market-report hub links stay on /ar/reports/market/*", async ({
    page,
  }) => {
    const res = await page.goto("/ar/market-report", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/href="\/ar\/reports\/market\/[a-z0-9-]+"/);
    // Must not bounce Arabic users onto bare EN report paths.
    expect(html).not.toMatch(/href="\/reports\/market\/[a-z0-9-]+"/);

    const arReport = html.match(/href="(\/ar\/reports\/market\/[a-z0-9-]+)"/)?.[1];
    expect(arReport).toBeTruthy();
    const reportRes = await page.goto(arReport!, {
      waitUntil: "domcontentloaded",
    });
    expect(reportRes?.ok()).toBeTruthy();
    expect(page.url()).toContain("/ar/reports/market/");
  });

  // #252 — AR FAQ hub hero + topic cards must not stay English.
  test("AR FAQ hub H1 and topic cards are Arabic", async ({ page }) => {
    const res = await page.goto("/ar/faq", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    // SSR body — avoid live-DOM flakes from Turnstile/hydration.
    expect(html).toMatch(/الأسئلة الشائعة/);
    expect(html).not.toMatch(/Frequently Asked Questions/);
    expect(html).not.toMatch(/Straight answers on buying off-plan/);
    expect(html).toMatch(/أساسيات العقارات على الخارطة/);
    expect(html).not.toMatch(/>Off-Plan Basics</);
  });

  // #253 — AR collection title + H1 must not stay English.
  test("AR collection pages use Arabic title and H1", async ({ page }) => {
    for (const { path, arH1, enH1 } of [
      {
        path: "/ar/collections/waterfront",
        arH1: "العيش على الواجهة المائية",
        enH1: "Waterfront living",
      },
      {
        path: "/ar/collections/dubai",
        arH1: "دبي على الخارطة",
        enH1: "Dubai off-plan",
      },
    ]) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.ok(), path).toBeTruthy();
      const html = await page.content();
      expect(html, path).toMatch(new RegExp(arH1));
      expect(html, path).not.toMatch(new RegExp(`<h1[^>]*>\\s*${enH1}`));
      // Meta title should not be the EN COLLECTION_PAGES string.
      expect(html, path).not.toMatch(
        /<title>Waterfront Off-Plan Projects in the UAE/i,
      );
      expect(html, path).not.toMatch(/<title>Off-Plan Projects in Dubai \|/i);
    }
  });

  // AR about CTA must not dump users onto EN /projects (PrimaryButton is not
  // locale-aware — use /ar/projects). Same fix applied to (ar)/ar/not-found.tsx.
  test("AR about Get-started CTA stays on /ar/projects", async ({ page }) => {
    const res = await page.goto("/ar/about", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    const html = await page.content();
    expect(html).toMatch(/href="\/ar\/projects"/);
    // Bare EN /projects must not appear as a CTA href on the AR about page.
    expect(html).not.toMatch(/href="\/projects"/);
  });
});
