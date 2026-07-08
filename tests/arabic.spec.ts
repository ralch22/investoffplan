import { test, expect } from "./fixtures";

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
});
