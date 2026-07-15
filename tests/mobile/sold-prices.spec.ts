import { test, expect } from "./fixtures";

// /sold-prices at 390px: the transaction table must scroll inside its own
// container — never the page.
test("sold-prices community page has no horizontal page overflow", async ({ page }) => {
  await page.goto("/sold-prices/jumeirah-village-circle");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(600);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const table = page.locator("table").first();
  await expect(table).toBeVisible();
});
