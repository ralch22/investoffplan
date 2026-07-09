import { test, expect } from "./fixtures";

test.describe("Mortgage, areas, collections", () => {
  test("mortgage calculator computes a monthly payment", async ({ page }) => {
    await page.goto("/tools/mortgage");
    await expect(
      page.getByRole("heading", { level: 1, name: /Mortgage calculator/i }),
    ).toBeVisible();
    await expect(page.getByText(/Monthly payment/i).first()).toBeVisible();
    await page.locator("#mtg-price").fill("2000000");
    await expect(page.getByText(/AED [\d,]+/).first()).toBeVisible();
    await expect(page.getByPlaceholder("Full name")).toBeVisible();
  });

  test("community page with editorial shows stats band and living section", async ({
    page,
  }) => {
    await page.goto("/communities/jumeirah-village-circle");
    await expect(page.getByText("Off-plan projects").first()).toBeVisible();
    await expect(page.getByText(/Living in/i).first()).toBeVisible();
    await expect(page.getByText(/Lifestyle/).first()).toBeVisible();
  });

  test("community page without editorial degrades gracefully", async ({ page }) => {
    await page.goto("/communities");
    const anyCommunity = page.locator('a[href^="/communities/"]').first();
    await anyCommunity.click();
    await expect(page.getByText(/unit options/i).first()).toBeVisible();
  });

  test("legacy /areas and /market-data URLs 308 to the new IA", async ({ page }) => {
    // Variant-slug area URL → its canonical community page.
    await page.goto("/areas/jumeirah-village-circle");
    await expect(page).toHaveURL(/\/communities\/jumeirah-village-circle$/);
    // Market-data hub folded into /compare.
    await page.goto("/market-data");
    await expect(page).toHaveURL(/\/compare$/);
  });

  test("compare hub lists distinct-community pairs (no self-comparisons)", async ({
    page,
  }) => {
    await page.goto("/compare");
    const hrefs = await page
      .locator('a[href*="/compare/"][href*="-vs-"]')
      .evaluateAll((links) => links.map((l) => l.getAttribute("href") ?? ""));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const pair = href.split("/compare/")[1] ?? "";
      const [a, b] = pair.split("-vs-");
      expect(a, `self-comparison pair: ${href}`).not.toBe(b);
    }
  });

  test("location guide ranks communities and emits ItemList JSON-LD", async ({
    page,
  }) => {
    await page.goto("/locations");
    const firstGuide = page.locator('a[href^="/locations/"]').first();
    await firstGuide.click();
    await expect(page).toHaveURL(/\/locations\/[a-z-]+$/);
    // Ranked list links into community pages.
    await expect(page.locator('ol a[href^="/communities/"]').first()).toBeVisible();
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"ItemList"'))).toBe(true);
  });

  test("collection page renders projects and JSON-LD", async ({ page }) => {
    await page.goto("/collections/waterfront");
    await expect(
      page.getByRole("heading", { level: 1, name: /Waterfront living/i }),
    ).toBeVisible();
    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    expect(jsonLd.some((s) => s.includes('"CollectionPage"'))).toBe(true);
    await expect(page.getByRole("link", { name: "Open in Projects" })).toBeVisible();
  });

  test("emirate collection filters by city", async ({ page }) => {
    await page.goto("/collections/ras-al-khaimah");
    await expect(
      page.getByRole("heading", { level: 1, name: /Ras Al Khaimah/i }),
    ).toBeVisible();
    await expect(page.getByText(/unit options across/i)).toBeVisible();
  });
});
