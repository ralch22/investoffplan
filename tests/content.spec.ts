import { test, expect } from "./fixtures";

test.describe("Content routes", () => {
  test("/insights permanently redirects to /guides", async ({ page }) => {
    const response = await page.goto("/insights");
    expect(response?.url()).toContain("/guides");
    await expect(
      page.getByRole("heading", { level: 1, name: /Investment Guides/i }),
    ).toBeVisible();
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
});
