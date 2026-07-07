import { test, expect } from "./fixtures";

test.describe("DataGuru toolkit parity", () => {
  test("tools hub lists five DataGuru features", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByRole("heading", { name: /Know your next move/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Price Map/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Community Insights/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Rent vs Buy/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Residential Insights/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /New Projects/i }).first()).toBeVisible();
  });

  test("rent vs buy calculator renders results", async ({ page }) => {
    await page.goto("/tools/rent-vs-buy");
    await expect(page.getByRole("heading", { name: /Rent vs buy calculator/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Monthly payments" }),
    ).toBeVisible();
    await expect(page.getByText("Buying (mortgage)")).toBeVisible();
    await expect(page.getByText("Indicative outlook")).toBeVisible();
  });

  test("community insights supports lifestyle filter", async ({ page }) => {
    await page.goto("/tools/communities");
    await expect(page.getByRole("heading", { name: /Community insights/i })).toBeVisible();
    await page.getByRole("button", { name: /Waterfront/i }).click();
    await expect(page.getByText(/\d+ communities/)).toBeVisible();
  });

  test("residential insights table loads", async ({ page }) => {
    await page.goto("/tools/residential");
    await expect(page.getByRole("heading", { name: /Residential insights/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Project" })).toBeVisible();
  });
});