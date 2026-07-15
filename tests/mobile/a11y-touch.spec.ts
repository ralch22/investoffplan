import { test, consentTest, expect, box, gotoFirstPdp, settleChromeAtTop } from "./fixtures";

/**
 * Mobile a11y + touch ergonomics at 390×844.
 * WCAG 2.5.5 target size (44px), dialog semantics, landmark uniqueness.
 */

const MIN_TARGET = 43.5; // 44px with sub-pixel tolerance

test("SERP touch targets meet 44px", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  await settleChromeAtTop(page);

  // Fixed/auto-hiding chrome (tab bar) must NOT be scrollIntoView'd — the
  // scroll-down gesture translates it away and the wait never stabilizes.
  const tabLink = page.getByRole("navigation", { name: "Primary" }).getByRole("link").first();
  expect((await box(tabLink)).height, "tab link height").toBeGreaterThanOrEqual(MIN_TARGET);

  const trigger = page.getByRole("button", { name: /filters & search/i });
  await trigger.scrollIntoViewIfNeeded();
  expect((await box(trigger)).height, "filter trigger height").toBeGreaterThanOrEqual(MIN_TARGET);

  // Scope to the layout-toggle group — a bare button[aria-pressed] matches
  // every favorite heart on every card.
  const toggles = page.getByRole("group").locator("button[aria-pressed]");
  const n = Math.min(await toggles.count(), 3);
  for (let i = 0; i < n; i++) {
    const t = toggles.nth(i);
    await t.scrollIntoViewIfNeeded();
    expect((await box(t)).height, `view toggle ${i} height`).toBeGreaterThanOrEqual(MIN_TARGET);
  }
});

test("PDP section-nav pills meet 44px", async ({ page }) => {
  await gotoFirstPdp(page);
  const nav = page.getByRole("navigation", { name: "Project sections" });
  await expect(nav).toBeVisible();
  const pill = nav.getByRole("link").first();
  const b = await box(pill);
  expect(b.height).toBeGreaterThanOrEqual(MIN_TARGET);
});

consentTest("cookie banner buttons meet 44px", async ({ page }) => {
  await page.goto("/projects");
  const banner = page.getByTestId("cookie-consent-banner");
  await expect(banner).toBeVisible();
  for (const name of [/accept all/i, /decline/i]) {
    const b = await box(banner.getByRole("button", { name }));
    expect(b.height, String(name)).toBeGreaterThanOrEqual(MIN_TARGET);
  }
});

test.describe("hamburger dialog wiring", () => {
  test("hamburger announces and controls the drawer dialog", async ({ page }) => {
    await page.goto("/projects");
    const burger = page.getByRole("button", { name: /open menu/i });
    await expect(burger).toHaveAttribute("aria-haspopup", "dialog");
    const controls = await burger.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    await burger.click();
    const drawer = page.locator(`#${controls}`);
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(burger).toBeFocused();
  });
});

test("drawer traps focus while open", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: /open menu/i }).click();
  const dialog = page.getByRole("dialog").last();
  await expect(dialog).toBeVisible();
  // Tab a handful of times — focus must remain inside the dialog (native
  // showModal guarantees this; the assertion pins the contract).
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((el) => el.contains(document.activeElement));
    expect(inside, `Tab #${i + 1} escaped the drawer`).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test.describe("advisor drawer keyboard support", () => {
  test("Escape closes the advisor drawer", async ({ page }) => {
    await gotoFirstPdp(page);
    await settleChromeAtTop(page);
    await page.getByTestId("advisor-launcher").click();
    const panel = page.getByTestId("advisor-panel");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(page.getByTestId("advisor-launcher")).toBeFocused();
  });
});

test.describe("landmark hygiene", () => {
  test("exactly one main landmark on /map (EN + AR)", async ({ page }) => {
    for (const path of ["/map", "/ar/map"]) {
      await page.goto(path);
      const mains = await page.locator("main").count();
      expect(mains, `${path} <main> count`).toBe(1);
    }
  });
});

test("landmark names stay unique (SERP tab bar, PDP breadcrumb)", async ({ page }) => {
  await page.goto("/projects");
  await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(1);
  // SERP has no breadcrumb; the uniqueness contract lives on the PDP.
  await gotoFirstPdp(page);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Project sections" })).toHaveCount(1);
});

test("no horizontal overflow on high-risk mobile routes", async ({ page }) => {
  const pdpPath = await gotoFirstPdp(page);
  const routes = [pdpPath, "/map", "/communities"];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});
