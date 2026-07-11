import { test, expect } from "./fixtures";

test.describe("ROI & yield estimator", () => {
  test("computes a total return and shows the disclaimer", async ({ page }) => {
    await page.goto("/tools/roi");

    await expect(
      page.getByRole("heading", { level: 1, name: /ROI & yield estimator/i }),
    ).toBeVisible();

    // Drive the two load-bearing inputs: purchase price + expected annual rent.
    await page.locator("#roi-price").fill("2000000");
    await page.locator("#roi-rent").fill("140000");

    // A computed AED return figure renders in the headline output.
    await expect(page.getByTestId("roi-total-return")).toContainText(/AED/);
    // A net rental yield percentage renders in the results.
    await expect(page.getByText(/Net rental yield/i)).toBeVisible();
    await expect(page.getByText(/%/).first()).toBeVisible();

    // Prominent disclaimer is present.
    await expect(
      page.getByText(/not financial advice; verify independently/i),
    ).toBeVisible();
  });
});
