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

  test("area page with editorial shows stats band and living section", async ({
    page,
  }) => {
    await page.goto("/areas/jumeirah-village-circle");
    await expect(page.getByText("Off-plan projects").first()).toBeVisible();
    await expect(page.getByText(/Living in/i).first()).toBeVisible();
    await expect(page.getByText(/Lifestyle/).first()).toBeVisible();
  });

  test("area page without editorial degrades gracefully", async ({ page }) => {
    await page.goto("/areas");
    const anyArea = page.locator('a[href^="/areas/"]').first();
    await anyArea.click();
    await expect(page.getByText(/unit options in/i).first()).toBeVisible();
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
