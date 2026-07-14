import { test, expect } from "@playwright/test";

test.describe("UI Polish Components", () => {
  test("Mobile Filter Sheet opens and contains drag handle", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects");

    // Wait for hydration
    await page.waitForLoadState('networkidle');

    // The filter button on mobile
    const filterButton = page.locator('button[data-testid="mobile-filter-trigger"], button:has-text("Filters")').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      const sheet = page.locator('[data-testid="mobile-filter-sheet"]');
      await expect(sheet).toBeVisible();

      // Check if drag handle is present (bg-border-strong)
      const handle = sheet.locator('.bg-border-strong');
      await expect(handle).toBeVisible();
    }
  });

  test("Compare bar appears and animates when unit is selected", async ({ page }) => {
    await page.goto("/projects");
    
    // Check first checkbox for compare
    const firstCheckbox = page.locator('input[type="checkbox"][aria-label*="Compare"]').first();
    await firstCheckbox.check();

    // The Compare bar should appear with animation layout properties
    const compareBar = page.locator('[data-testid="compare-link"]').locator('..');
    await expect(compareBar).toBeVisible();

    // Clear compare
    await page.locator('button:has-text("Clear")').click();
    await expect(page.locator('[data-testid="compare-link"]')).toHaveCount(0);
  });
});
