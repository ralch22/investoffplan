import { test, expect } from "./fixtures";
import { waitForCatalog, waitForCatalogHydration } from "./helpers";

test.describe("InvestOffPlan projects page", () => {
  test("loads listing with unit-count heading", async ({ page }) => {
    await page.goto("/projects");
    await expect(
      page.getByRole("heading", { name: /Total unit options in UAE/i }),
    ).toBeVisible();
    await waitForCatalog(page);
  });

  test("filters by city chip", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: /Abu Dhabi/i }).click();
    await expect(page.getByText(/results/)).toBeVisible();
  });

  test("opens mobile filter sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: /Filters & search/i }).click();
    await expect(page.getByTestId("mobile-filter-sheet")).toBeVisible();
    await page.getByRole("button", { name: "Show results" }).click();
    await expect(page.getByTestId("mobile-filter-sheet")).toHaveCount(0);
  });

  test("compare selection limits to three and opens compare page", async ({
    page,
  }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    const boxes = page.getByRole("checkbox", { name: "Compare unit" });
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await boxes.nth(2).check();
    await expect(page.getByTestId("compare-count")).toHaveText("3");
    await expect(boxes.nth(3)).toBeDisabled();
    const compareLink = page.getByTestId("compare-link");
    await expect(compareLink).toBeVisible();
    await expect(compareLink).toHaveAttribute("href", /\/compare\?units=/);
    await Promise.all([
      page.waitForURL(/\/compare\?units=/, { timeout: 20_000 }),
      compareLink.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: /Compare Projects/i }),
    ).toBeVisible();
  });

  test("toggles project view", async ({ page }) => {
    await page.goto("/projects");
    await waitForCatalog(page);
    await page.getByRole("button", { name: "Project view" }).click();
    await expect(
      page.getByRole("heading", {
        name: /\d[\d,]* New Off-Plan Projects in UAE/i,
      }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("InvestOffPlan site routes", () => {
  test("homepage shows featured launches", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/Premier/i);
    await expect(
      page.getByRole("heading", { name: /Latest launches/i }),
    ).toBeVisible();
  });

  test("developers index loads", async ({ page }) => {
    await page.goto("/developers");
    await expect(
      page.getByRole("heading", { level: 1, name: /Developers/i }),
    ).toBeVisible();
  });

  test("guide detail loads with breadcrumbs", async ({ page }) => {
    await page.goto("/guides/why-invest-off-plan-dubai", { timeout: 45000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Why Invest in Off-Plan Dubai/i }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Guides");
  });

  test("map page loads", async ({ page }) => {
    await page.goto("/map");
    await expect(
      page.getByRole("heading", { name: /Project map/i }),
    ).toBeVisible();
  });

  test("project detail loads", async ({ page }) => {
    await page.goto("/projects/palm-central-private-residences-phase-2");
    await expect(
      page.getByRole("heading", { level: 1, name: /Palm Central/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unit types" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      "Projects",
    );
    await expect(page.getByRole("navigation", { name: "Project sections" })).toBeVisible();
  });

  test("clear all filters restores results", async ({ page }) => {
    await page.goto("/projects?q=zzzznonexistent999");
    await waitForCatalogHydration(page);
    await expect(page.getByText("No units match your filters")).toBeVisible();
    await page.getByRole("button", { name: "Clear all filters" }).click();
    await waitForCatalog(page);
    await expect(
      page.getByRole("heading", { name: /Total unit options in UAE/i }),
    ).toBeVisible();
  });
});