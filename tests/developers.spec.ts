import { test, expect } from "@playwright/test";

test.describe("Developers directory", () => {
  test("lists developers with logos and pagination", async ({ page }) => {
    await page.goto("/developers");

    await expect(
      page.getByRole("heading", { name: "Top Real Estate Developers in UAE" }),
    ).toBeVisible();

    await expect(page.getByText(/^\d+ developers$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Show projects" }).first()).toBeVisible();
    await expect(page.locator("main img[alt$='logo']").first()).toBeVisible();
  });

  test("filters developers by city", async ({ page }) => {
    await page.goto("/developers");
    await page.getByRole("button", { name: /Dubai/i }).click();
    await expect(page).toHaveURL(/city=dubai/);
  });

  test("developer detail shows logo", async ({ page }) => {
    await page.goto("/developers/emaar-properties");
    await expect(page.getByText("Emaar Properties").first()).toBeVisible();
    await expect(
      page.locator('img[alt="Emaar Properties logo"]').first(),
    ).toBeVisible();
  });

  test("developer detail emits ItemList structured data", async ({ page }) => {
    await page.goto("/developers/emaar-properties");

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const schemas = blocks.map((block) => JSON.parse(block));

    const itemList = schemas.find(
      (schema) => schema.mainEntity?.["@type"] === "ItemList",
    );
    expect(itemList).toBeTruthy();
    expect(itemList.mainEntity.numberOfItems).toBeGreaterThan(0);
    expect(itemList.mainEntity.itemListElement.length).toBe(
      itemList.mainEntity.numberOfItems,
    );
    expect(itemList.mainEntity.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
    });
    expect(itemList.mainEntity.itemListElement[0].url).toContain("/projects/");
  });
});