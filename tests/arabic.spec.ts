import { test, expect } from "./fixtures";
import { waitForCatalog } from "./helpers";

test.describe("Arabic locale", () => {
  test("/ar renders RTL with Arabic chrome", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(
      page.getByRole("heading", { level: 1, name: /المنصة الرائدة/ }),
    ).toBeVisible();
    // Nav is localized
    await expect(page.getByRole("link", { name: "المشاريع" }).first()).toBeVisible();
    // Language switcher points back to EN
    await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  });

  test("/ar/about and /ar/contact render Arabic content", async ({ page }) => {
    await page.goto("/ar/about");
    await expect(page.getByText(/متخصصون في العقارات/).first()).toBeVisible();
    await page.goto("/ar/contact");
    await expect(page.getByText(/تواصل معنا/).first()).toBeVisible();
    await expect(page.getByText(/واتساب/).first()).toBeVisible();
  });

  test("EN pages remain LTR and English", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).not.toBe("rtl");
    await expect(page.getByRole("link", { name: "Projects" }).first()).toBeVisible();
    // Switcher offers Arabic
    await expect(page.getByRole("link", { name: "العربية" })).toBeVisible();
  });

  test("/ar/projects renders RTL with Arabic SERP chrome (filter labels)", async ({ page }) => {
    await page.goto("/ar/projects");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    // Arabic filter label from serp dict
    await expect(page.getByText("نوع العقار").first()).toBeVisible();
    // Grid view toggle etc localized
    await expect(page.getByRole("button", { name: "شبكة" }).first()).toBeVisible();
  });

  // #320 — hero "properties in {location}" must not interpolate bare EN "UAE".
  test("/ar/projects hero uses Arabic all-UAE location (not EN UAE)", async ({
    page,
  }) => {
    await page.goto("/ar/projects");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    const heroSub = page.locator("section").filter({ has: page.getByRole("heading", { level: 1 }) }).locator("p").first();
    await expect(heroSub).toContainText("عقارات في");
    await expect(heroSub).toContainText("كل الإمارات");
    await expect(heroSub).not.toContainText("UAE");
  });

  // #280 — SERP developer blocks stay under /ar after catalog hydrate.
  test("/ar/projects developer spotlight/known links under /ar", async ({
    page,
  }) => {
    await page.goto("/ar/projects");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await waitForCatalog(page, {
      viewDetailsLabel: /عرض التفاصيل|View Details/,
    });
    await expect(
      page.getByRole("heading", { name: "أبرز المطوّرين بمخزون حيّ" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[href^="/ar/developers/"]').first()).toBeVisible();
    // Spotlight + known-developers must not emit bare EN developer PDPs.
    await expect(page.locator('main a[href^="/developers/"]')).toHaveCount(0);
  });
});
