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
    // numberOfItems = full catalog count; itemListElement is capped for HTML budget.
    expect(itemList.mainEntity.numberOfItems).toBeGreaterThan(0);
    expect(itemList.mainEntity.itemListElement.length).toBeGreaterThan(0);
    expect(itemList.mainEntity.itemListElement.length).toBeLessThanOrEqual(24);
    expect(itemList.mainEntity.itemListElement.length).toBeLessThanOrEqual(
      itemList.mainEntity.numberOfItems,
    );
    expect(itemList.mainEntity.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
    });
    expect(itemList.mainEntity.itemListElement[0].url).toContain("/projects/");
    // EN ItemList must stay bare /projects/* (not /ar/projects/*).
    expect(itemList.mainEntity.itemListElement[0].url).not.toContain(
      "/ar/projects/",
    );
  });

  // #343 — AR developer ItemList project URLs must be locale-prefixed.
  test("AR developer ItemList JSON-LD uses /ar/projects/* URLs", async ({
    page,
  }) => {
    const response = await page.goto("/ar/developers/emaar-properties", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const schemas = blocks.map((block) => JSON.parse(block));
    const itemList = schemas.find(
      (schema) => schema.mainEntity?.["@type"] === "ItemList",
    );
    expect(itemList).toBeTruthy();
    const urls = itemList.mainEntity.itemListElement.map(
      (el: { url?: string }) => el.url ?? "",
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toContain("/ar/projects/");
      // Bare EN path after host (not /ar/projects/).
      expect(url).not.toMatch(/https?:\/\/[^/]+\/projects\//);
    }
    // Localized CollectionPage name (dict.developers.projectsByHeading).
    expect(itemList.name).toMatch(/مشاريع/);
  });

  test("developer detail first page shows project cards", async ({ page }) => {
    await page.goto("/developers/emaar-properties");
    await expect(
      page.getByRole("heading", { level: 1, name: /New & Off-Plan Projects by/i }),
    ).toBeVisible();
    // 12 cards per page (DEVELOPER_PAGE_SIZE); at least a few links into PDPs.
    const projectLinks = page.locator('a[href^="/projects/"]');
    await expect(projectLinks.first()).toBeVisible();
    expect(await projectLinks.count()).toBeGreaterThanOrEqual(4);
  });
});