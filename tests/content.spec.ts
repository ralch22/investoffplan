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
});
