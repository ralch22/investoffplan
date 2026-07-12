import { test, expect } from "./fixtures";

/**
 * #295 — residual AR EN-path escapes after earlier locale waves:
 * - compare/units Done CTA + removeUnit navigation
 * - developers directory filter/search/pagination URL replaces
 *
 * Prefer SSR HTML where possible; client nav assertions for router.replace/push.
 * Language switcher correctly emits bare EN mirrors — do not ban those in chrome.
 */

// Stable catalog unit ids (project:unit) present in data/catalog.json.
const UNIT_A =
  "fd3fa686-97cf-40bf-acd7-9ad9b6875de7:fd3fa686-97cf-40bf-acd7-9ad9b6875de7::apartment::1";
const UNIT_B =
  "fd3fa686-97cf-40bf-acd7-9ad9b6875de7:fd3fa686-97cf-40bf-acd7-9ad9b6875de7::apartment::2";

test.describe("AR residual locale paths (#295)", () => {
  test("/ar/compare/units Done CTA stays under /ar/projects", async ({
    page,
  }) => {
    const units = encodeURIComponent(`${UNIT_A},${UNIT_B}`);
    const response = await page.goto(`/ar/compare/units?units=${units}`, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Done link only renders when there is at least one resolved unit.
    // AR dict compare.done = "تم"
    const done = page.locator('main a[href="/ar/projects"]', { hasText: "تم" });
    await expect(done).toBeVisible({ timeout: 20_000 });

    // No bare EN Done/browse link in main when units are present.
    await expect(page.locator('main a[href="/projects"]')).toHaveCount(0);
  });

  test("/ar/compare/units remove last unit stays on /ar/compare", async ({
    page,
  }) => {
    const units = encodeURIComponent(UNIT_A);
    await page.goto(`/ar/compare/units?units=${units}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Remove control on the unit column (AR dict compare.remove = "إزالة").
    const remove = page.getByRole("button", { name: "إزالة" });
    await expect(remove.first()).toBeVisible({ timeout: 20_000 });
    await remove.first().click();

    await expect(page).toHaveURL(/\/ar\/compare\/?(\?|$)/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/^https?:\/\/[^/]+\/compare(\?|$)/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("/ar/developers filter/search stays under /ar/developers", async ({
    page,
  }) => {
    await page.goto("/ar/developers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Search triggers router.replace with q= — must keep /ar prefix.
    const search = page.locator('main input[type="search"]');
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("emaar");
    await expect(page).toHaveURL(/\/ar\/developers\?/, { timeout: 15_000 });
    await expect(page).toHaveURL(/[?&]q=emaar/i);
    // Never drop to bare EN hub.
    await expect(page).not.toHaveURL(/^https?:\/\/[^/]+\/developers(\?|$)/);

    // City chip (if any non-all) should also stay in-locale.
    const dubaiChip = page.locator("main button, main a").filter({
      hasText: /دبي|Dubai/i,
    });
    if ((await dubaiChip.count()) > 0) {
      await dubaiChip.first().click();
      await expect(page).toHaveURL(/\/ar\/developers/, { timeout: 10_000 });
      await expect(page).not.toHaveURL(/^https?:\/\/[^/]+\/developers(\?|$)/);
    }
  });

  test("EN /developers filter still uses bare /developers", async ({
    page,
  }) => {
    await page.goto("/developers", { waitUntil: "domcontentloaded" });
    const search = page.locator('main input[type="search"]');
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill("emaar");
    await expect(page).toHaveURL(/\/developers\?/, { timeout: 15_000 });
    await expect(page).toHaveURL(/[?&]q=emaar/i);
    await expect(page).not.toHaveURL(/\/ar\/developers/);
  });

  // #330 — PaymentPlanBar stage legend + aria must not hard-code EN on AR.
  // UNIT_A is 105 Residences (10/35/5/50) → bar renders all four stages.
  test("/ar/compare/units payment-plan bar stages are Arabic (#330)", async ({
    page,
  }) => {
    const units = encodeURIComponent(UNIT_A);
    await page.goto(`/ar/compare/units?units=${units}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");

    // Wait for compare table to hydrate with unit column.
    await expect(page.getByRole("button", { name: "إزالة" }).first()).toBeVisible({
      timeout: 20_000,
    });

    const main = page.locator("main");
    // Stacked bar + legend is role=img with localized aria-label.
    const bar = main.locator('[role="img"][aria-label*="خطة السداد"]');
    await expect(bar.first()).toBeVisible({ timeout: 15_000 });

    const aria = (await bar.first().getAttribute("aria-label")) ?? "";
    expect(aria).toMatch(/عربون|أثناء الإنشاء|عند التسليم|بعد التسليم/);
    expect(aria).not.toMatch(/during construction|post-handover|on handover/i);

    // Visible legend microcopy uses short AR labels (during → أثناء).
    await expect(main.getByText(/\d+%\s+عربون|\d+%\s+أثناء|\d+%\s+عند التسليم|\d+%\s+بعد التسليم/).first()).toBeVisible();
    await expect(main.getByText("during construction")).toHaveCount(0);
    await expect(main.getByText("post-handover")).toHaveCount(0);
    await expect(main.getByText("on handover")).toHaveCount(0);
  });
});
