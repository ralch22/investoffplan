import {
  consentTest as test,
  expect,
  box,
  intersects,
  hittableAtCenter,
  settleChromeAtTop,
  gotoFirstPdp,
} from "./fixtures";

/**
 * Bottom-chrome stacking with the cookie-consent banner LIVE (first visit).
 * The banner publishes --consent-h; every bottom fixture must either lift by
 * it or out-stack it. Runs at 390×844 via the `mobile` Playwright project.
 */

test.describe("PDP CTA bar vs cookie banner", () => {
  test("brochure + WhatsApp stay hittable while the banner is up", async ({ page }) => {
    await gotoFirstPdp(page);
    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();
    await settleChromeAtTop(page);

    const bar = page.getByRole("region", { name: "Quick actions" });
    await expect(bar).toBeVisible();
    const brochure = bar.getByRole("button", { name: /download brochure/i });
    const whatsapp = bar.getByRole("link", { name: /whatsapp/i });

    expect(intersects(await box(banner), await box(brochure))).toBe(false);
    expect(await hittableAtCenter(page, brochure)).toBe(true);
    expect(await hittableAtCenter(page, whatsapp)).toBe(true);
  });
});

test("accepting consent releases --consent-h and the CTA bar settles to the bottom edge", async ({
  page,
}) => {
  await gotoFirstPdp(page);
  const banner = page.getByTestId("cookie-consent-banner");
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: /accept all/i }).click();
  await expect(banner).toBeHidden();

  await expect
    .poll(
      () =>
        page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue("--consent-h").trim(),
        ),
      { timeout: 5_000 },
    )
    .toMatch(/^(0px)?$/);

  const bar = page.getByRole("region", { name: "Quick actions" });
  const b = await box(bar);
  const viewport = page.viewportSize()!;
  expect(b.y + b.height).toBeGreaterThan(viewport.height - 2);
});

test("AR PDP: reserved dock height covers the real (2-line-label) CTA bar", async ({ page }) => {
  const pdpPath = await gotoFirstPdp(page);
  await page.goto(`/ar${pdpPath}`);
  const bar = page.getByRole("region").filter({ has: page.getByRole("link", { name: /واتساب|whatsapp/i }) }).last();
  await expect(bar).toBeVisible();
  await page.waitForTimeout(300); // let the ResizeObserver publish --dock-cta-h
  const barBox = await box(bar);
  // getComputedStyle on a custom property returns the RAW calc() string, so
  // measure the RESOLVED reservation: <main>'s computed padding-bottom
  // (max-lg:pb-[var(--bottom-dock)]) is in px.
  const reserved = await page.evaluate(() => {
    const main = document.getElementById("main-content");
    return main ? parseFloat(getComputedStyle(main).paddingBottom) : null;
  });
  expect(reserved, "PageShell main must reserve --bottom-dock padding").not.toBeNull();
  expect(reserved!).toBeGreaterThanOrEqual(barBox.height - 1);
});

test.describe("SERP compare bar vs advisor FAB", () => {
  test("FAB and active compare bar do not overlap", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForSelector('div[data-hydrated="true"]', { timeout: 30_000 });
    // dismiss banner NOT — stacking with banner live is the harder case; but
    // compare selection first needs cards; banner does not block card clicks.
    const checkboxes = page.getByRole("checkbox", { name: /compare/i });
    const count = await checkboxes.count();
    test.skip(count < 2, "needs at least two compare checkboxes on page 1");
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    const compareLink = page.getByTestId("compare-link");
    await expect(compareLink).toBeVisible();
    await settleChromeAtTop(page);

    const fab = page.getByTestId("advisor-launcher");
    await expect(fab).toBeVisible();

    const barBox = await box(compareLink.locator("xpath=ancestor::*[contains(@class,'max-lg:fixed')][1]"));
    expect(intersects(await box(fab), barBox)).toBe(false);
    expect(await hittableAtCenter(page, compareLink)).toBe(true);
  });
});

test.describe("banner hygiene", () => {
  test("banner z-index is tokenized and bottom padding respects safe-area", async ({ page }) => {
    await page.goto("/projects");
    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();
    const { z, pb, expected } = await banner.evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      return {
        z: cs.zIndex,
        pb: cs.paddingBottom,
        expected: root.getPropertyValue("--z-consent").trim(),
      };
    });
    expect(expected, "globals.css must define --z-consent").not.toBe("");
    expect(z).toBe(expected);
    // pb must be computed from calc(1rem + env(safe-area-inset-bottom)) — on
    // desktop chrome env() is 0px so computed = 16px; the assertion is that the
    // declaration exists (computed ≥ 16px), not the notch value itself.
    expect(parseFloat(pb)).toBeGreaterThanOrEqual(16);
  });
});
