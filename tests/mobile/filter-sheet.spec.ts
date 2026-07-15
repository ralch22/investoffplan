import { test, expect } from "./fixtures";

/**
 * Mobile filter sheet (SERP, ≤767px trigger) at 390×844.
 * Contract: "Show results" COMMITS; Close/Escape/backdrop DISCARD; the page
 * behind the sheet must not scroll while it is open.
 */

async function openSheet(page: import("@playwright/test").Page) {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  const trigger = page.getByRole("button", { name: /filters & search/i });
  await trigger.click();
  const sheet = page.getByTestId("mobile-filter-sheet");
  await expect(sheet).toBeVisible();
  return { trigger, sheet };
}

test("opens with dialog semantics and a reachable primary action", async ({ page }) => {
  const { trigger, sheet } = await openSheet(page);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const cta = page.getByTestId("mobile-filter-show-results");
  await expect(cta).toBeVisible();
  const b = await cta.boundingBox();
  const vp = page.viewportSize()!;
  expect(b!.y + b!.height).toBeLessThanOrEqual(vp.height + 1);
  await expect(sheet.getByRole("button", { name: /close filters/i })).toBeVisible();
});

test("apply: choosing a filter and Show results updates URL/results", async ({ page }) => {
  const { sheet } = await openSheet(page);
  // Pick the first checkbox/radio/select-like control inside the sheet.
  const control = sheet.locator('input[type="checkbox"], input[type="radio"], select, button[aria-pressed]').first();
  test.skip(!(await control.count()), "no togglable filter control found in sheet");
  const tag = await control.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "select") {
    await control.selectOption({ index: 1 });
  } else {
    await control.click();
  }
  await page.getByTestId("mobile-filter-show-results").click();
  await expect(sheet).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.location.search.length), { timeout: 10_000 })
    .toBeGreaterThan(0);
});

test.describe("close discards", () => {
  test("Close button reverts edits made in the sheet", async ({ page }) => {
    const { sheet } = await openSheet(page);
    const before = await page.evaluate(() => window.location.search);
    const control = sheet.locator('input[type="checkbox"], input[type="radio"], button[aria-pressed]').first();
    test.skip(!(await control.count()), "no togglable filter control found in sheet");
    await control.click();
    await sheet.getByRole("button", { name: /close filters/i }).click();
    await expect(sheet).toBeHidden();
    await page.waitForTimeout(600); // give the URL-sync debounce a chance to (wrongly) fire
    const after = await page.evaluate(() => window.location.search);
    expect(after).toBe(before);
  });
});

test("Escape discards and restores focus to the trigger", async ({ page }) => {
  const { trigger, sheet } = await openSheet(page);
  const before = await page.evaluate(() => window.location.search);
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  const after = await page.evaluate(() => window.location.search);
  expect(after).toBe(before);
});

test.describe("scroll lock", () => {
  test("body does not scroll while the sheet is open", async ({ page }) => {
    await openSheet(page);
    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    const y1 = await page.evaluate(() => window.scrollY);
    expect(y1).toBe(y0);
  });
});
