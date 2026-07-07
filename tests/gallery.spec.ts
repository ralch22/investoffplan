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
      await expect(page.locator("#project-gallery").getByText("2 of 6")).toBeVisible();
    }

    await fullscreen.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("SERP card gallery cycles photos and opens lightbox", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);

    const card = page.locator("article").filter({ hasText: "105 Residences" }).first();
    await expect(card).toBeVisible();

    const next = card.getByRole("button", { name: "Next photo" });
    if (await next.isVisible()) {
      await next.click();
      await expect(card.locator("[aria-live='polite']")).toHaveText("2 / 7");
    }

    await card.getByRole("button", { name: /photos fullscreen/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close gallery" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("Compare view shows gallery per column", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);

    const boxes = page.getByRole("checkbox", { name: "Compare unit" });
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