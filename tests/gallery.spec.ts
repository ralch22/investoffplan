import { test, expect } from "./fixtures";
import { waitForCatalog } from "./helpers";

test.describe("Project gallery", () => {
  test("PDP gallery supports navigation and fullscreen", async ({ page }) => {
    await page.goto("/projects/105-residences");
    await expect(page.getByRole("heading", { name: /Project gallery/i })).toBeVisible({
      timeout: 20_000,
    });

    const fullscreen = page.getByRole("button", { name: /fullscreen/i });
    await expect(fullscreen).toBeVisible();

    const next = page.getByRole("button", { name: "Next photo" }).first();
    if (await next.isVisible()) {
      await next.click();
      // Total may grow when enrichment contributes extra gallery images (issue #37).
      await expect(
        page.locator("#project-gallery").getByText(/2 of \d+/),
      ).toBeVisible();
    }

    await fullscreen.click();
    // Cookie consent also uses role=dialog — always scope by gallery name.
    const galleryDialog = page.getByRole("dialog", { name: /photo gallery/i });
    await expect(galleryDialog).toBeVisible();
    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(galleryDialog).toBeHidden();
  });

  test("SERP card gallery cycles photos and opens lightbox", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);

    const card = page.locator("article").filter({ hasText: "105 Residences" }).first();
    await expect(card).toBeVisible();

    const next = card.getByRole("button", { name: "Next photo" });
    if (await next.isVisible()) {
      await next.click();
      // Card overlay counter (not lightbox — both can match "2 / N" under the article).
      await expect(
        card.locator("div.absolute.bottom-2").filter({ hasText: /^\d+\s*\/\s*\d+$/ }),
      ).toHaveText(/^2\s*\/\s*\d+$/);
    }

    await card.getByRole("button", { name: /photos fullscreen/i }).click();
    const galleryDialog = page.getByRole("dialog", { name: /photo gallery/i });
    await expect(galleryDialog).toBeVisible();
    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(galleryDialog).toBeHidden();
  });

  test("Compare view shows gallery per column", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);

    const boxes = page.getByRole("checkbox", { name: /^Compare / });
    await boxes.nth(0).check();
    await boxes.nth(1).check();

    const compareLink = page.getByTestId("compare-link");
    await Promise.all([
      page.waitForURL(/\/compare\?units=/, { timeout: 20_000 }),
      compareLink.click(),
    ]);

    await expect(
      page.getByRole("button", { name: /photos fullscreen/i }).first(),
    ).toBeVisible();
  });
});