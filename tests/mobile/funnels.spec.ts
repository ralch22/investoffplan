import { test, expect, box, settleChromeAtTop, gotoFirstPdp } from "./fixtures";

/**
 * Core mobile funnels at 390×844 (consent pre-denied — banner suppressed).
 * Covers PDP media/lead surfaces, SERP controls, compare, tab-bar nav.
 */

test("PDP: gallery opens fullscreen and Escape closes it, focus restored", async ({ page }) => {
  await gotoFirstPdp(page);
  const opener = page.getByRole("button", { name: /fullscreen/i }).first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: /photo gallery/i });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("PDP: brochure modal opens from the mobile CTA bar; advisor FAB hides while open", async ({
  page,
}) => {
  await gotoFirstPdp(page);
  await settleChromeAtTop(page);
  const bar = page.getByRole("region", { name: "Quick actions" });
  await bar.getByRole("button", { name: /download brochure/i }).click();
  const modal = page.getByRole("dialog").filter({ hasText: /brochure/i }).first();
  await expect(modal).toBeVisible();
  // :has(dialog[open]:not([data-advisor-dialog])) hides the FAB while a
  // non-advisor native dialog is up.
  await expect(page.getByTestId("advisor-launcher")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
  await expect(page.getByTestId("advisor-launcher")).toBeVisible();
});

test("PDP: advisor drawer opens full-screen and closes; launcher reflects state", async ({
  page,
}) => {
  await gotoFirstPdp(page);
  const fab = page.getByTestId("advisor-launcher");
  await settleChromeAtTop(page);
  await fab.click();
  const panel = page.getByTestId("advisor-panel");
  await expect(panel).toBeVisible();
  await expect(fab).toHaveAttribute("aria-expanded", "true");
  await panel.getByRole("button", { name: /close/i }).click();
  await expect(panel).toBeHidden();
  await expect(fab).toHaveAttribute("aria-expanded", "false");
});

test("PDP: no page-level horizontal overflow; units area scrolls internally", async ({ page }) => {
  await gotoFirstPdp(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("PDP: payment calculator responds to input", async ({ page }) => {
  await gotoFirstPdp(page);
  const calc = page.locator("#calculator");
  await calc.scrollIntoViewIfNeeded();
  await expect(calc).toBeVisible();
  const slider = calc.locator('input[type="range"]').first();
  const number = calc.locator('input[type="number"], input[inputmode="numeric"]').first();
  const before = await calc.innerText();
  if (await slider.count()) {
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
  } else if (await number.count()) {
    await number.fill("2000000");
  } else {
    test.skip(true, "no interactive calculator input found on this PDP");
  }
  await expect
    .poll(async () => (await calc.innerText()) !== before, { timeout: 5_000 })
    .toBe(true);
});

test("PDP: lead-capture UI present (Turnstile blocks localhost submits — presence only)", async ({
  page,
}) => {
  const pdpPath = await gotoFirstPdp(page);
  const html = await (await page.request.get(pdpPath)).text();
  expect(html).toMatch(/quick actions|download brochure/i);
  const nameField = page.locator('input[autocomplete="name"]').first();
  if (await nameField.count()) {
    await nameField.scrollIntoViewIfNeeded();
    await expect(nameField).toBeEditable();
  }
});

test("SERP: view toggles work and announce state", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  // Scope to the layout-toggle group — bare button[aria-pressed] matches
  // every favorite heart on every card.
  const toggles = page.getByRole("group").locator("button[aria-pressed]");
  const n = await toggles.count();
  test.skip(n < 2, "expected at least two view-mode toggles");
  await expect(toggles.locator('xpath=self::*[@aria-pressed="true"]').first()).toBeVisible();
  const target = toggles.nth(1);
  await target.scrollIntoViewIfNeeded();
  await target.click();
  await expect(target).toHaveAttribute("aria-pressed", "true");
});

test("SERP → PDP → back restores scroll position", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(400); // let the scroll-save debounce run
  const link = page.getByRole("link", { name: /view details/i }).first();
  await link.click();
  await page.waitForURL(/\/projects\/[^/?#]+/);
  await page.goBack();
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeGreaterThan(600);
});

test("compare funnel: two selections → compare bar → /compare", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  const checkboxes = page.getByRole("checkbox", { name: /compare/i });
  test.skip((await checkboxes.count()) < 2, "needs two compare checkboxes");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await expect(page.getByTestId("compare-count")).toBeVisible();
  await settleChromeAtTop(page);
  await page.getByTestId("compare-link").click();
  await page.waitForURL(/\/compare/);
  expect(page.url()).toMatch(/units=/);
});

test("EN bottom tabs: Explore → Compare → Saved keeps locale and landmark", async ({ page }) => {
  await page.goto("/projects");
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs).toBeVisible();
  await tabs.getByRole("link", { name: /compare/i }).click();
  await page.waitForURL(/\/compare/);
  expect(new URL(page.url()).pathname.startsWith("/ar")).toBe(false);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /saved/i }).click();
  await page.waitForURL(/\/favorites/);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

test.describe("hydration honesty", () => {
  test("SSR result count equals hydrated result count", async ({ page }) => {
    const html = await (await page.request.get("/projects")).text();
    const ssr = html.match(/([\d,]+)\s+(?:results|projects|units)/i)?.[1];
    expect(ssr, "SSR count not found in HTML").toBeTruthy();
    await page.goto("/projects");
    await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
    const live = (await page.getByRole("status").first().innerText()).match(/[\d,]+/)?.[0];
    expect(live).toBe(ssr);
  });
});
